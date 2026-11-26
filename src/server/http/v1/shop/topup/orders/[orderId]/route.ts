import { getTopupOrderUseCase } from "@/server/modules/payment/application/topup.usecase";
import { requirePlayerSession } from "@/server/shared/auth/authorization";
import { enforceRateLimit } from "@/server/shared/http/distributed-rate-limit";
import { handleRouteError, okResponse } from "@/server/shared/http/api-response";

interface TopupOrderRouteProps {
  params: Promise<{ orderId: string }>;
}

export async function GET(request: Request, { params }: TopupOrderRouteProps): Promise<Response> {
  try {
    const session = await requirePlayerSession();
    await enforceRateLimit(`shop:topup-order:${session.userId}`, { capacity: 60, refillPerSecond: 1 });
    const { orderId } = await params;
    return okResponse(await getTopupOrderUseCase(orderId, session.userId));
  } catch (error: unknown) {
    return handleRouteError(error, request);
  }
}

