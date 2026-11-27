import { z } from "zod";
import { requirePlayerSession } from "@/server/shared/auth/authorization";
import { assertSameOriginMutation } from "@/server/shared/auth/request-security";
import { handleRouteError, okResponse } from "@/server/shared/http/api-response";
import { confirmBattleVaultLock } from "@/server/modules/solana/battle-vault-orchestrator.service";

const confirmVaultSchema = z.object({
  txSignatures: z.array(z.string().min(32).max(128)).min(1).max(10),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    assertSameOriginMutation(request);
    const session = await requirePlayerSession();
    const { id: matchId } = await context.params;
    const body = confirmVaultSchema.parse(await request.json());

    const result = await confirmBattleVaultLock({
      matchId,
      userId: session.userId,
      txSignatures: body.txSignatures,
    });
    return okResponse(result);
  } catch (error: unknown) {
    return handleRouteError(error, request);
  }
}
