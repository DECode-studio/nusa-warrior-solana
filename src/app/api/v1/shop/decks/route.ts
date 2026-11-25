import { getShopCatalogUseCase } from "@/server/modules/shop/application/shop.usecase";
import { requirePlayerSession } from "@/server/shared/auth/authorization";
import {
  handleRouteError,
  okResponse,
} from "@/server/shared/http/api-response";
import { enforceRateLimit } from "@/server/shared/http/distributed-rate-limit";

export async function GET(request: Request): Promise<Response> {
  try {
    const session = await requirePlayerSession();
    await enforceRateLimit(`shop:catalog:${session.userId}`, { capacity: 60, refillPerSecond: 1 });
    const data = await getShopCatalogUseCase(session.userId);
    return okResponse(data);
  } catch (error: unknown) {
    return handleRouteError(error, request);
  }
}

