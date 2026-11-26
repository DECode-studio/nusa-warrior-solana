import { z } from "zod";
import { requirePlayerSession } from "@/server/shared/auth/authorization";
import { assertSameOriginMutation } from "@/server/shared/auth/request-security";
import { parseJsonWithSchema } from "@/server/shared/validation/zod-helpers";
import { handleRouteError, okResponse } from "@/server/shared/http/api-response";
import { confirmNusaClaimUseCase } from "@/server/modules/nusa-points/application/nusa-claim.usecase";

const confirmSchema = z.object({
  claimId: z.string().min(8).max(80),
  amount: z.number().int().positive(),
  txSignature: z.string().trim().min(32).max(128),
});

export async function POST(request: Request): Promise<Response> {
  try {
    assertSameOriginMutation(request);
    const session = await requirePlayerSession();
    const parsed = await parseJsonWithSchema(request, confirmSchema, 4096);

    const result = await confirmNusaClaimUseCase({
      userId: session.userId,
      sessionWallet: session.walletAddress,
      claimId: parsed.claimId,
      amount: parsed.amount,
      txSignature: parsed.txSignature,
    });
    return okResponse(result);
  } catch (error: unknown) {
    return handleRouteError(error, request);
  }
}
