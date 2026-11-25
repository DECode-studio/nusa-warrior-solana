import { getTopupTiersUseCase } from "@/server/modules/payment/application/topup.usecase";
import { handleRouteError, okResponse } from "@/server/shared/http/api-response";

export async function GET(request: Request): Promise<Response> {
  try {
    const data = getTopupTiersUseCase();
    return okResponse(data);
  } catch (error: unknown) {
    return handleRouteError(error, request);
  }
}

