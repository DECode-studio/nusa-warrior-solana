import { getShopOrderUseCase } from "@/server/modules/shop/application/shop.usecase";
import { requirePlayerSession } from "@/server/shared/auth/authorization";
import { enforceRateLimit } from "@/server/shared/http/distributed-rate-limit";
import { handleRouteError, okResponse } from "@/server/shared/http/api-response";

interface ShopOrderRouteProps {
  params: Promise<{ orderId: string }>;
}

export async function GET(request: Request, { params }: ShopOrderRouteProps): Promise<Response> {
  try {
    const session = await requirePlayerSession();
    await enforceRateLimit(`shop:order:${session.userId}`, { capacity: 60, refillPerSecond: 1 });
    const { orderId } = await params;
    return okResponse(await getShopOrderUseCase(orderId, session.userId));
  } catch (error: unknown) {
    return handleRouteError(error, request);
  }
}
