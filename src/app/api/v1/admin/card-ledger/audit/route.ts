import { auditCardLedger } from "@/server/modules/collection/infrastructure/card-escrow.repository";
import { requireAdminSession } from "@/server/shared/auth/authorization";
import { handleRouteError, okResponse } from "@/server/shared/http/api-response";

export async function GET(request: Request): Promise<Response> {
  try {
    await requireAdminSession();
    const response = okResponse(await auditCardLedger());
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error: unknown) {
    return handleRouteError(error, request);
  }
}
