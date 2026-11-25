import { z } from "zod";
import {
  listAdminUsersPaginatedUseCase,
  listAdminUsersUseCase,
  updateAdminUserRoleUseCase,
} from "@/server/modules/admin/application/admin.usecase";
import {
  handleRouteError,
  okResponse,
} from "@/server/shared/http/api-response";
import { parseJsonWithSchema } from "@/server/shared/validation/zod-helpers";
import { requireAdminSession } from "@/server/shared/auth/authorization";
import { assertSameOriginMutation } from "@/server/shared/auth/request-security";
import { enforceRateLimit } from "@/server/shared/http/distributed-rate-limit";

const updateUserRoleSchema = z.object({
  userId: z.string().min(1).max(160),
  role: z.enum(["PLAYER", "CURATOR", "ADMIN"]),
});

export async function GET(request: Request): Promise<Response> {
  try {
    const session = await requireAdminSession();
    await enforceRateLimit(`admin:users:read:${session.userId}`, { capacity: 60, refillPerSecond: 1 });
    const url = new URL(request.url);
    const pageParam = url.searchParams.get("page");
    const limitParam = url.searchParams.get("limit");
    const search = url.searchParams.get("search") ?? undefined;

    if (pageParam !== null || limitParam !== null || search !== undefined) {
      const page = pageParam ? Math.max(1, parseInt(pageParam, 10)) : 1;
      const limit = limitParam ? Math.max(1, parseInt(limitParam, 10)) : 10;
      const paginated = await listAdminUsersPaginatedUseCase({ page, limit, search });
      return okResponse(paginated);
    }

    const users = await listAdminUsersUseCase();
    return okResponse(users);
  } catch (error: unknown) {
    return handleRouteError(error, request);
  }
}

export async function PATCH(request: Request): Promise<Response> {
  try {
    assertSameOriginMutation(request);
    const session = await requireAdminSession();
    await enforceRateLimit(`admin:users:update:${session.userId}`, { capacity: 30, refillPerSecond: 0.5 });
    const parsed = await parseJsonWithSchema(request, updateUserRoleSchema, 8_192);
    const updated = await updateAdminUserRoleUseCase(parsed);
    return okResponse(updated);
  } catch (error: unknown) {
    return handleRouteError(error, request);
  }
}

