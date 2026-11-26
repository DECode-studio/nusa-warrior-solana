import { getCardDetailUseCase } from "@/server/modules/card/application/card.usecase";
import {
  handleRouteError,
  okResponse,
} from "@/server/shared/http/api-response";

interface RouteContext {
  params: Promise<{ slug: string }>;
}

export async function GET(
  request: Request,
  context: RouteContext
): Promise<Response> {
  try {
    const { slug } = await context.params;
    const card = await getCardDetailUseCase(slug);
    return okResponse(card);
  } catch (error: unknown) {
    return handleRouteError(error, request);
  }
}

