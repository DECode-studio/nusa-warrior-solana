import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import {
  ALL_CARDS_CATALOG,
  STARTER_PACKS_CATALOG,
} from "../src/core/constants/cards-catalog";

if (typeof process.loadEnvFile === "function") {
  try {
    process.loadEnvFile(".env");
  } catch {
    // ignore
  }
}

const connectionString = process.env.DATABASE_URL ?? "";
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main(): Promise<void> {
  const cardIdBySlug = new Map<string, string>();

  for (const card of ALL_CARDS_CATALOG) {
    const verificationStatus =
      card.verificationStatus === "PENDING_REVIEW"
        ? "NEEDS_REVIEW"
        : card.verificationStatus;
    const approvalStatus =
      card.assetMetadata.approvalStatus === "PENDING"
        ? "NEEDS_PERMISSION"
        : card.assetMetadata.approvalStatus;

    const upsertedCard = await prisma.card.upsert({
      where: { slug: card.slug },
      update: {
        code: card.code,
        name: card.name,
        cardType: card.cardType,
        kingdom: card.kingdom,
        role: card.role,
        secondaryRoles: [...card.secondaryRoles],
        gender: card.gender,
        baseAttack: card.baseAttack,
        baseDefense: card.baseDefense,
        effectName: card.effectName,
        effectType: card.effectType,
        effectDescriptionId: card.effectDescriptionId,
        effectDescriptionEn: card.effectDescriptionEn,
        effectDescriptionZh: card.effectDescriptionZh,
        attackMod: card.attackMod,
        strikeAttackBonus: card.strikeAttackBonus ?? 0,
        defenseMod: card.defenseMod,
        enemyAttackMod: card.enemyAttackMod,
        ignoreDefenseAmount: card.ignoreDefenseAmount,
        affinityRole: card.affinityRole,
        affinityGender: card.affinityGender,
        affinityBonusAtk: card.affinityBonusAtk,
        affinityBonusDef: card.affinityBonusDef,
        historicalSummaryId: card.historicalSummaryId,
        historicalSummaryEn: card.historicalSummaryEn,
        historicalSummaryZh: card.historicalSummaryZh,
        illustrationNote: card.illustrationNote,
        sourceCitation: card.sourceCitation,
        sourceUrl: card.sourceUrl,
        verificationStatus,
        publicationStatus: card.publicationStatus,
        imagePath: card.imagePath,
      },
      create: {
        code: card.code,
        slug: card.slug,
        name: card.name,
        cardType: card.cardType,
        kingdom: card.kingdom,
        role: card.role,
        secondaryRoles: [...card.secondaryRoles],
        gender: card.gender,
        baseAttack: card.baseAttack,
        baseDefense: card.baseDefense,
        effectName: card.effectName,
        effectType: card.effectType,
        effectDescriptionId: card.effectDescriptionId,
        effectDescriptionEn: card.effectDescriptionEn,
        effectDescriptionZh: card.effectDescriptionZh,
        attackMod: card.attackMod,
        strikeAttackBonus: card.strikeAttackBonus ?? 0,
        defenseMod: card.defenseMod,
        enemyAttackMod: card.enemyAttackMod,
        ignoreDefenseAmount: card.ignoreDefenseAmount,
        affinityRole: card.affinityRole,
        affinityGender: card.affinityGender,
        affinityBonusAtk: card.affinityBonusAtk,
        affinityBonusDef: card.affinityBonusDef,
        historicalSummaryId: card.historicalSummaryId,
        historicalSummaryEn: card.historicalSummaryEn,
        historicalSummaryZh: card.historicalSummaryZh,
        illustrationNote: card.illustrationNote,
        sourceCitation: card.sourceCitation,
        sourceUrl: card.sourceUrl,
        verificationStatus,
        publicationStatus: card.publicationStatus,
        imagePath: card.imagePath,
        assets: {
          create: [
            {
              filePath: card.imagePath,
              creator: card.assetMetadata.creator,
              rightsHolder: card.assetMetadata.rightsHolder,
              sourceOrigin: card.assetMetadata.sourceOrigin,
              licenseType: card.assetMetadata.licenseType,
              commercialAllowed: card.assetMetadata.commercialAllowed,
              creditText: card.assetMetadata.creditText,
              approvalStatus,
            },
          ],
        },
      },
    });
    cardIdBySlug.set(card.slug, upsertedCard.id);
  }

  for (const pack of STARTER_PACKS_CATALOG) {
    await prisma.starterPack.upsert({
      where: { code: pack.code },
      update: {
        nameId: pack.nameId,
        nameEn: pack.nameEn,
        nameZh: pack.nameZh,
        descriptionId: pack.descriptionId,
        descriptionEn: pack.descriptionEn,
        descriptionZh: pack.descriptionZh,
        kingdomTheme: pack.kingdomTheme,
        priceIdr: pack.priceIdr,
        cardSlugs: [...pack.cardSlugs],
        isFairPlaySafe: pack.isFairPlaySafe,
        imagePath: pack.imagePath,
        packType: pack.packType,
        isStarter: pack.isStarter ?? false,
        cardCount: pack.cardCount,
      },
      create: {
        code: pack.code,
        nameId: pack.nameId,
        nameEn: pack.nameEn,
        nameZh: pack.nameZh,
        descriptionId: pack.descriptionId,
        descriptionEn: pack.descriptionEn,
        descriptionZh: pack.descriptionZh,
        kingdomTheme: pack.kingdomTheme,
        priceIdr: pack.priceIdr,
        cardSlugs: [...pack.cardSlugs],
        isFairPlaySafe: pack.isFairPlaySafe,
        imagePath: pack.imagePath,
        packType: pack.packType,
        isStarter: pack.isStarter ?? false,
        cardCount: pack.cardCount,
      },
    });
  }

  const existingDecksCount = await prisma.deck.count();
  if (existingDecksCount === 0) {
    for (const pack of STARTER_PACKS_CATALOG) {
      const deckCardCreates: Array<{
        cardId: string;
        quantity: number;
      }> = [];
      let charCount = 0;
      let instCount = 0;
      for (const slug of pack.cardSlugs) {
        const cardId = cardIdBySlug.get(slug);
        const card = ALL_CARDS_CATALOG.find((c) => c.slug === slug);
        if (cardId && card) {
          if (card.cardType === "CHARACTER" && charCount < 10) {
            charCount++;
            deckCardCreates.push({
              cardId,
              quantity: 1,
            });
          } else if (card.cardType === "INSTRUMENT" && instCount < 10) {
            instCount++;
            deckCardCreates.push({
              cardId,
              quantity: 1,
            });
          }
        }
      }

      await prisma.deck.create({
        data: {
          name: pack.nameId,
          description: pack.descriptionId,
          isPreset: true,
          userId: null,
          cards: {
            create: deckCardCreates,
          },
        },
      });
    }
  }

  console.info(
    `Seeded ${ALL_CARDS_CATALOG.length} Nusantara cards and ${STARTER_PACKS_CATALOG.length} starter packs successfully without user data.`
  );
}

main()
  .catch((error: unknown) => {
    console.error("Failed to seed database:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
