import { z } from "zod";
import { joinLeagueRoomUseCase } from "@/server/modules/league/application/league.usecase";
import { requirePlayerSession } from "@/server/shared/auth/authorization";
import { assertSameOriginMutation } from "@/server/shared/auth/request-security";
import { enforceRateLimit } from "@/server/shared/http/distributed-rate-limit";
import { handleRouteError, okResponse } from "@/server/shared/http/api-response";
import { parseJsonWithSchema } from "@/server/shared/validation/zod-helpers";

const joinSchema = z.object({
  joinCode: z.string().min(8).max(16).nullable(),
  role: z.enum(["PARTICIPANT", "SPECTATOR"]),
  deckId: z.string().min(1).max(128).nullable(),
  stakeCardSlug: z.string().min(1).max(128).nullable(),
}).strict();

interface RouteContext { params: Promise<{ id: string }> }

export async function POST(request: Request, context: RouteContext): Promise<Response> {
  try {
    assertSameOriginMutation(request);
    const session = await requirePlayerSession();
    await enforceRateLimit(`league:join:${session.userId}`, { capacity: 10, refillPerSecond: 10 / 60 });
    const { id: rawId } = await context.params;
    const id = z.string().uuid().parse(rawId);
    const input = await parseJsonWithSchema(request, joinSchema, 8_192);
    const response = okResponse(await joinLeagueRoomUseCase({ ...input, id, userId: session.userId }));
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  } catch (error: unknown) {
    return handleRouteError(error, request);
  }
}
