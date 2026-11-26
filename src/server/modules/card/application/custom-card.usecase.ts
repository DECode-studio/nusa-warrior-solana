import "server-only";
import { randomBytes, randomUUID } from "node:crypto";
import { prisma } from "@/server/shared/db/prisma";
import { AppError } from "@/server/shared/errors/app-error";
import type { Kingdom, CharacterGender, CharacterRole, CustomCardStatus } from "@prisma/client";
import {
  CUSTOM_CARD_POLICY,
  getCustomCardCost,
} from "@/server/modules/nusa-points/domain/nusa-point-policy";
import {
  buildBurnNusaTransaction,
  getWalletTokenBalances,
  verifyNusaBurnTransaction,
} from "@/server/modules/solana/nusa-token.service";
import { CustomCardCompositorService } from "./custom-card-compositor.service";

export interface CreateCustomCardInput {
  name: string;
  kingdom: Kingdom;
  role: CharacterRole;
  gender: CharacterGender;
  attack: number;
  defense: number;
  description: string;
  disclaimerAccepted: boolean;
  artworkBuffer: Buffer;
  cropScale?: number;
  cropOffsetX?: number;
  cropOffsetY?: number;
  txSignature?: string;
}

export interface CustomCardPricingDto {
  balance: number;
  createdCount: number;
  nextCost: number;
  canAfford: boolean;
  battlePointCap: number;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function getCustomCardPricingUseCase(userId: string): Promise<CustomCardPricingDto> {
  const [user, createdCount] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { walletAddress: true } }),
    prisma.card.count({ where: { creatorId: userId, isCustom: true } }),
  ]);

  const tokenBalances = user?.walletAddress
    ? await getWalletTokenBalances(user.walletAddress).catch(() => null)
    : null;
  const balance = tokenBalances ? tokenBalances.nusa : 0;

  const nextCost = getCustomCardCost(createdCount);
  return {
    balance,
    createdCount,
    nextCost,
    canAfford: nextCost === 0 || balance >= nextCost,
    battlePointCap: CUSTOM_CARD_POLICY.defaultBattlePointCap,
  };
}

export async function prepareCustomCardBurnUseCase(userId: string) {
  const [user, createdCount] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { walletAddress: true } }),
    prisma.card.count({ where: { creatorId: userId, isCustom: true } }),
  ]);
  const nextCost = getCustomCardCost(createdCount);
  if (nextCost <= 0) {
    return { nextCost: 0, requiresBurn: false, serializedTransaction: null };
  }
  if (!user?.walletAddress) {
    throw AppError.badRequest(
      "Hubungkan dompet Solana terlebih dahulu untuk membayar biaya minting dengan NUSA."
    );
  }
  const balances = await getWalletTokenBalances(user.walletAddress);
  if (balances.nusa < nextCost) {
    throw AppError.badRequest(
      `Saldo NUSA tidak mencukupi (${balances.nusa.toLocaleString("id-ID")} NUSA). Butuh ${nextCost.toLocaleString("id-ID")} NUSA.`
    );
  }
  const burnTx = await buildBurnNusaTransaction({
    ownerWallet: user.walletAddress,
    uiAmount: nextCost,
  });
  return {
    nextCost,
    requiresBurn: true,
    walletAddress: user.walletAddress,
    ...burnTx,
  };
}

