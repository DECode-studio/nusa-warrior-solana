import { z } from "zod";
import { confirmShopNusaCheckoutUseCase } from "@/server/modules/shop/application/shop.usecase";
import { requirePlayerSession } from "@/server/shared/auth/authorization";
import { enforceRateLimit } from "@/server/shared/http/distributed-rate-limit";
import { assertSameOriginMutation } from "@/server/shared/auth/request-security";
import { parseJsonWithSchema } from "@/server/shared/validation/zod-helpers";
import { handleRouteError, okResponse } from "@/server/shared/http/api-response";

const checkoutSchema = z.object({
  starterPackCode: z.string().min(2).max(80),
  txSignature: z.string().trim().min(32).max(128),
  buyerName: z.string().trim().min(2).max(120).optional(),
  buyerEmail: z.string().trim().email().max(254).optional(),
});

export async function POST(request: Request): Promise<Response> {
  try {
    assertSameOriginMutation(request);
    const session = await requirePlayerSession();
    await enforceRateLimit(`shop:checkout:${session.userId}`, {
      capacity: 5,
      refillPerSecond: 5 / 60,
    });
    const parsed = await parseJsonWithSchema(request, checkoutSchema, 16_384);
    const order = await confirmShopNusaCheckoutUseCase({
      userId: session.userId,
      starterPackCode: parsed.starterPackCode,
      txSignature: parsed.txSignature,
      buyerName: parsed.buyerName,
      buyerEmail: parsed.buyerEmail,
    });
    return okResponse(order, 201);
  } catch (error: unknown) {
    return handleRouteError(error, request);
  }
}
