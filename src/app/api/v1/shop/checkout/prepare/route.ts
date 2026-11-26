import { z } from "zod";
import { prepareShopNusaCheckoutUseCase } from "@/server/modules/shop/application/shop.usecase";
import { requirePlayerSession } from "@/server/shared/auth/authorization";
import { enforceRateLimit } from "@/server/shared/http/distributed-rate-limit";
import { assertSameOriginMutation } from "@/server/shared/auth/request-security";
import { parseJsonWithSchema } from "@/server/shared/validation/zod-helpers";
import { handleRouteError, okResponse } from "@/server/shared/http/api-response";

const prepareSchema = z.object({
  starterPackCode: z.string().min(2).max(80),
});

export async function POST(request: Request): Promise<Response> {
  try {
    assertSameOriginMutation(request);
    const session = await requirePlayerSession();
    await enforceRateLimit(`shop:checkout-prepare:${session.userId}`, {
      capacity: 6,
      refillPerSecond: 6 / 60,
    });
    const parsed = await parseJsonWithSchema(request, prepareSchema, 4096);
    const result = await prepareShopNusaCheckoutUseCase({
      userId: session.userId,
      starterPackCode: parsed.starterPackCode,
    });
    return okResponse(result);
  } catch (error: unknown) {
    return handleRouteError(error, request);
  }
}
