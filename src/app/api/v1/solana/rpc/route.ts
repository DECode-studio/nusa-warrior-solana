import { NextResponse } from "next/server";
import { forwardSolanaJsonRpc } from "@/server/modules/solana/solana-config";
import { assertSameOriginMutation } from "@/server/shared/auth/request-security";
import { handleRouteError } from "@/server/shared/http/api-response";
import { AppError } from "@/server/shared/errors/app-error";

const ALLOWED_RPC_METHODS = new Set([
  "getAccountInfo",
  "getBalance",
  "getBlockHeight",
  "getEpochInfo",
  "getFeeForMessage",
  "getLatestBlockhash",
  "getMinimumBalanceForRentExemption",
  "getMultipleAccountsInfo",
  "getMultipleAccounts",
  "getParsedTokenAccountsByOwner",
  "getRecentPrioritizationFees",
  "getSignatureStatuses",
  "getSlot",
  "getTokenAccountsByOwner",
  "getTransaction",
  "isBlockhashValid",
  "sendTransaction",
  "simulateTransaction",
]);

function validateRpcPayload(payload: unknown): void {
  const items = Array.isArray(payload) ? payload : [payload];
  if (items.length === 0 || items.length > 20) {
    throw AppError.badRequest("Payload JSON-RPC tidak valid.");
  }
  for (const item of items) {
    if (
      !item ||
      typeof item !== "object" ||
      typeof (item as { method?: unknown }).method !== "string"
    ) {
      throw AppError.badRequest("Metode JSON-RPC tidak valid.");
    }
    const method = (item as { method: string }).method;
    if (!ALLOWED_RPC_METHODS.has(method)) {
      throw AppError.forbidden(`Metode RPC '${method}' tidak diizinkan.`);
    }
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    assertSameOriginMutation(request);
    const payload = (await request.json()) as unknown;
    validateRpcPayload(payload);

    const result = await forwardSolanaJsonRpc(payload);
    return NextResponse.json(result.body, {
      status: result.status,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error: unknown) {
    return handleRouteError(error, request);
  }
}
