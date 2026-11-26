import { createHmac, timingSafeEqual } from "node:crypto";
import { handleMenuKitaPaymentCallbackUseCase } from "@/server/modules/shop/application/shop.usecase";
import { AppError } from "@/server/shared/errors/app-error";
import { handleRouteError, okResponse } from "@/server/shared/http/api-response";

interface CallbackEnvelope {
  mode: "dev" | "prod";
  payload: Record<string, unknown>;
}

function verifyBridgeSignature(body: string, received: string | null): void {
  const secret = process.env.NUSA_WARRIOR_PAYMENT_CALLBACK_SECRET?.trim();
  if (!secret) throw AppError.internal("Secret callback payment belum dikonfigurasi.");
  if (!received || !/^[a-f0-9]{64}$/i.test(received)) {
    throw AppError.unauthorized("Signature callback tidak valid.");
  }
  const expected = createHmac("sha256", secret).update(body).digest();
  const actual = Buffer.from(received, "hex");
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    throw AppError.unauthorized("Signature callback tidak valid.");
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const rawBody = await request.text();
    verifyBridgeSignature(rawBody, request.headers.get("x-nusa-warrior-bridge-signature"));
    let parsed: unknown;
    try {
      parsed = JSON.parse(rawBody) as unknown;
    } catch {
      throw AppError.badRequest("Format callback tidak valid.");
    }
    if (!parsed || typeof parsed !== "object" || !("mode" in parsed) || !("payload" in parsed)) {
      throw AppError.badRequest("Envelope callback tidak valid.");
    }
    const envelope = parsed as CallbackEnvelope;
    if ((envelope.mode !== "dev" && envelope.mode !== "prod") || !envelope.payload || typeof envelope.payload !== "object") {
      throw AppError.badRequest("Data callback tidak valid.");
    }
    const result = await handleMenuKitaPaymentCallbackUseCase({
      mode: envelope.mode === "prod" ? "PROD" : "DEV",
      payload: envelope.payload,
    });
    return okResponse(result);
  } catch (error: unknown) {
    return handleRouteError(error, request);
  }
}
