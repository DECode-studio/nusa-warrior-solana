import { z } from "zod";
import { checkoutPaymentOrderUseCase } from "@/server/modules/shop/application/shop.usecase";
import { requirePlayerSession } from "@/server/shared/auth/authorization";
import { enforceRateLimit } from "@/server/shared/http/distributed-rate-limit";
import { assertSameOriginMutation } from "@/server/shared/auth/request-security";
import { parseJsonWithSchema } from "@/server/shared/validation/zod-helpers";
import { handleRouteError, okResponse } from "@/server/shared/http/api-response";

const checkoutSchema = z.object({
  buyerName: z.string().trim().min(2).max(120),
  buyerEmail: z.string().trim().email().max(254),
  starterPackCode: z.string().min(2).max(80),
  paymentMethod: z.enum(["QRIS", "VIRTUAL_ACCOUNT"]).optional(),
  paymentChannel: z.string().min(2).max(40).optional(),
  pointsToUse: z.number().int().min(0).default(0),
});

export async function POST(request: Request): Promise<Response> {
  try {
    assertSameOriginMutation(request);
    const session = await requirePlayerSession();
    await enforceRateLimit(`shop:checkout:${session.userId}`, { capacity: 3, refillPerSecond: 3 / 300 });
    const parsed = await parseJsonWithSchema(request, checkoutSchema, 16_384);
    const order = await checkoutPaymentOrderUseCase({
      userId: session.userId,
      buyerName: parsed.buyerName,
      buyerEmail: parsed.buyerEmail,
      starterPackCode: parsed.starterPackCode,
      paymentMethod: parsed.paymentMethod,
      paymentChannel: parsed.paymentChannel,
      pointsToUse: parsed.pointsToUse,
    });
    return okResponse(order, 201);
  } catch (error: unknown) {
    return handleRouteError(error, request);
  }
}
