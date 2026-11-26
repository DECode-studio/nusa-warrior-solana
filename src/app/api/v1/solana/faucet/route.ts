import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { requirePlayerSession } from "@/server/shared/auth/authorization";
import { assertSameOriginMutation } from "@/server/shared/auth/request-security";
import { enforceRateLimit } from "@/server/shared/http/distributed-rate-limit";
import { handleRouteError, okResponse } from "@/server/shared/http/api-response";
import { AppError } from "@/server/shared/errors/app-error";
import { isPrismaDriverEnabled, prisma } from "@/server/shared/db/prisma";
import {
  getSolanaConnection,
  getSolanaExplorerTxUrl,
  getSolanaNetwork,
} from "@/server/modules/solana/solana-config";

export async function POST(request: Request): Promise<Response> {
  try {
    assertSameOriginMutation(request);
    const session = await requirePlayerSession();
    await enforceRateLimit(`solana:faucet:${session.userId}`, {
      capacity: 2,
      refillPerSecond: 1 / 120,
    });

    const network = getSolanaNetwork();
    if (network === "mainnet-beta") {
      throw AppError.badRequest(
        "Faucet SOL hanya tersedia pada jaringan Devnet/Testnet."
      );
    }

    let walletAddress = session.walletAddress ?? null;
    if (!walletAddress && isPrismaDriverEnabled()) {
      const user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { walletAddress: true },
      });
      walletAddress = user?.walletAddress ?? null;
    }

    if (!walletAddress) {
      throw AppError.badRequest(
        "Hubungkan dompet Solana terlebih dahulu untuk menerima Devnet SOL."
      );
    }

    const pubkey = new PublicKey(walletAddress);
    const connection = getSolanaConnection();

    try {
      const signature = await connection.requestAirdrop(
        pubkey,
        1 * LAMPORTS_PER_SOL
      );
      await connection.confirmTransaction(signature, "confirmed");
      return okResponse({
        airdroppedSol: 1,
        walletAddress,
        txSignature: signature,
        explorerUrl: getSolanaExplorerTxUrl(signature),
      });
    } catch {
      return okResponse(
        {
          airdroppedSol: 0,
          walletAddress,
          rateLimited: true,
          faucetUrl: `https://faucet.solana.com/?address=${encodeURIComponent(walletAddress)}`,
          message:
            "RPC Devnet sedang membatasi airdrop otomatis. Gunakan faucet resmi Solana di tautan yang tersedia.",
        },
        200
      );
    }
  } catch (error: unknown) {
    return handleRouteError(error, request);
  }
}
