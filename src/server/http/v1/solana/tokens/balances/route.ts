import { z } from "zod";
import { PublicKey } from "@solana/web3.js";
import { getCurrentSession } from "@/server/shared/auth/session";
import { handleRouteError, okResponse } from "@/server/shared/http/api-response";
import { AppError } from "@/server/shared/errors/app-error";
import { getWalletTokenBalances } from "@/server/modules/solana/nusa-token.service";
import { getUnclaimedNusaBalance } from "@/server/modules/nusa-points/infrastructure/nusa-point.repository.impl";

const querySchema = z.object({
  wallet: z.string().trim().min(32).max(64).optional(),
});

export async function GET(request: Request): Promise<Response> {
  try {
    const { searchParams } = new URL(request.url);
    const parsedQuery = querySchema.safeParse({
      wallet: searchParams.get("wallet") ?? undefined,
    });
    if (!parsedQuery.success) {
      throw AppError.validation("Parameter wallet tidak valid.");
    }

    const session = await getCurrentSession();
    const wallet = parsedQuery.data.wallet || session?.walletAddress;

    if (!wallet) {
      throw AppError.badRequest("Parameter walletAddress diperlukan.");
    }

    try {
      new PublicKey(wallet);
    } catch {
      throw AppError.badRequest("Alamat wallet Solana tidak valid.");
    }

    const [balances, unclaimedNusa] = await Promise.all([
      getWalletTokenBalances(wallet),
      session?.userId ? getUnclaimedNusaBalance(session.userId) : Promise.resolve(0),
    ]);

    return okResponse({
      ...balances,
      unclaimedNusa,
    });
  } catch (error: unknown) {
    return handleRouteError(error, request);
  }
}
