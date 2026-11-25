import "server-only";
import { randomBytes, randomUUID } from "node:crypto";
import { prisma } from "@/server/shared/db/prisma";
import { AppError } from "@/server/shared/errors/app-error";
import type { Kingdom, CharacterGender, CharacterRole, CustomCardStatus } from "@prisma/client";
import {
  CUSTOM_CARD_POLICY,
  getCustomCardCost,
  getNusaPointBalancePrisma,
  deductNusaPointsForCustomCardPrisma,
} from "@/server/modules/nusa-points/domain/nusa-point-policy";
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
  const [balance, createdCount] = await Promise.all([
    getNusaPointBalancePrisma(userId),
    prisma.card.count({ where: { creatorId: userId, isCustom: true } }),
  ]);

  const nextCost = getCustomCardCost(createdCount);
  return {
    balance,
    createdCount,
    nextCost,
    canAfford: balance >= nextCost,
    battlePointCap: CUSTOM_CARD_POLICY.defaultBattlePointCap,
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
  if (!pricing.canAfford) {
    throw AppError.badRequest(
      `Saldo NusaPoint Anda tidak mencukupi (${pricing.balance} NP). Butuh ${pricing.nextCost} NP untuk membuat kartu.`,
    );
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
    // Potong NusaPoint jika biaya > 0
    if (pricing.nextCost > 0) {
      await deductNusaPointsForCustomCardPrisma(tx, {
        userId,
        cardId,
        cost: pricing.nextCost,
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

