import { getAdminStoryCampaignsUseCase, saveStoryCampaignDraftSchema, updateAdminStoryCampaignPublicationUseCase, updateAdminStoryCampaignUseCase, updateStoryCampaignPublicationSchema } from "@/server/modules/story-mode/application/story-admin.usecase";
import { requireAdminSession } from "@/server/shared/auth/authorization";
import { assertSameOriginMutation } from "@/server/shared/auth/request-security";
import { enforceRateLimit } from "@/server/shared/http/distributed-rate-limit";
import { handleRouteError, okResponse } from "@/server/shared/http/api-response";
import { parseJsonWithSchema } from "@/server/shared/validation/zod-helpers";

export async function GET(request: Request): Promise<Response> {
  try {
    const session = await requireAdminSession();
    await enforceRateLimit(`admin:story:read:${session.userId}`, { capacity: 60, refillPerSecond: 1 });
    const campaigns = await getAdminStoryCampaignsUseCase();
    return okResponse(campaigns);
  } catch (error: unknown) {
    return handleRouteError(error, request);
  }
}

export async function PATCH(request: Request): Promise<Response> {
  try {
    assertSameOriginMutation(request);
    const session = await requireAdminSession();
    await enforceRateLimit(`admin:story:write:${session.userId}`, { capacity: 30, refillPerSecond: 0.5 });
    const payload = await parseJsonWithSchema(request, saveStoryCampaignDraftSchema, 512_000);
    return okResponse(await updateAdminStoryCampaignUseCase(payload, session.userId));
  } catch (error: unknown) {
    return handleRouteError(error, request);
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    assertSameOriginMutation(request);
    const session = await requireAdminSession();
    await enforceRateLimit(`admin:story:publish:${session.userId}`, { capacity: 20, refillPerSecond: 1 / 3 });
    const payload = await parseJsonWithSchema(request, updateStoryCampaignPublicationSchema, 8_192);
    return okResponse(await updateAdminStoryCampaignPublicationUseCase(payload, session.userId));
  } catch (error: unknown) {
    return handleRouteError(error, request);
  }
}
