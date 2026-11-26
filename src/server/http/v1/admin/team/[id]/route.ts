import { z } from "zod";
import {
  getTeamMemberByIdUseCase,
  updateTeamMemberUseCase,
  deleteTeamMemberUseCase,
} from "@/server/modules/team/application/team.usecase";
import { handleRouteError, okResponse } from "@/server/shared/http/api-response";
import { requireAdminSession } from "@/server/shared/auth/authorization";
import { assertSameOriginMutation } from "@/server/shared/auth/request-security";
import { parseJsonWithSchema } from "@/server/shared/validation/zod-helpers";
import { enforceRateLimit } from "@/server/shared/http/distributed-rate-limit";

const updateTeamMemberSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  email: z.string().email().optional(),
  role: z.string().min(1).max(255).optional(),
  description: z.string().min(1).max(5000).optional(),
  image: z.string().min(1).optional(),
  imagePositionX: z.number().int().min(0).max(100).optional(),
  imagePositionY: z.number().int().min(0).max(100).optional(),
  displayOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, context: RouteParams): Promise<Response> {
  try {
    const session = await requireAdminSession();
    const { id } = await context.params;
    await enforceRateLimit(`admin:team:read-one:${session.userId}`, { capacity: 60, refillPerSecond: 1 });
    const member = await getTeamMemberByIdUseCase(id);
    return okResponse(member);
  } catch (error: unknown) {
    return handleRouteError(error, request);
  }
}

export async function PATCH(request: Request, context: RouteParams): Promise<Response> {
  try {
    assertSameOriginMutation(request);
    const session = await requireAdminSession();
    const { id } = await context.params;
    await enforceRateLimit(`admin:team:update:${session.userId}`, { capacity: 30, refillPerSecond: 1 / 2 });
    const parsed = await parseJsonWithSchema(request, updateTeamMemberSchema);
    const updated = await updateTeamMemberUseCase(id, parsed);
    return okResponse(updated);
  } catch (error: unknown) {
    return handleRouteError(error, request);
  }
}

export async function DELETE(request: Request, context: RouteParams): Promise<Response> {
  try {
    assertSameOriginMutation(request);
    const session = await requireAdminSession();
    const { id } = await context.params;
    await enforceRateLimit(`admin:team:delete:${session.userId}`, { capacity: 20, refillPerSecond: 1 / 3 });
    await deleteTeamMemberUseCase(id);
    return okResponse({ success: true });
  } catch (error: unknown) {
    return handleRouteError(error, request);
  }
}
