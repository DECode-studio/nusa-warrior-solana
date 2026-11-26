import { z } from "zod";
import { PublicKey } from "@solana/web3.js";
import { assertSameOriginMutation } from "@/server/shared/auth/request-security";
import { enforceRateLimit } from "@/server/shared/http/distributed-rate-limit";
import { parseJsonWithSchema } from "@/server/shared/validation/zod-helpers";
import { handleRouteError, okResponse } from "@/server/shared/http/api-response";
import { AppError } from "@/server/shared/errors/app-error";
import { buildAmmSwapTransaction } from "@/server/modules/solana/nusa-amm-dex.service";

const swapSchema = z.object({
  traderWallet: z.string().trim().min(32).max(64),
  poolId: z.enum(["IDRC_NUSA", "USDC_NUSA", "IDRC_USDC"]),
  inputSymbol: z.enum(["NUSA", "IDRC", "USDC"]),
  inputUiAmount: z.number().positive(),
  slippageBps: z.number().int().min(10).max(2000).optional(),
});

export async function POST(request: Request): Promise<Response> {
  try {
    assertSameOriginMutation(request);
    const parsed = await parseJsonWithSchema(request, swapSchema, 4096);

    try {
      new PublicKey(parsed.traderWallet);
    } catch {
      throw AppError.badRequest("Alamat wallet Solana tidak valid.");
    }

    await enforceRateLimit(`solana:dex-swap:${parsed.traderWallet}`, {
      capacity: 10,
      refillPerSecond: 1 / 5,
    });

    const result = await buildAmmSwapTransaction(parsed);
    return okResponse(result);
  } catch (error: unknown) {
    return handleRouteError(error, request);
  }
}
