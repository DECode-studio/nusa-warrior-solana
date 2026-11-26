import { z } from "zod";
import {
  cancelQuickMatchQueueUseCase,
  getQuickMatchQueueStatusUseCase,
} from "@/server/modules/battle/application/battle.usecase";
import { joinQuickMatchQueueUseCase } from "@/server/modules/battle/application/battle.usecase";
import { requirePlayerSession } from "@/server/shared/auth/authorization";
import { assertSameOriginMutation } from "@/server/shared/auth/request-security";
import { handleRouteError, okResponse } from "@/server/shared/http/api-response";
import { parseJsonWithSchema } from "@/server/shared/validation/zod-helpers";
import { enforceRateLimit } from "@/server/shared/http/distributed-rate-limit";

const quickMatchSchema = z.object({
  deckId: z.string().min(1).max(128),
  idempotencyKey: z.string().min(16).max(100),
  acceptCardStake: z.literal(true),
}).strict();

export async function GET(request: Request): Promise<Response> {
  try {
    const session = await requirePlayerSession();
    await enforceRateLimit(`battle:quick-match:status:${session.userId}`, { capacity: 60, refillPerSecond: 2 });
    const response = okResponse(await getQuickMatchQueueStatusUseCase(session.userId));
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
    await enforceRateLimit(`battle:quick-match:join:${session.userId}`, { capacity: 5, refillPerSecond: 5 / 60 });
    const parsed = await parseJsonWithSchema(request, quickMatchSchema, 8_192);
    const response = okResponse(await joinQuickMatchQueueUseCase({
      userId: session.userId,
      deckId: parsed.deckId,
      idempotencyKey: parsed.idempotencyKey,
      acceptCardStake: parsed.acceptCardStake,
    }), 202);
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  } catch (error: unknown) {
    return handleRouteError(error, request);
  }
}

export async function DELETE(request: Request): Promise<Response> {
  try {
    assertSameOriginMutation(request);
    const session = await requirePlayerSession();
    await enforceRateLimit(`battle:quick-match:cancel:${session.userId}`, { capacity: 10, refillPerSecond: 10 / 60 });
    const cancelled = await cancelQuickMatchQueueUseCase(session.userId);
    const response = okResponse({ cancelled });
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  } catch (error: unknown) {
    return handleRouteError(error, request);
  }
}
