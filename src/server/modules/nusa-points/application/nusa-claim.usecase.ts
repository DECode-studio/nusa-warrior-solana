import "server-only";
import { randomUUID } from "node:crypto";
import { AppError } from "@/server/shared/errors/app-error";
import { isPrismaDriverEnabled, prisma } from "@/server/shared/db/prisma";
import {
  getUnclaimedNusaBalance,
  recordNusaClaim,
} from "../infrastructure/nusa-point.repository.impl";
import {
  buildMintTokenTransaction,
  getWalletTokenBalances,
  verifyNusaMintTransaction,
} from "@/server/modules/solana/nusa-token.service";
import { getSolanaExplorerTxUrl } from "@/server/modules/solana/solana-config";

async function resolvePlayerWallet(
  userId: string,
  sessionWallet?: string | null
): Promise<string> {
  let walletAddress = sessionWallet ?? null;
  if (!walletAddress && isPrismaDriverEnabled()) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { walletAddress: true },
    });
    walletAddress = user?.walletAddress ?? null;
  }
  if (!walletAddress) {
    throw AppError.badRequest(
      "Hubungkan dompet Solana terlebih dahulu untuk mengklaim Nusa Token (NUSA)."
    );
  }
  return walletAddress;
}

export async function prepareNusaClaimUseCase(input: {
  userId: string;
  sessionWallet?: string | null;
}) {
  const walletAddress = await resolvePlayerWallet(
    input.userId,
    input.sessionWallet
  );
  const unclaimedAmount = await getUnclaimedNusaBalance(input.userId);
  if (unclaimedAmount <= 0) {
    throw AppError.badRequest(
      "Tidak ada saldo Unclaimed NUSA yang dapat diklaim."
    );
  }

  const claimId = randomUUID();
  const txData = await buildMintTokenTransaction({
    recipientWallet: walletAddress,
    symbol: "NUSA",
    uiAmount: unclaimedAmount,
  });

  return {
    claimId,
    amount: unclaimedAmount,
    walletAddress,
    ...txData,
  };
}

export async function confirmNusaClaimUseCase(input: {
  userId: string;
  sessionWallet?: string | null;
  claimId: string;
  amount: number;
  txSignature: string;
}) {
  const walletAddress = await resolvePlayerWallet(
    input.userId,
    input.sessionWallet
  );

  await verifyNusaMintTransaction({
    txSignature: input.txSignature,
    expectedRecipientWallet: walletAddress,
    minUiAmount: input.amount,
  });

  const claimResult = await recordNusaClaim({
    userId: input.userId,
    claimId: input.claimId,
    amount: input.amount,
    txSignature: input.txSignature,
  });

  const balances = await getWalletTokenBalances(walletAddress);

  return {
    ...claimResult,
    txSignature: input.txSignature,
    explorerUrl: getSolanaExplorerTxUrl(input.txSignature),
    onChainNusa: balances.nusa,
  };
}
