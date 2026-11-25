import { z } from "zod";
import {
  listAdminTeamMembersUseCase,
  createTeamMemberUseCase,
} from "@/server/modules/team/application/team.usecase";
import { handleRouteError, okResponse } from "@/server/shared/http/api-response";
import { requireAdminSession } from "@/server/shared/auth/authorization";
import { assertSameOriginMutation } from "@/server/shared/auth/request-security";
import { parseJsonWithSchema } from "@/server/shared/validation/zod-helpers";
import { enforceRateLimit } from "@/server/shared/http/distributed-rate-limit";

const createTeamMemberSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email(),
  role: z.string().min(1).max(255),
  description: z.string().min(1).max(5000),
  image: z.string().min(1),
  imagePositionX: z.number().int().min(0).max(100).optional().default(50),
  imagePositionY: z.number().int().min(0).max(100).optional().default(50),
  displayOrder: z.number().int().optional().default(0),
  isActive: z.boolean().optional().default(true),
});

export async function GET(request: Request): Promise<Response> {
  try {
    const session = await requireAdminSession();
    await enforceRateLimit(`admin:team:read:${session.userId}`, { capacity: 60, refillPerSecond: 1 });
    const members = await listAdminTeamMembersUseCase();
    return okResponse(members);
  } catch (error: unknown) {
    return handleRouteError(error, request);
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    assertSameOriginMutation(request);
    const session = await requireAdminSession();
    await enforceRateLimit(`admin:team:create:${session.userId}`, { capacity: 20, refillPerSecond: 1 / 3 });
    const parsed = await parseJsonWithSchema(request, createTeamMemberSchema);
    const created = await createTeamMemberUseCase(parsed);
    return okResponse(created, 201);
  } catch (error: unknown) {
    return handleRouteError(error, request);
  }
}
