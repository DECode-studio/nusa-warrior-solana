import "server-only";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AppError } from "../errors/app-error";
import { randomUUID } from "node:crypto";
import { logServerEvent } from "../logging/server-logger";
import {
  localizeServerMessage,
  resolveServerLocale,
} from "@/core/translator/server-messages";

export interface ApiSuccessBody<T> {
  success: true;
  data: T;
  meta?: Record<string, string | number | boolean>;
}

export interface ApiErrorBody {
  success: false;
  error: {
    code: string;
    messageKey: string;
    message: string;
    messageParams?: Record<string, string | number>;
    details?: Record<string, string[]>;
  };
}

export function okResponse<T>(
  data: T,
  status = 200,
  meta?: Record<string, string | number | boolean>
): NextResponse<ApiSuccessBody<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(meta ? { meta } : {}),
    },
    { status }
  );
}

export function handleRouteError(
  error: unknown,
  request?: Request
): NextResponse<ApiErrorBody> {
  const locale = resolveServerLocale(
    request?.headers.get("x-app-locale"),
    request?.headers.get("accept-language")
  );
  const requestId = request?.headers.get("x-request-id") ?? randomUUID();
  const route = request ? new URL(request.url).pathname : "unknown";
  const method = request?.method ?? "UNKNOWN";
  const moduleName = route.split("/")[3] ?? "unknown";
  const logContext = { requestId, method, route, module: moduleName };

  const finish = (response: NextResponse<ApiErrorBody>): NextResponse<ApiErrorBody> => {
    response.headers.set("x-request-id", requestId);
    response.headers.set("Content-Language", locale);
    response.headers.set("Cache-Control", "no-store");
    return response;
  };

  if (error instanceof AppError) {
    logServerEvent(error.statusCode >= 500 ? "error" : "warn", "api.request.failed", {
      ...logContext,
      statusCode: error.statusCode,
      errorCode: error.code,
      errorName: error.name,
      message: error.message,
    });
    const localized = localizeServerMessage(
      error.statusCode >= 500 ? "Terjadi kesalahan internal server." : error.message,
      locale,
      error.code
    );
    const localizedDetails = error.details
      ? Object.fromEntries(
          Object.entries(error.details).map(([path, messages]) => [
            path,
            messages.map((message) =>
              localizeServerMessage(message, locale, error.code).message
            ),
          ])
        )
      : undefined;
    const response = NextResponse.json(
      {
        success: false as const,
        error: {
          code: error.code,
          messageKey: localized.messageKey,
          message: localized.message,
          ...(localized.messageParams ? { messageParams: localized.messageParams } : {}),
          ...(localizedDetails ? { details: localizedDetails } : {}),
        },
      },
      { status: error.statusCode }
    );
    if (error.retryAfterSeconds) {
      response.headers.set("Retry-After", String(error.retryAfterSeconds));
    }
    return finish(response);
  }

  if (error instanceof ZodError) {
    const details: Record<string, string[]> = {};
    for (const issue of error.issues) {
      const pathKey = issue.path.join(".") || "root";
      const existing = details[pathKey] ?? [];
      existing.push(localizeServerMessage(issue.message, locale, "VALIDATION_ERROR").message);
      details[pathKey] = existing;
    }
    logServerEvent("warn", "api.request.validation_failed", {
      ...logContext,
      statusCode: 422,
      issueCount: error.issues.length,
      issuePaths: [...new Set(error.issues.map((issue) => issue.path.join(".") || "root"))],
    });
    return finish(NextResponse.json(
      {
        success: false as const,
        error: {
          code: "VALIDATION_ERROR",
          messageKey: "api.error.validation",
          message: localizeServerMessage("Input validation failed", locale, "VALIDATION_ERROR").message,
          details,
        },
      },
      { status: 422 }
    ));
  }

  const errorObject = error instanceof Error ? error : new Error("Unknown thrown value");
  logServerEvent("error", "api.request.unhandled_error", {
    ...logContext,
    statusCode: 500,
    errorName: errorObject.name,
    message: errorObject.message,
    stack: errorObject.stack,
  });

  return finish(NextResponse.json(
    {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        messageKey: "api.error.internal",
        message: localizeServerMessage("Terjadi kesalahan internal server.", locale, "INTERNAL_ERROR").message,
      },
    },
    { status: 500 }
  ));
}

