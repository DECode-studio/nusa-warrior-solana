import { getShopPaymentChannelsUseCase } from "@/server/modules/shop/application/shop.usecase";
import { requirePlayerSession } from "@/server/shared/auth/authorization";
import { enforceRateLimit } from "@/server/shared/http/distributed-rate-limit";
import { handleRouteError, okResponse } from "@/server/shared/http/api-response";

export async function GET(request: Request): Promise<Response> {
  try {
    const session = await requirePlayerSession();
    await enforceRateLimit(`shop:payment-methods:${session.userId}`, { capacity: 20, refillPerSecond: 1 / 3 });
    return okResponse(await getShopPaymentChannelsUseCase(session.userId));
  } catch (error: unknown) {
    return handleRouteError(error, request);
  }
}
