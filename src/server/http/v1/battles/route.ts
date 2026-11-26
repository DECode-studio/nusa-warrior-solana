import { z } from "zod";
import { createBattleSessionUseCase } from "@/server/modules/battle/application/battle.usecase";
import { requirePlayerSession } from "@/server/shared/auth/authorization";
import { assertSameOriginMutation } from "@/server/shared/auth/request-security";
import { handleRouteError, okResponse } from "@/server/shared/http/api-response";
import { parseJsonWithSchema } from "@/server/shared/validation/zod-helpers";
import { enforceRateLimit } from "@/server/shared/http/distributed-rate-limit";

const createBattleSchema = z.object({
  deckId: z.string().min(1).max(128),
  idempotencyKey: z.string().min(16).max(100),
  botDifficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
}).strict();

export async function POST(request: Request): Promise<Response> {
  try {
    assertSameOriginMutation(request);
    const session = await requirePlayerSession();
    await enforceRateLimit(`battle:create:${session.userId}`, { capacity: 5, refillPerSecond: 5 / 60 });
    const parsed = await parseJsonWithSchema(request, createBattleSchema, 8_192);
    const created = await createBattleSessionUseCase({
      userId: session.userId,
      requestId: request.headers.get("x-request-id") ?? undefined,
      createRequestKey: parsed.idempotencyKey,
      deckId: parsed.deckId,
      botDifficulty: parsed.botDifficulty,
    });
    const response = okResponse(created, 201);
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  } catch (error: unknown) {
    return handleRouteError(error, request);
  }
}
