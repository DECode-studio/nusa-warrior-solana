import { z } from "zod";
import { completeStoryMissionUseCase } from "@/server/modules/story-mode/application/story.usecase";
import { requirePlayerSession } from "@/server/shared/auth/authorization";
import { assertSameOriginMutation } from "@/server/shared/auth/request-security";
import { handleRouteError, okResponse } from "@/server/shared/http/api-response";
import { enforceRateLimit } from "@/server/shared/http/distributed-rate-limit";
import { parseJsonWithSchema } from "@/server/shared/validation/zod-helpers";

const completeStoryMissionSchema = z.object({
  battleSessionId: z.string().min(1).max(128),
}).strict();

export async function POST(request: Request): Promise<Response> {
  try {
    assertSameOriginMutation(request);
    const session = await requirePlayerSession();
    await enforceRateLimit(`story-mode:complete:${session.userId}`, { capacity: 20, refillPerSecond: 1 / 3 });
    const input = await parseJsonWithSchema(request, completeStoryMissionSchema, 4_096);
    const response = okResponse(await completeStoryMissionUseCase({ userId: session.userId, battleSessionId: input.battleSessionId }));
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  } catch (error: unknown) {
    return handleRouteError(error, request);
  }
}
