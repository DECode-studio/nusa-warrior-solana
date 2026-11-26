import { z } from "zod";
import { claimFreeStarterPackUseCase } from "@/server/modules/shop/application/shop.usecase";
import { shopRepository } from "@/server/modules/shop/infrastructure/shop.repository.impl";
import { requirePlayerSession } from "@/server/shared/auth/authorization";
import { enforceRateLimit } from "@/server/shared/http/distributed-rate-limit";
import { assertSameOriginMutation } from "@/server/shared/auth/request-security";
import { AppError } from "@/server/shared/errors/app-error";
import { isPrismaDriverEnabled, prisma } from "@/server/shared/db/prisma";
import { verifyCardMintTransaction } from "@/server/modules/solana/card-minting.service";
import { invalidateWalletAssetCache } from "@/server/modules/solana/wallet-asset-reader.service";
import {
  handleRouteError,
  okResponse,
} from "@/server/shared/http/api-response";

const claimStarterConfirmSchema = z
  .object({
    txSignature: z.string().min(32).max(128).optional(),
    txSignatures: z.array(z.string().min(32).max(128)).min(1).max(10).optional(),
  })
  .optional();

export async function POST(request: Request): Promise<Response> {
  try {
    assertSameOriginMutation(request);
    const session = await requirePlayerSession();
    await enforceRateLimit(`shop:claim-starter:${session.userId}`, {
      capacity: 5,
      refillPerSecond: 1 / 60,
    });

    const rawBody = await request.text();
    const parsedBody = claimStarterConfirmSchema.parse(
      rawBody ? JSON.parse(rawBody) : undefined
    );
    const txSignatures =
      parsedBody?.txSignatures ??
      (parsedBody?.txSignature ? [parsedBody.txSignature] : []);

    if (isPrismaDriverEnabled()) {
      const packs = await shopRepository.listStarterPacks(session.userId);
      const starterPack =
        packs.find((p) => p.isStarter || p.code.includes("STARTER")) ??
        packs[0];

      if (starterPack) {
        const mintCards = await prisma.card.findMany({
          where: { slug: { in: starterPack.cardSlugs }, mintAddress: { not: null } },
          select: { mintAddress: true },
        });

        if (mintCards.length > 0) {
          if (txSignatures.length === 0) {
            throw AppError.badRequest(
              "Minting kartu di wallet Solana harus diselesaikan terlebih dahulu sebelum klaim dicatat ke database."
            );
          }

          const user = await prisma.user.findUnique({
            where: { id: session.userId },
            select: { walletAddress: true },
          });
          const walletAddress = user?.walletAddress ?? session.walletAddress;
          if (!walletAddress) {
            throw AppError.badRequest(
              "Dompet Solana belum terhubung untuk verifikasi mint."
            );
          }

          const valid = await verifyCardMintTransaction({
            txSignatures,
            expectedWallet: walletAddress,
            expectedMintAddresses: mintCards
              .map((c) => c.mintAddress)
              .filter((m): m is string => Boolean(m)),
          });
          if (!valid) {
            throw AppError.badRequest(
              "Transaksi mint Token-2022 di Solana belum terkonfirmasi atau tidak valid."
            );
          }

          invalidateWalletAssetCache(walletAddress);
        }
      }
    }

    const order = await claimFreeStarterPackUseCase(session.userId);
    return okResponse(
      { ...order, txSignature: txSignatures[0] ?? null, txSignatures },
      201
    );
  } catch (error: unknown) {
    return handleRouteError(error, request);
  }
}
