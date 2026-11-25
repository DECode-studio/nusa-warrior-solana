import { getShopTransactionHistoryUseCase } from "@/server/modules/shop/application/shop.usecase";
import { requirePlayerSession } from "@/server/shared/auth/authorization";
import { handleRouteError, okResponse } from "@/server/shared/http/api-response";
import { enforceRateLimit } from "@/server/shared/http/distributed-rate-limit";

export async function GET(request: Request): Promise<Response> {
  try {
    const session = await requirePlayerSession();
    await enforceRateLimit(`shop:transactions:${session.userId}`, {
      capacity: 60,
      refillPerSecond: 1,
    });
    const searchParams = new URL(request.url).searchParams;
    const requestedPage = Number.parseInt(searchParams.get("page") ?? "1", 10);
    const requestedPageSize = Number.parseInt(searchParams.get("pageSize") ?? "10", 10);
    const page = Number.isFinite(requestedPage) ? Math.max(1, requestedPage) : 1;
    const pageSize = Number.isFinite(requestedPageSize)
      ? Math.min(50, Math.max(1, requestedPageSize))
      : 10;
    const search = (searchParams.get("search") ?? "").trim().slice(0, 100);
    const transactions = await getShopTransactionHistoryUseCase(session.userId, {
      page,
      pageSize,
      search,
    });
    return okResponse(transactions);
  } catch (error: unknown) {
    return handleRouteError(error, request);
  }
}
