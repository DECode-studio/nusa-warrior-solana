import { z } from "zod";
import { startStoryMissionUseCase } from "@/server/modules/story-mode/application/story.usecase";
import { requirePlayerSession } from "@/server/shared/auth/authorization";
import { assertSameOriginMutation } from "@/server/shared/auth/request-security";
import { handleRouteError, okResponse } from "@/server/shared/http/api-response";
import { enforceRateLimit } from "@/server/shared/http/distributed-rate-limit";
import { parseJsonWithSchema } from "@/server/shared/validation/zod-helpers";

const startStoryMissionSchema = z.object({
  kingdom: z.enum(["MAJAPAHIT", "PAJAJARAN"]),
  missionId: z.string().min(1).max(100),
  choiceId: z.string().min(1).max(64).nullable(),
  deckId: z.string().min(1).max(128),
  idempotencyKey: z.string().min(16).max(100),
}).strict();

export async function POST(request: Request): Promise<Response> {
  try {
    assertSameOriginMutation(request);
    const session = await requirePlayerSession();
    await enforceRateLimit(`story-mode:start:${session.userId}`, { capacity: 8, refillPerSecond: 8 / 60 });
    const input = await parseJsonWithSchema(request, startStoryMissionSchema, 8_192);
    const result = await startStoryMissionUseCase({
      userId: session.userId,
      kingdom: input.kingdom,
      missionId: input.missionId,
      choiceId: input.choiceId,
      deckId: input.deckId,
      createRequestKey: input.idempotencyKey,
    });
    const response = okResponse(result, 201);
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  } catch (error: unknown) {
    return handleRouteError(error, request);
  }
}
