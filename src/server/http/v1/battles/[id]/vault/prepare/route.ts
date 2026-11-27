import { requirePlayerSession } from "@/server/shared/auth/authorization";
import { assertSameOriginMutation } from "@/server/shared/auth/request-security";
import { handleRouteError, okResponse } from "@/server/shared/http/api-response";
import { prepareBattleVaultLock } from "@/server/modules/solana/battle-vault-orchestrator.service";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    assertSameOriginMutation(request);
    const session = await requirePlayerSession();
    const { id: matchId } = await context.params;
    const result = await prepareBattleVaultLock({
      matchId,
      userId: session.userId,
    });
    return okResponse(result);
  } catch (error: unknown) {
    return handleRouteError(error, request);
  }
}
