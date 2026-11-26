import { reconnectLatestActiveBattleSessionUseCase } from "@/server/modules/battle/application/battle.usecase";
import { requirePlayerSession } from "@/server/shared/auth/authorization";
import { handleRouteError, okResponse } from "@/server/shared/http/api-response";
import { enforceRateLimit } from "@/server/shared/http/distributed-rate-limit";

export async function GET(request: Request): Promise<Response> {
  try {
    const session = await requirePlayerSession();
    await enforceRateLimit(`battle:resume:${session.userId}`, {
      capacity: 12,
      refillPerSecond: 12 / 60,
    });
    const response = okResponse(
      await reconnectLatestActiveBattleSessionUseCase(session.userId)
    );
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  } catch (error: unknown) {
    return handleRouteError(error, request);
  }
}
