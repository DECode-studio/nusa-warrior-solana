import { listMyLeagueRoomsUseCase } from "@/server/modules/league/application/league.usecase";
import { requirePlayerSession } from "@/server/shared/auth/authorization";
import { enforceRateLimit } from "@/server/shared/http/distributed-rate-limit";
import { handleRouteError, okResponse } from "@/server/shared/http/api-response";

export async function GET(request: Request): Promise<Response> {
  try {
    const session = await requirePlayerSession();
    await enforceRateLimit(`league:mine:${session.userId}`, { capacity: 60, refillPerSecond: 1 });
    const response = okResponse(await listMyLeagueRoomsUseCase(session.userId));
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  } catch (error: unknown) {
    return handleRouteError(error, request);
  }
}
