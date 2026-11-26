import { requirePlayerSession } from "@/server/shared/auth/authorization";
import { handleRouteError, okResponse } from "@/server/shared/http/api-response";
import { enforceRateLimit } from "@/server/shared/http/distributed-rate-limit";
import { getStoryModeUseCase } from "@/server/modules/story-mode/application/story.usecase";

export async function GET(request: Request): Promise<Response> {
  try {
    const session = await requirePlayerSession();
    await enforceRateLimit(`story-mode:read:${session.userId}`, { capacity: 30, refillPerSecond: 0.5 });
    const response = okResponse(await getStoryModeUseCase(session.userId));
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  } catch (error: unknown) {
    return handleRouteError(error, request);
  }
}
