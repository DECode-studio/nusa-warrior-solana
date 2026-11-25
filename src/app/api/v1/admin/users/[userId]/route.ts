import { getAdminUserDetailUseCase } from "@/server/modules/admin/application/admin.usecase";
import { requireAdminSession } from "@/server/shared/auth/authorization";
import { enforceRateLimit } from "@/server/shared/http/distributed-rate-limit";
import { handleRouteError, okResponse } from "@/server/shared/http/api-response";

interface AdminUserDetailRouteProps {
  params: Promise<{ userId: string }>;
}

export async function GET(
  request: Request,
  { params }: AdminUserDetailRouteProps
): Promise<Response> {
  try {
    const session = await requireAdminSession();
    await enforceRateLimit(`admin:users:detail:${session.userId}`, { capacity: 60, refillPerSecond: 1 });
    const { userId } = await params;
    const detail = await getAdminUserDetailUseCase(userId);
    return okResponse({
      user: detail.user,
      ownedCards: detail.ownedCards.map(({ card, quantity }) => ({ ...card, quantity })),
      decks: detail.decks,
    });
  } catch (error: unknown) {
    return handleRouteError(error, request);
  }
}
