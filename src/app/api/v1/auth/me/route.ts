import { getCurrentSession } from "@/server/shared/auth/session";
import {
  handleRouteError,
  okResponse,
} from "@/server/shared/http/api-response";
import { getNusaPointBalance } from "@/server/modules/nusa-points/infrastructure/nusa-point.repository.impl";

export async function GET(request: Request): Promise<Response> {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return okResponse(null);
    }
    const nusaPoints = await getNusaPointBalance(session.userId);
    return okResponse({
      ...session,
      nusaPoints,
    });
  } catch (error: unknown) {
    return handleRouteError(error, request);
  }
}

