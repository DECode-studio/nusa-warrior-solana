import { z } from "zod";
import {
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

const updateAssetLicenseSchema = z.object({
  cardSlug: z.string().min(1).max(160),
  creator: z.string().min(2).max(256).optional(),
  licenseType: z.string().min(2).max(256).optional(),
  approvalStatus: z.enum(["APPROVED", "PENDING", "WITHDRAWN"]).optional(),
});

export async function GET(request: Request): Promise<Response> {
  try {
    const session = await requireAdminSession();
    await enforceRateLimit(`admin:assets:read:${session.userId}`, { capacity: 60, refillPerSecond: 1 });
    const cards = await listAdminCardsUseCase();
    const assets = cards.map((c) => ({
      cardSlug: c.slug,
      cardName: c.name,
      imagePath: c.imagePath,
      asset: c.asset,
    }));
    return okResponse(assets);
  } catch (error: unknown) {
    return handleRouteError(error, request);
  }
}

export async function PATCH(request: Request): Promise<Response> {
  try {
    assertSameOriginMutation(request);
    const session = await requireAdminSession();
    await enforceRateLimit(`admin:assets:update:${session.userId}`, { capacity: 60, refillPerSecond: 1 });
    const parsed = await parseJsonWithSchema(request, updateAssetLicenseSchema, 16_384);
    const updated = await updateCardCurationUseCase(parsed);
    return okResponse(updated.asset);
  } catch (error: unknown) {
    return handleRouteError(error, request);
  }
}