export async function createCustomCardUseCase(
  userId: string,
  input: CreateCustomCardInput,
) {
  if (!input.disclaimerAccepted) {
    throw AppError.validation(
      "Anda wajib menyetujui pernyataan kurasi konten sebelum mencetak kartu.",
      { disclaimer: ["Pernyataan persetujuan wajib dicentang."] },
    );
  }

  const cleanName = input.name.trim();
  if (cleanName.length < 3 || cleanName.length > 35) {
    throw AppError.validation("Nama karakter harus antara 3 hingga 35 karakter.", {
      name: ["Panjang nama antara 3 - 35 karakter."],
    });
  }

  if (input.attack < CUSTOM_CARD_POLICY.minAttack || input.defense < CUSTOM_CARD_POLICY.minDefense) {
    throw AppError.validation(
      `Nilai ATK dan DEF minimal masing-masing ${CUSTOM_CARD_POLICY.minAttack}.`,
    );
  }

  const totalBp = input.attack + input.defense;
  if (totalBp > CUSTOM_CARD_POLICY.defaultBattlePointCap) {
    throw AppError.validation(
      `Total Battle Point (ATK ${input.attack} + DEF ${input.defense} = ${totalBp} BP) melebihi batas ${CUSTOM_CARD_POLICY.defaultBattlePointCap} BP.`,
      { battlePoint: [`Maksimal total Battle Point adalah ${CUSTOM_CARD_POLICY.defaultBattlePointCap} BP.`] },
    );
  }

  const cleanDescription = input.description.trim();
  if (cleanDescription.length < 10 || cleanDescription.length > 250) {
    throw AppError.validation("Deskripsi sejarah karakter harus antara 10 hingga 250 karakter.", {
      description: ["Panjang deskripsi antara 10 - 250 karakter."],
    });
  }

  if (!input.artworkBuffer || input.artworkBuffer.length < 1000) {
    throw AppError.validation("Gambar karakter tidak valid atau terlalu kecil.", {
      artwork: ["File gambar wajib diunggah."],
    });
  }

  const pricing = await getCustomCardPricingUseCase(userId);
  if (pricing.nextCost > 0) {
    if (!input.txSignature) {
      throw AppError.badRequest(
        `Diperlukan transaksi burn ${pricing.nextCost.toLocaleString("id-ID")} NUSA terlebih dahulu.`
      );
    }
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { walletAddress: true },
    });
    if (!user?.walletAddress) {
      throw AppError.badRequest("Dompet Solana belum terhubung.");
    }
    const dup = await prisma.nusaPointTransaction.findFirst({
      where: { txSignature: input.txSignature },
      select: { id: true },
    });
    if (dup) {
      throw AppError.badRequest("Signature transaksi burn NUSA sudah pernah digunakan.");
    }
    await verifyNusaBurnTransaction({
      txSignature: input.txSignature,
      expectedOwnerWallet: user.walletAddress,
      minUiAmount: pricing.nextCost,
    });
  }

  const randomSuffix = randomBytes(3).toString("hex");
  const codeSuffix = randomBytes(2).toString("hex").toUpperCase();
  const slug = `custom-${slugify(cleanName)}-${randomSuffix}`;
  const code = `CC-${Date.now().toString(36).toUpperCase()}-${codeSuffix}`;
  const cardId = randomUUID();

  // 1. Bake gambar kartu (WebP) menggunakan template kerajaan
  const renderResult = await CustomCardCompositorService.renderAndSaveCard({
    slug,
    kingdom: input.kingdom,
    name: cleanName,
    gender: input.gender,
    role: input.role,
    attack: input.attack,
    defense: input.defense,
    description: cleanDescription,
    artworkBuffer: input.artworkBuffer,
    cropScale: input.cropScale,
    cropOffsetX: input.cropOffsetX,
    cropOffsetY: input.cropOffsetY,
  });

  // 2. Simpan ke database secara atomic
  const createdCard = await prisma.$transaction(async (tx) => {
    // Catat audit log burn NUSA jika biaya > 0
    if (pricing.nextCost > 0 && input.txSignature) {
      await tx.nusaPointTransaction.create({
        data: {
          id: randomUUID(),
          userId,
          amount: 0,
          source: "CUSTOM_CARD_MINT",
          sourceId: cardId,
          txSignature: input.txSignature,
        },
      });
    }

    // Buat entitas kartu
    const newCard = await tx.card.create({
      data: {
        id: cardId,
        code,
        slug,
        name: cleanName,
        cardType: "CHARACTER",
        kingdom: input.kingdom,
        role: input.role,
        secondaryRoles: [],
        gender: input.gender,
        baseAttack: input.attack,
        baseDefense: input.defense,
        historicalSummaryId: cleanDescription,
        historicalSummaryEn: cleanDescription,
        historicalSummaryZh: cleanDescription,
        illustrationNote: `Kartu kustom pemain akun ${userId}`,
        sourceCitation: "Kreasi Komunitas Nusantara",
        verificationStatus: "NEEDS_REVIEW",
        publicationStatus: "ACTIVE",
        isCustom: true,
        creatorId: userId,
        customStatus: "PENDING",
        imagePath: renderResult.imagePath,
      },
    });

    // Berikan kepemilikan kartu ke user pembuat
    await tx.userCard.create({
      data: {
        userId,
        cardId: newCard.id,
        quantity: 1,
        source: "CUSTOM_MINT",
      },
    });

    return newCard;
  });

  return {
    card: createdCard,
    costPaid: pricing.nextCost,
    remainingBalance: pricing.balance - pricing.nextCost,
  };
}

export async function listUserCustomCardsUseCase(userId: string) {
  return prisma.card.findMany({
    where: {
      creatorId: userId,
      isCustom: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function listPendingCustomCardsUseCase() {
  return prisma.card.findMany({
    where: {
      isCustom: true,
      customStatus: "PENDING",
    },
    include: {
      creator: {
        select: { id: true, name: true, walletAddress: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function reviewCustomCardUseCase(
  actorId: string,
  cardId: string,
  action: "APPROVE" | "REJECT",
  rejectionReason?: string,
) {
  const card = await prisma.card.findUnique({ where: { id: cardId } });
  if (!card || !card.isCustom) {
    throw AppError.notFound("Kartu kustom tidak ditemukan.");
  }

  const nextStatus: CustomCardStatus = action === "APPROVE" ? "APPROVED" : "REJECTED";
  const updated = await prisma.card.update({
    where: { id: cardId },
    data: {
      customStatus: nextStatus,
      rejectionReason: action === "REJECT" ? (rejectionReason ?? "Tidak memenuhi syarat komunitas.") : null,
      verificationStatus: action === "APPROVE" ? "VERIFIED" : "NEEDS_REVIEW",
    },
  });

  return updated;
}

