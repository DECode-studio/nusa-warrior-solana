import { z } from "zod";
import { createLeagueRoomUseCase, listPublicLeagueRoomsUseCase } from "@/server/modules/league/application/league.usecase";
import { requirePlayerSession } from "@/server/shared/auth/authorization";
import { assertSameOriginMutation } from "@/server/shared/auth/request-security";
import { enforceRateLimit } from "@/server/shared/http/distributed-rate-limit";
import { handleRouteError, okResponse } from "@/server/shared/http/api-response";
import { parseJsonWithSchema } from "@/server/shared/validation/zod-helpers";

const rulesSchema = z.object({
  stakeMode: z.enum(["FIXED_CARD", "BATTLE_POWER"]),
  fixedCardSlug: z.string().min(1).max(128).nullable(),
  battlePowerTarget: z.number().int().positive().max(2_000).nullable(),
  kingdom: z.enum(["MAJAPAHIT", "PAJAJARAN", "NUSANTARA_UMUM"]).nullable(),
  battleDurationMinutes: z.number().int().min(1).max(120).nullable(),
}).strict();

const createSchema = z.object({
  visibility: z.enum(["PUBLIC", "PRIVATE"]),
  maxParticipants: z.number().int().min(2).max(32).nullable(),
  registrationDurationMinutes: z.number().int().min(5).max(1_440),
  startMode: z.enum(["AUTO", "MANUAL"]),
  startDelayMinutes: z.union([z.literal(3), z.literal(5), z.literal(10)]),
  creatorRole: z.enum(["PARTICIPANT", "SPECTATOR"]),
  deckId: z.string().min(1).max(128).nullable(),
  stakeCardSlug: z.string().min(1).max(128).nullable(),
  rules: rulesSchema,
}).strict();

export async function GET(request: Request): Promise<Response> {
  try {
    const session = await requirePlayerSession();
    await enforceRateLimit(`league:list:${session.userId}`, { capacity: 60, refillPerSecond: 1 });
    const response = okResponse(await listPublicLeagueRoomsUseCase(session.userId));
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  } catch (error: unknown) {
    return handleRouteError(error, request);
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    assertSameOriginMutation(request);
    const session = await requirePlayerSession();
    await enforceRateLimit(`league:create:${session.userId}`, { capacity: 5, refillPerSecond: 5 / 60 });
    const input = await parseJsonWithSchema(request, createSchema, 8_192);
    const created = await createLeagueRoomUseCase({ ...input, userId: session.userId });
    const response = okResponse(created, 201);
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  } catch (error: unknown) {
    return handleRouteError(error, request);
  }
}
