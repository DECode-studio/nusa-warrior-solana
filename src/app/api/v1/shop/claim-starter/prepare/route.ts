import { requirePlayerSession } from "@/server/shared/auth/authorization";
import { assertSameOriginMutation } from "@/server/shared/auth/request-security";
import { enforceRateLimit } from "@/server/shared/http/distributed-rate-limit";
import { handleRouteError, okResponse } from "@/server/shared/http/api-response";
import { AppError } from "@/server/shared/errors/app-error";
import { isPrismaDriverEnabled, prisma } from "@/server/shared/db/prisma";
import { shopRepository } from "@/server/modules/shop/infrastructure/shop.repository.impl";
import { buildMintRegularCardsToPlayerTx } from "@/server/modules/solana/card-minting.service";

export async function POST(request: Request): Promise<Response> {
  try {
    assertSameOriginMutation(request);
    const session = await requirePlayerSession();
    await enforceRateLimit(`shop:claim-starter:prepare:${session.userId}`, {
      capacity: 5,
      refillPerSecond: 1 / 60,
    });

    const hasClaimed = await shopRepository.hasUserClaimedStarter(session.userId);
    if (hasClaimed) {
      throw AppError.badRequest(
        "Starter pack gratis sudah pernah diklaim sebelumnya."
      );
    }

    if (!isPrismaDriverEnabled()) {
      throw AppError.badRequest(
        "Minting starter pack on-chain membutuhkan driver database Prisma."
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { walletAddress: true },
    });
    const walletAddress = user?.walletAddress ?? session.walletAddress;
    if (!walletAddress) {
      throw AppError.badRequest(
        "Hubungkan dompet Solana terlebih dahulu untuk menerima kartu Starter Pack."
      );
    }

    const packs = await shopRepository.listStarterPacks(session.userId);
    const starterPack =
      packs.find((p) => p.isStarter || p.code.includes("STARTER")) ?? packs[0];
    if (!starterPack) {
      throw AppError.notFound("Starter pack tidak ditemukan.");
    }

    const countBySlug = new Map<string, number>();
    for (const slug of starterPack.cardSlugs) {
      countBySlug.set(slug, (countBySlug.get(slug) ?? 0) + 1);
    }
    const items = [...countBySlug.entries()].map(([cardSlug, quantity]) => ({
      cardSlug,
      quantity,
    }));

    const prepared = await buildMintRegularCardsToPlayerTx({
      playerWallet: walletAddress,
      items,
    });

    return okResponse({
      starterPackCode: starterPack.code,
      cardSlugs: starterPack.cardSlugs,
      serializedTransactions: prepared.serializedTransactions,
      mints: prepared.mints,
    });
  } catch (error: unknown) {
    return handleRouteError(error, request);
  }
}
