import { z } from "zod";
import { AppError } from "@/server/shared/errors/app-error";

export async function parseJsonWithSchema<T>(
  request: Request,
  schema: z.ZodType<T>,
  maxBytes = 131_072
): Promise<T> {
  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (declaredLength > maxBytes) {
    throw AppError.badRequest("Ukuran request terlalu besar.");
  }
  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > maxBytes) {
    throw AppError.badRequest("Ukuran request terlalu besar.");
  }
  let rawBody: unknown;
  try {
    rawBody = JSON.parse(text) as unknown;
  } catch {
    throw AppError.validation("Body harus berupa JSON yang valid.");
  }
  const parsed = schema.safeParse(rawBody);
  if (!parsed.success) {
    throw parsed.error;
  }
  return parsed.data;
}
