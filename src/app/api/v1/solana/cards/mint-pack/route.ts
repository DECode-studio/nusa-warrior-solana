import { z } from "zod";
import { requirePlayerSession } from "@/server/shared/auth/authorization";
import { assertSameOriginMutation } from "@/server/shared/auth/request-security";
import { enforceRateLimit } from "@/server/shared/http/distributed-rate-limit";
import { handleRouteError, okResponse } from "@/server/shared/http/api-response";
import { AppError } from "@/server/shared/errors/app-error";
import { isPrismaDriverEnabled, prisma } from "@/server/shared/db/prisma";
import { buildMintRegularCardsToPlayerTx } from "@/server/modules/solana/card-minting.service";
import { getSolanaExplorerTxUrl } from "@/server/modules/solana/solana-config";
import { invalidateWalletAssetCache } from "@/server/modules/solana/wallet-asset-reader.service";

const mintPackSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("prepare"),
    items: z
      .array(
        z.object({
          cardSlug: z.string().min(1),
          quantity: z.number().int().min(1).max(10),
        })
      )
      .min(1)
      .max(10),
  }),
  z.object({
    action: z.literal("confirm"),
    txSignature: z.string().min(32).max(128),
  }),
]);

export async function POST(request: Request): Promise<Response> {
  try {
    assertSameOriginMutation(request);
    const session = await requirePlayerSession();
    await enforceRateLimit(`solana:mint-pack:${session.userId}`, {
      capacity: 10,
      refillPerSecond: 1 / 10,
    });

    if (!isPrismaDriverEnabled()) {
      throw AppError.badRequest(
        "Minting kartu on-chain membutuhkan driver database Prisma."
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { walletAddress: true },
    });
    const walletAddress = user?.walletAddress ?? session.walletAddress;
    if (!walletAddress) {
      throw AppError.badRequest(
        "Hubungkan dompet Solana terlebih dahulu untuk mint kartu."
      );
    }

    const body = mintPackSchema.parse(await request.json());

    if (body.action === "prepare") {
      // Verify player owns these cards in DB (from starter pack / shop order) before minting
      const slugs = body.items.map((i) => i.cardSlug);
      const owned = await prisma.userCard.findMany({
        where: {
          userId: session.userId,
          card: { slug: { in: slugs } },
        },
        include: { card: { select: { slug: true } } },
      });
      const ownedBySlug = new Map(
        owned.map((row) => [row.card.slug, row.quantity])
      );
      for (const item of body.items) {
        if ((ownedBySlug.get(item.cardSlug) ?? 0) < item.quantity) {
          throw AppError.forbidden(
            `Kepemilikan kartu '${item.cardSlug}' di akun tidak mencukupi untuk di-mint.`
          );
        }
      }

      const prepared = await buildMintRegularCardsToPlayerTx({
        playerWallet: walletAddress,
        items: body.items,
      });
      return okResponse(prepared);
    }

    invalidateWalletAssetCache(walletAddress);
    return okResponse({
      txSignature: body.txSignature,
      explorerUrl: getSolanaExplorerTxUrl(body.txSignature),
    });
  } catch (error: unknown) {
    return handleRouteError(error, request);
  }
}
