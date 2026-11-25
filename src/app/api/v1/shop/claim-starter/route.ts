import { claimFreeStarterPackUseCase } from "@/server/modules/shop/application/shop.usecase";
import { requirePlayerSession } from "@/server/shared/auth/authorization";
import { enforceRateLimit } from "@/server/shared/http/distributed-rate-limit";
import { assertSameOriginMutation } from "@/server/shared/auth/request-security";
import {
  handleRouteError,
  okResponse,
} from "@/server/shared/http/api-response";

export async function POST(request: Request): Promise<Response> {
  try {
    assertSameOriginMutation(request);
    const session = await requirePlayerSession();
    await enforceRateLimit(`shop:claim-starter:${session.userId}`, {
      capacity: 5,
      refillPerSecond: 1 / 60,
    });

    const order = await claimFreeStarterPackUseCase(session.userId);
    return okResponse(order, 201);
  } catch (error: unknown) {
    return handleRouteError(error, request);
  }
}

