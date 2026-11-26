import { z } from "zod";
import { parseJsonWithSchema } from "@/server/shared/validation/zod-helpers";
import { handleRouteError, okResponse } from "@/server/shared/http/api-response";
import { quoteAmmSwap } from "@/server/modules/solana/nusa-amm-dex.service";

const quoteSchema = z.object({
  poolId: z.enum(["IDRC_NUSA", "USDC_NUSA", "IDRC_USDC"]),
  inputSymbol: z.enum(["NUSA", "IDRC", "USDC"]),
  inputUiAmount: z.number().positive(),
  slippageBps: z.number().int().min(10).max(2000).optional(),
});

export async function POST(request: Request): Promise<Response> {
  try {
    const parsed = await parseJsonWithSchema(request, quoteSchema, 4096);
    const result = await quoteAmmSwap(parsed);
    return okResponse(result.quote);
  } catch (error: unknown) {
    return handleRouteError(error, request);
  }
}
