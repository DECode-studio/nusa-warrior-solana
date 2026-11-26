import { requireAuthSession } from "@/server/shared/auth/authorization";
import { assertSameOriginMutation } from "@/server/shared/auth/request-security";
import { prepareCustomCardBurnUseCase } from "@/server/modules/card/application/custom-card.usecase";
import { handleRouteError, okResponse } from "@/server/shared/http/api-response";

export async function POST(request: Request): Promise<Response> {
  try {
    assertSameOriginMutation(request);
    const session = await requireAuthSession();
    const result = await prepareCustomCardBurnUseCase(session.userId);
    return okResponse(result);
  } catch (error: unknown) {
    return handleRouteError(error, request);
  }
}
