import { requirePlayerSession } from "@/server/shared/auth/authorization";
import { assertSameOriginMutation } from "@/server/shared/auth/request-security";
import { enforceRateLimit } from "@/server/shared/http/distributed-rate-limit";
import { handleRouteError, okResponse } from "@/server/shared/http/api-response";
import { prepareNusaClaimUseCase } from "@/server/modules/nusa-points/application/nusa-claim.usecase";

export async function POST(request: Request): Promise<Response> {
  try {
    assertSameOriginMutation(request);
    const session = await requirePlayerSession();
    await enforceRateLimit(`solana:claim-prepare:${session.userId}`, {
      capacity: 4,
      refillPerSecond: 1 / 15,
    });

    const result = await prepareNusaClaimUseCase({
      userId: session.userId,
      sessionWallet: session.walletAddress,
    });
    return okResponse(result);
  } catch (error: unknown) {
    return handleRouteError(error, request);
  }
}
