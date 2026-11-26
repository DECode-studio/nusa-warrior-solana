import { z } from "zod";
import { submitBattleActionUseCase } from "@/server/modules/battle/application/battle.usecase";
import { requirePlayerSession } from "@/server/shared/auth/authorization";
import { assertSameOriginMutation } from "@/server/shared/auth/request-security";
import { handleRouteError, okResponse } from "@/server/shared/http/api-response";
import { parseJsonWithSchema } from "@/server/shared/validation/zod-helpers";
import { enforceRateLimit } from "@/server/shared/http/distributed-rate-limit";

const actionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("ROLL_DICE") }).strict(),
  z.object({ type: z.literal("PLAY_INSTRUMENT"), handInstanceId: z.string().min(1).max(160), targetRow: z.enum(["FRONT", "SECOND"]), targetIndex: z.number().int().min(0).max(2), targetSide: z.enum(["OWN", "OPPONENT"]).optional() }).strict(),
  z.object({ type: z.literal("DECLARE_ATTACK"), attackerFrontIndex: z.number().int().min(0).max(1), defenderFrontIndex: z.number().int().min(0).max(1) }).strict(),
  z.object({ type: z.literal("CONFIRM_DEFENDER_RESPONSE") }).strict(),
  z.object({ type: z.literal("CONTINUE_CLASH") }).strict(),
  z.object({ type: z.literal("PROMOTE_CHARACTER"), secondRowIndex: z.number().int().min(0).max(2) }).strict(),
  z.object({ type: z.literal("END_TURN") }).strict(),
  z.object({ type: z.literal("DISCARD_INSTRUMENT"), handInstanceId: z.string().min(1).max(160) }).strict(),
  z.object({ type: z.literal("SURRENDER") }).strict(),
]);

const submitActionSchema = z.object({
  expectedSequence: z.number().int().min(0),
  idempotencyKey: z.string().min(16).max(100),
  action: actionSchema,
}).strict();

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    assertSameOriginMutation(request);
    const { id } = await context.params;
    const session = await requirePlayerSession();
    await enforceRateLimit(`battle:action:${session.userId}`, { capacity: 30, refillPerSecond: 2 });
    const parsed = await parseJsonWithSchema(request, submitActionSchema, 8_192);
    const updated = await submitBattleActionUseCase({
      id,
      userId: session.userId,
      requestId: request.headers.get("x-request-id") ?? undefined,
      expectedSequence: parsed.expectedSequence,
      idempotencyKey: parsed.idempotencyKey,
      action: parsed.action,
    });
    const response = okResponse(updated);
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  } catch (error: unknown) {
    return handleRouteError(error, request);
  }
}
