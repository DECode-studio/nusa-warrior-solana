import { requireAuthSession } from "@/server/shared/auth/authorization";
import { getCustomCardPricingUseCase } from "@/server/modules/card/application/custom-card.usecase";
import { handleRouteError, okResponse } from "@/server/shared/http/api-response";

export async function GET(request: Request): Promise<Response> {
  try {
    const session = await requireAuthSession();
    const pricing = await getCustomCardPricingUseCase(session.userId);
    return okResponse(pricing);
  } catch (error: unknown) {
    return handleRouteError(error, request);
  }
}

