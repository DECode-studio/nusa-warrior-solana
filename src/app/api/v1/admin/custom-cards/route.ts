import { requireAdminSession } from "@/server/shared/auth/authorization";
import { listPendingCustomCardsUseCase } from "@/server/modules/card/application/custom-card.usecase";
import { handleRouteError, okResponse } from "@/server/shared/http/api-response";

export async function GET(request: Request): Promise<Response> {
  try {
    await requireAdminSession();
    const pendingCards = await listPendingCustomCardsUseCase();
    return okResponse(pendingCards);
  } catch (error: unknown) {
    return handleRouteError(error, request);
  }
}

