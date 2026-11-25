import "server-only";

export type AppErrorCode =
  | "BAD_REQUEST"
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "TOO_MANY_REQUESTS"
  | "INTERNAL_ERROR";

export class AppError extends Error {
  public readonly code: AppErrorCode;
  public readonly statusCode: number;
  public readonly details?: Record<string, string[]>;
  public readonly retryAfterSeconds?: number;

  constructor(
    code: AppErrorCode,
    message: string,
    statusCode = 400,
    details?: Record<string, string[]>,
    retryAfterSeconds?: number
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.retryAfterSeconds = retryAfterSeconds;
  }

  public static badRequest(
    message: string,
    details?: Record<string, string[]>
  ): AppError {
    return new AppError("BAD_REQUEST", message, 400, details);
  }

  public static validation(
    message: string,
    details?: Record<string, string[]>
  ): AppError {
    return new AppError("VALIDATION_ERROR", message, 422, details);
  }

  public static unauthorized(message = "Unauthorized"): AppError {
    return new AppError("UNAUTHORIZED", message, 401);
  }

  public static forbidden(message = "Forbidden"): AppError {
    return new AppError("FORBIDDEN", message, 403);
  }

  public static notFound(message = "Resource not found"): AppError {
    return new AppError("NOT_FOUND", message, 404);
  }

  public static conflict(message: string): AppError {
    return new AppError("CONFLICT", message, 409);
  }

  public static tooManyRequests(
    retryAfterSeconds = 1,
    message = "Terlalu banyak permintaan. Coba lagi sebentar."
  ): AppError {
    return new AppError("TOO_MANY_REQUESTS", message, 429, undefined, retryAfterSeconds);
  }

  public static internal(message = "Internal server error"): AppError {
    return new AppError("INTERNAL_ERROR", message, 500);
  }
}

