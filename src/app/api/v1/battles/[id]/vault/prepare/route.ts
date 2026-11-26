import { requirePlayerSession } from "@/server/shared/auth/authorization";
import { assertSameOriginMutation } from "@/server/shared/auth/request-security";
import { handleRouteError, okResponse } from "@/server/shared/http/api-response";
import { AppError } from "@/server/shared/errors/app-error";
import { isPrismaDriverEnabled, prisma } from "@/server/shared/db/prisma";
import {
  buildChunkedLockDeckTransactions,
  type VaultLockCardInput,
} from "@/server/modules/solana/nusa-vault-tx-builder.service";
import { getVerifiedWalletCards } from "@/server/modules/solana/wallet-asset-reader.service";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    assertSameOriginMutation(request);
    const session = await requirePlayerSession();
    const { id: matchId } = await context.params;

    if (!isPrismaDriverEnabled()) {
      throw AppError.badRequest(
        "Vault transaksi on-chain membutuhkan driver database Prisma."
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
      throw AppError.notFound(
        "Sesi PvP / League tidak ditemukan untuk penguncian vault."
      );
    }

    const isPlayerOne = battle.userId === session.userId;
    const playerWallet = isPlayerOne
      ? battle.user.walletAddress
      : battle.opponentUser?.walletAddress;

    if (!playerWallet) {
      throw AppError.badRequest(
        "Dompet Solana Anda belum terhubung pada sesi ini."
      );
    }

    const deckSlugsRaw = isPlayerOne
      ? battle.playerDeckCardSlugsJson
      : battle.opponentDeckCardSlugsJson;
    const deckSlugs: string[] = deckSlugsRaw ? JSON.parse(deckSlugsRaw) : [];

    const copyCountBySlug = new Map<string, number>();
    for (const slug of deckSlugs) {
      copyCountBySlug.set(slug, (copyCountBySlug.get(slug) ?? 0) + 1);
    }

    const verifiedCards = await getVerifiedWalletCards({
      userId: session.userId,
      walletAddress: playerWallet,
      bypassCache: true,
    });
    const bySlug = new Map(
      verifiedCards.map((item) => [item.card.slug, item])
    );

    const cardsToLock: VaultLockCardInput[] = [];
    for (const [slug, qty] of copyCountBySlug.entries()) {
      const owned = bySlug.get(slug);
      if (!owned || owned.walletQuantity < qty) {
        throw AppError.conflict(
          `Kartu '${slug}' di dompet Solana tidak mencukupi untuk dikunci ke Vault.`
        );
      }

      if (owned.tokenStandard === "MPL_CORE") {
        const assets = owned.mintOrAssetAddresses.slice(0, qty);
        for (const assetAddress of assets) {
          cardsToLock.push({
            mintOrAsset: assetAddress,
            tokenStandard: "MPL_CORE",
            quantity: 1,
            collectionAddress: owned.card.collectionAddress,
          });
        }
      } else if (owned.card.mintAddress) {
        cardsToLock.push({
          mintOrAsset: owned.card.mintAddress,
          tokenStandard: "TOKEN_2022",
          quantity: qty,
        });
      }
    }

    if (cardsToLock.length === 0) {
      throw AppError.badRequest(
        "Belum ada kartu ter-tokenisasi pada deck ini untuk dikunci ke Vault."
      );
    }

    const prepared = await buildChunkedLockDeckTransactions({
      matchId: battle.id,
      playerWallet,
      cards: cardsToLock,
    });

    return okResponse({
      matchId: battle.id,
      vaultPda: prepared.vaultPda,
      cardCount: cardsToLock.length,
      serializedTransactions: prepared.serializedTransactions,
    });
  } catch (error: unknown) {
    return handleRouteError(error, request);
  }
}
