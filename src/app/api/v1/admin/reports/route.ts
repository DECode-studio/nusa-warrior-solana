import { z } from "zod";
import {
  listAdminReportsUseCase,
  updateReportStatusUseCase,
} from "@/server/modules/admin/application/admin.usecase";
import {
  handleRouteError,
  okResponse,
} from "@/server/shared/http/api-response";
import { requireAdminSession } from "@/server/shared/auth/authorization";
import { assertSameOriginMutation } from "@/server/shared/auth/request-security";
import { parseJsonWithSchema } from "@/server/shared/validation/zod-helpers";
import { enforceRateLimit } from "@/server/shared/http/distributed-rate-limit";

const updateReportSchema = z.object({
  reportId: z.string().min(1).max(160),
  status: z.enum(["OPEN", "REVIEWED", "RESOLVED", "DISMISSED"]),
  resolutionNote: z.string().max(4000).nullable().optional(),
});

export async function GET(request: Request): Promise<Response> {
  try {
    const session = await requireAdminSession();
    await enforceRateLimit(`admin:reports:read:${session.userId}`, { capacity: 60, refillPerSecond: 1 });
    const reports = await listAdminReportsUseCase();
    return okResponse(reports);
  } catch (error: unknown) {
    return handleRouteError(error, request);
  }
}

export async function PATCH(request: Request): Promise<Response> {
  try {
    assertSameOriginMutation(request);
    const session = await requireAdminSession();
    await enforceRateLimit(`admin:reports:update:${session.userId}`, { capacity: 60, refillPerSecond: 1 });
    const parsed = await parseJsonWithSchema(request, updateReportSchema, 16_384);
    const updated = await updateReportStatusUseCase({
      reportId: parsed.reportId,
      status: parsed.status,
      resolutionNote: parsed.resolutionNote ?? null,
    });
    return okResponse(updated);
  } catch (error: unknown) {
    return handleRouteError(error, request);
  }
}

