import { z } from "zod";
import { getLeagueRoomUseCase } from "@/server/modules/league/application/league.usecase";
import { requirePlayerSession } from "@/server/shared/auth/authorization";
import { enforceRateLimit } from "@/server/shared/http/distributed-rate-limit";
import { handleRouteError, okResponse } from "@/server/shared/http/api-response";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, context: RouteContext): Promise<Response> {
  try {
    const session = await requirePlayerSession();
    await enforceRateLimit(`league:read:${session.userId}`, { capacity: 120, refillPerSecond: 2 });
    const { id: rawId } = await context.params;
    const id = z.string().uuid().parse(rawId);
    const response = okResponse(await getLeagueRoomUseCase({ id, userId: session.userId }));
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  } catch (error: unknown) {
    return handleRouteError(error, request);
  }
}
