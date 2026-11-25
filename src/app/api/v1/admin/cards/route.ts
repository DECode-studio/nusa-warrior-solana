import { z } from "zod";
import {
  listAdminCardsPaginatedUseCase,
  listAdminCardsUseCase,
  updateCardCurationUseCase,
} from "@/server/modules/admin/application/admin.usecase";
import {
  handleRouteError,
  okResponse,
} from "@/server/shared/http/api-response";
import { requireAdminSession } from "@/server/shared/auth/authorization";
import { assertSameOriginMutation } from "@/server/shared/auth/request-security";
import { parseJsonWithSchema } from "@/server/shared/validation/zod-helpers";
import { enforceRateLimit } from "@/server/shared/http/distributed-rate-limit";
import { httpUrlSchema } from "@/server/shared/validation/url-schemas";

const updateCardSchema = z.object({
  cardSlug: z.string().min(1).max(160),
  verificationStatus: z
    .enum(["VERIFIED", "VISUAL_INTERPRETATION", "PENDING_REVIEW"])
    .optional(),
  publicationStatus: z.enum(["ACTIVE", "WITHDRAWN"]).optional(),
  sourceCitation: z.string().min(2).max(4000).optional(),
  sourceUrl: httpUrlSchema.nullable().optional(),
  creator: z.string().min(2).optional(),
  licenseType: z.string().min(2).optional(),
  approvalStatus: z.enum(["APPROVED", "PENDING", "WITHDRAWN"]).optional(),
  historicalSummaryId: z.string().min(2).max(4000).optional(),
  historicalSummaryEn: z.string().min(2).max(4000).optional(),
  historicalSummaryZh: z.string().min(2).max(4000).optional(),
  effectName: z.string().max(100).nullable().optional(),
  effectDescriptionId: z.string().max(4000).nullable().optional(),
  effectDescriptionEn: z.string().max(4000).nullable().optional(),
  effectDescriptionZh: z.string().max(4000).nullable().optional(),
});

export async function GET(request: Request): Promise<Response> {
  try {
    const session = await requireAdminSession();
    await enforceRateLimit(`admin:cards:read:${session.userId}`, { capacity: 60, refillPerSecond: 1 });
    const url = new URL(request.url);
    const pageParam = url.searchParams.get("page");
    const limitParam = url.searchParams.get("limit");
    const search = url.searchParams.get("search") ?? undefined;

    if (pageParam !== null || limitParam !== null || search !== undefined) {
      const page = pageParam ? Math.max(1, parseInt(pageParam, 10)) : 1;
      const limit = limitParam ? Math.max(1, parseInt(limitParam, 10)) : 10;
      const paginated = await listAdminCardsPaginatedUseCase({ page, limit, search });
      return okResponse(paginated);
    }

    const cards = await listAdminCardsUseCase();
    return okResponse(cards);
  } catch (error: unknown) {
    return handleRouteError(error, request);
  }
}

export async function PATCH(request: Request): Promise<Response> {
  try {
    assertSameOriginMutation(request);
    const session = await requireAdminSession();
    await enforceRateLimit(`admin:cards:update:${session.userId}`, { capacity: 60, refillPerSecond: 1 });
    const parsed = await parseJsonWithSchema(request, updateCardSchema, 16_384);
    const updated = await updateCardCurationUseCase(parsed);
    return okResponse(updated);
  } catch (error: unknown) {
    return handleRouteError(error, request);
  }
}

