import { refreshAuthSession } from "./auth-refresh";

export class ApiClientError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly requestId: string | null;
  public readonly messageKey: string | null;
  public readonly messageParams: Record<string, string | number> | null;
  public readonly details: Record<string, string[]> | null;

  constructor(
    message: string,
    status: number,
    code: string,
    requestId: string | null = null,
    messageKey: string | null = null,
    messageParams: Record<string, string | number> | null = null,
    details: Record<string, string[]> | null = null,
  ) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.code = code;
    this.requestId = requestId;
    this.messageKey = messageKey;
    this.messageParams = messageParams;
    this.details = details;
  }
}

export interface ApiRequestOptions {
  body?: unknown;
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean | undefined>;
}

interface EnvelopePayload<T> {
  success?: boolean;
  data?: T;
  error?: {
    code?: string;
    messageKey?: string;
    message?: string;
    messageParams?: Record<string, string | number>;
    details?: Record<string, string[]>;
  };
  message?: string;
  code?: string;
}

function buildUrl(
  path: string,
  params?: Record<string, string | number | boolean | undefined>
): string {
  if (!params) return path;
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      searchParams.set(key, String(value));
    }
  }
  const queryString = searchParams.toString();
  return queryString ? `${path}?${queryString}` : path;
}

async function request<T>(
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  path: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const url = buildUrl(path, options.params);
  const pathLocale = typeof window === "undefined"
    ? undefined
    : window.location.pathname.split("/")[1];
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  const headers: Record<string, string> = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(pathLocale && ["id", "en", "zh"].includes(pathLocale)
      ? { "x-app-locale": pathLocale }
      : {}),
    ...(options.headers ?? {}),
  };

  const init: RequestInit = {
    method,
    headers,
    credentials: "include",
    ...(path.startsWith("/api/v1/auth/") ? { cache: "no-store" as const } : {}),
    body: isFormData
      ? (options.body as FormData)
      : options.body !== undefined
        ? JSON.stringify(options.body)
        : undefined,
  };
  let response = await fetch(url, init);
  const shouldRefresh = response.status === 401 &&
    typeof window !== "undefined" &&
    path !== "/api/v1/auth/login" &&
    path !== "/api/v1/auth/logout" &&
    path !== "/api/v1/auth/refresh";
  if (shouldRefresh && await refreshAuthSession({ force: true })) {
    response = await fetch(url, init);
  }

  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`;
    let errorCode = "HTTP_ERROR";
    let messageKey: string | null = null;
    let messageParams: Record<string, string | number> | null = null;
    let details: Record<string, string[]> | null = null;
    try {
      const parsed = (await response.json()) as EnvelopePayload<unknown>;
      if (parsed.error?.message) {
        errorMessage = parsed.error.message;
      } else if (typeof parsed.message === "string") {
        errorMessage = parsed.message;
      }
      if (parsed.error?.code) {
        errorCode = parsed.error.code;
      } else if (typeof parsed.code === "string") {
        errorCode = parsed.code;
      }
      messageKey = parsed.error?.messageKey ?? null;
      messageParams = parsed.error?.messageParams ?? null;
      details = parsed.error?.details ?? null;
    } catch {
      // Fallback to default message if JSON parsing fails
    }
    throw new ApiClientError(
      errorMessage,
      response.status,
      errorCode,
      response.headers.get("x-request-id"),
      messageKey,
      messageParams,
      details,
    );
  }

  const parsed = (await response.json()) as EnvelopePayload<T> | T;
  if (
    parsed &&
    typeof parsed === "object" &&
    "success" in parsed &&
    "data" in parsed
  ) {
    return (parsed as EnvelopePayload<T>).data as T;
  }
  return parsed as T;
}

export const apiClient = {
  get: <T>(
    path: string,
    params?: Record<string, string | number | boolean | undefined>
  ): Promise<T> => request<T>("GET", path, { params }),
  post: <T, B = unknown>(path: string, body?: B): Promise<T> =>
    request<T>("POST", path, { body }),
  postFormData: <T>(path: string, formData: FormData): Promise<T> =>
    request<T>("POST", path, { body: formData }),
  put: <T, B = unknown>(path: string, body?: B): Promise<T> =>
    request<T>("PUT", path, { body }),
  patch: <T, B = unknown>(path: string, body?: B): Promise<T> =>
    request<T>("PATCH", path, { body }),
  delete: <T>(path: string): Promise<T> => request<T>("DELETE", path),
} as const;

