import { getCurrentSession } from "@/server/shared/auth/session";
import {
  handleRouteError,
  okResponse,
} from "@/server/shared/http/api-response";
import { getUnclaimedNusaBalance } from "@/server/modules/nusa-points/infrastructure/nusa-point.repository.impl";
import { getWalletTokenBalances } from "@/server/modules/solana/nusa-token.service";

export async function GET(request: Request): Promise<Response> {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return okResponse(null);
    }
    const [unclaimedNusa, tokenBalances] = await Promise.all([
      getUnclaimedNusaBalance(session.userId),
      session.walletAddress
        ? getWalletTokenBalances(session.walletAddress).catch(() => null)
        : Promise.resolve(null),
    ]);
    return okResponse({
      ...session,
      nusaPoints: tokenBalances ? tokenBalances.nusa : 0,
      unclaimedNusa,
      tokenBalances,
    });
  } catch (error: unknown) {
    return handleRouteError(error, request);
  }
}
