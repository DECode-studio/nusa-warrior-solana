import { handleRouteError, okResponse } from "@/server/shared/http/api-response";
import { getAllAmmPools } from "@/server/modules/solana/nusa-amm-dex.service";

export async function GET(request: Request): Promise<Response> {
  try {
    const pools = await getAllAmmPools();
    return okResponse({ pools });
  } catch (error: unknown) {
    return handleRouteError(error, request);
  }
}
