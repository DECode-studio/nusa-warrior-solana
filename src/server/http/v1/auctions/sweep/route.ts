import "server-only";
import { AppError } from "@/server/shared/errors/app-error";
import { handleRouteError, okResponse } from "@/server/shared/http/api-response";
import { sweepExpiredAuctionsUseCase } from "@/server/modules/auction/application/auction.usecase";

export async function POST(request: Request) {
  try {
    const secret = process.env.BATTLE_SWEEP_SECRET?.trim();
    const authHeader = request.headers.get("authorization") ?? "";
    if (!secret || authHeader !== `Bearer ${secret}`) {
      throw AppError.unauthorized("Sweep authorization token tidak valid.");
    }
    const data = await sweepExpiredAuctionsUseCase();
    return okResponse(data);
  } catch (error) {
    return handleRouteError(error, request);
  }
}
