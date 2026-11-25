import { reconnectBattleSessionUseCase } from "@/server/modules/battle/application/battle.usecase";
import { requirePlayerSession } from "@/server/shared/auth/authorization";
import { assertSameOriginMutation } from "@/server/shared/auth/request-security";
import { enforceRateLimit } from "@/server/shared/http/distributed-rate-limit";
import { handleRouteError, okResponse } from "@/server/shared/http/api-response";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    assertSameOriginMutation(request);
    const session = await requirePlayerSession();
    await enforceRateLimit(`battle:reconnect:${session.userId}`, { capacity: 120, refillPerSecond: 2 });
    const { id } = await context.params;
    const response = okResponse(await reconnectBattleSessionUseCase(id, session.userId));
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  } catch (error: unknown) {
    return handleRouteError(error, request);
  }
}
