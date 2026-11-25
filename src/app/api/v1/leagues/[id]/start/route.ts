import { z } from "zod";
import { startLeagueUseCase } from "@/server/modules/league/application/league.usecase";
import { requirePlayerSession } from "@/server/shared/auth/authorization";
import { assertSameOriginMutation } from "@/server/shared/auth/request-security";
import { enforceRateLimit } from "@/server/shared/http/distributed-rate-limit";
import { handleRouteError, okResponse } from "@/server/shared/http/api-response";

interface RouteContext { params: Promise<{ id: string }> }

export async function POST(request: Request, context: RouteContext): Promise<Response> {
  try {
    assertSameOriginMutation(request);
    const session = await requirePlayerSession();
    await enforceRateLimit(`league:start:${session.userId}`, { capacity: 5, refillPerSecond: 1 / 60 });
    const { id: rawId } = await context.params;
    const id = z.string().uuid().parse(rawId);
    const response = okResponse(await startLeagueUseCase({ id, userId: session.userId }));
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  } catch (error: unknown) {
    return handleRouteError(error, request);
  }
}
