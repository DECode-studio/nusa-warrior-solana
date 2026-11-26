import { z } from "zod";
import { requireAdminSession } from "@/server/shared/auth/authorization";
import { assertSameOriginMutation } from "@/server/shared/auth/request-security";
import { enforceRateLimit } from "@/server/shared/http/distributed-rate-limit";
import { parseJsonWithSchema } from "@/server/shared/validation/zod-helpers";
import { reviewCustomCardUseCase } from "@/server/modules/card/application/custom-card.usecase";
import { handleRouteError, okResponse } from "@/server/shared/http/api-response";

const reviewSchema = z.object({
  action: z.enum(["APPROVE", "REJECT"]),
  rejectionReason: z.string().max(250).optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, context: RouteParams): Promise<Response> {
  try {
    assertSameOriginMutation(request);
    const session = await requireAdminSession();
    await enforceRateLimit(`admin:custom-card:review:${session.userId}`, {
      capacity: 30,
      refillPerSecond: 1,
    });

    const { id } = await context.params;
    const body = await parseJsonWithSchema(request, reviewSchema);

    const updated = await reviewCustomCardUseCase(
      session.userId,
      id,
      body.action,
      body.rejectionReason,
    );

    return okResponse(updated);
  } catch (error: unknown) {
    return handleRouteError(error, request);
  }
}

