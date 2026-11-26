import { z } from "zod";
import { joinLeagueByCodeUseCase } from "@/server/modules/league/application/league.usecase";
import { requirePlayerSession } from "@/server/shared/auth/authorization";
import { assertSameOriginMutation } from "@/server/shared/auth/request-security";
import { enforceRateLimit } from "@/server/shared/http/distributed-rate-limit";
import { handleRouteError, okResponse } from "@/server/shared/http/api-response";
import { parseJsonWithSchema } from "@/server/shared/validation/zod-helpers";

const joinByCodeSchema = z.object({
  joinCode: z.string().min(8).max(16),
  role: z.enum(["PARTICIPANT", "SPECTATOR"]),
  deckId: z.string().min(1).max(128).nullable(),
  stakeCardSlug: z.string().min(1).max(128).nullable(),
}).strict();

export async function POST(request: Request): Promise<Response> {
  try {
    assertSameOriginMutation(request);
    const session = await requirePlayerSession();
    await enforceRateLimit(`league:join-code:${session.userId}`, { capacity: 10, refillPerSecond: 10 / 60 });
    const input = await parseJsonWithSchema(request, joinByCodeSchema, 8_192);
    const response = okResponse(await joinLeagueByCodeUseCase({ ...input, userId: session.userId }));
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  } catch (error: unknown) {
    return handleRouteError(error, request);
  }
}
