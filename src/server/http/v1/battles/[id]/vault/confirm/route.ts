import { z } from "zod";
import { requirePlayerSession } from "@/server/shared/auth/authorization";
import { assertSameOriginMutation } from "@/server/shared/auth/request-security";
import { handleRouteError, okResponse } from "@/server/shared/http/api-response";
import { AppError } from "@/server/shared/errors/app-error";
import { isPrismaDriverEnabled, prisma } from "@/server/shared/db/prisma";
import {
  deriveBattleVaultPda,
  getSolanaExplorerTxUrl,
} from "@/server/modules/solana/solana-config";
import { verifyVaultLockTransaction } from "@/server/modules/solana/battle-vault-settlement.service";
import { invalidateWalletAssetCache } from "@/server/modules/solana/wallet-asset-reader.service";

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

    if (!isPrismaDriverEnabled()) {
      throw AppError.badRequest(
        "Konfirmasi vault on-chain membutuhkan driver database Prisma."
      );
    }

    const battle = await prisma.battleSession.findFirst({
      where: {
        id: matchId,
        OR: [{ userId: session.userId }, { opponentUserId: session.userId }],
      },
      include: {
        user: { select: { walletAddress: true } },
        opponentUser: { select: { walletAddress: true } },
      },
    });

    if (!battle || !battle.isQuickMatch) {
      throw AppError.notFound("Sesi PvP / League tidak ditemukan.");
    }

    const [vaultPdaKey] = await deriveBattleVaultPda(battle.id);
    const vaultPda = vaultPdaKey.toBase58();

    for (const signature of body.txSignatures) {
      const valid = await verifyVaultLockTransaction({
        txSignature: signature,
        expectedVaultPda: vaultPda,
      });
      if (!valid) {
        throw AppError.badRequest(
          `Transaksi vault '${signature}' tidak valid atau belum terkonfirmasi.`
        );
      }
    }

    const primarySignature = body.txSignatures[0];
    const isPlayerOne = battle.userId === session.userId;

    await prisma.battleSession.update({
      where: { id: battle.id },
      data: {
        vaultPda,
        ...(isPlayerOne
          ? { playerLockTxSignature: primarySignature }
          : { opponentLockTxSignature: primarySignature }),
      },
    });

    const walletAddress = isPlayerOne
      ? battle.user.walletAddress
      : battle.opponentUser?.walletAddress;
    if (walletAddress) {
      invalidateWalletAssetCache(walletAddress);
    }

    return okResponse({
      matchId: battle.id,
      vaultPda,
      txSignatures: body.txSignatures,
      primaryTxSignature: primarySignature,
      explorerUrls: body.txSignatures.map((sig) => getSolanaExplorerTxUrl(sig)),
    });
  } catch (error: unknown) {
    return handleRouteError(error, request);
  }
}
