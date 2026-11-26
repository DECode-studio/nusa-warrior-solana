import { listMatchesUseCase } from "@/server/modules/battle/application/battle.usecase";
import { AppError } from "@/server/shared/errors/app-error";
import { requirePlayerSession } from "@/server/shared/auth/authorization";
import {
  handleRouteError,
  okResponse,
} from "@/server/shared/http/api-response";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    const { id } = await context.params;
    const session = await requirePlayerSession();
    const matches = await listMatchesUseCase(session.userId);
    const found = matches.find((m) => m.id === id);
    if (!found) {
      throw AppError.notFound(
        `Catatan pertandingan '${id}' tidak ditemukan.`
      );
    }
    return okResponse(found);
  } catch (error: unknown) {
    return handleRouteError(error, request);
  }
}
