import { getBattleSessionUseCase } from "@/server/modules/battle/application/battle.usecase";
import { requirePlayerSession } from "@/server/shared/auth/authorization";
import { handleRouteError, okResponse } from "@/server/shared/http/api-response";
import { enforceRateLimit } from "@/server/shared/http/distributed-rate-limit";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    const { id } = await context.params;
    const session = await requirePlayerSession();
    await enforceRateLimit(`battle:read:${session.userId}`, { capacity: 120, refillPerSecond: 2 });
    const response = okResponse(await getBattleSessionUseCase(id, session.userId));
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  } catch (error: unknown) {
    return handleRouteError(error, request);
  }
}
