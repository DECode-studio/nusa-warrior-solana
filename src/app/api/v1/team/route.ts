import { listPublicTeamMembersUseCase } from "@/server/modules/team/application/team.usecase";
import { handleRouteError, okResponse } from "@/server/shared/http/api-response";
import { enforceRateLimit } from "@/server/shared/http/distributed-rate-limit";

export async function GET(request: Request): Promise<Response> {
  try {
    const ip = request.headers.get("x-forwarded-for") ?? "anonymous";
    await enforceRateLimit(`team:list:${ip}`, { capacity: 60, refillPerSecond: 1 });
    const members = await listPublicTeamMembersUseCase();
    return okResponse(members);
  } catch (error: unknown) {
    return handleRouteError(error, request);
  }
}
