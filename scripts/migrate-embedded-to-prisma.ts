import { readFile } from "node:fs/promises";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

type State = {
  users: Array<Record<string, any>>;
  cards: Array<Record<string, any>>;
  decks: Array<Record<string, any>>;
  correctionReports: Array<Record<string, any>>;
  matchLogs: Array<Record<string, any>>;
  starterPacks: Array<Record<string, any>>;
  paymentOrders: Array<Record<string, any>>;
  battleSessions: Array<Record<string, any>>;
  userCards: Array<Record<string, any>>;
  paymentGatewaySetting?: Record<string, any>;
};

function date(value: string | null | undefined): Date | undefined {
  return value ? new Date(value) : undefined;
}

async function main(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL must be set");
  const sourcePath = path.join(process.cwd(), ".data", "nusantara-db.json");
  const state = JSON.parse(await readFile(sourcePath, "utf8")) as State;
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

  try {
    await prisma.$transaction(async (tx) => {
      const existing = await tx.user.count();
      if (existing > 0) throw new Error("Target DB already contains users; refusing import");

      await tx.user.createMany({ data: state.users.map((u) => ({
        id: u.id, email: u.email, name: u.name, googleId: u.googleId ?? null,
        avatarUrl: u.avatarUrl ?? null, passwordHash: u.passwordHash ?? "",
        role: u.role,
        hasClaimedStarterPack: state.paymentOrders.some((order) => order.userId === u.id && order.amountIdr === 0 && (order.paymentStatus ?? "PAID") === "PAID"),
        paymentModeOverride: u.paymentModeOverride ?? null,
        createdAt: date(u.createdAt), updatedAt: date(u.updatedAt ?? u.createdAt),
      })) });

      await tx.card.createMany({ data: state.cards.map((c) => ({
        id: c.id, code: c.code, slug: c.slug, name: c.name, cardType: c.cardType,
        kingdom: c.kingdom, role: c.role, secondaryRoles: c.secondaryRoles ?? [],
        gender: c.gender ?? null, baseAttack: c.baseAttack, baseDefense: c.baseDefense,
        effectName: c.effectName ?? null, effectType: c.effectType ?? null,
        effectDescriptionId: c.effectDescriptionId ?? null,
        effectDescriptionEn: c.effectDescriptionEn ?? null,
        effectDescriptionZh: c.effectDescriptionZh ?? null, attackMod: c.attackMod,
        defenseMod: c.defenseMod, enemyAttackMod: c.enemyAttackMod,
        ignoreDefenseAmount: c.ignoreDefenseAmount, affinityRole: c.affinityRole ?? null,
        affinityGender: c.affinityGender ?? null, affinityBonusAtk: c.affinityBonusAtk,
        affinityBonusDef: c.affinityBonusDef, historicalSummaryId: c.historicalSummaryId,
        historicalSummaryEn: c.historicalSummaryEn, historicalSummaryZh: c.historicalSummaryZh,
        illustrationNote: c.illustrationNote, sourceCitation: c.sourceCitation,
        sourceUrl: c.sourceUrl ?? null,
        verificationStatus: c.verificationStatus === "PENDING_REVIEW" ? "NEEDS_REVIEW" : c.verificationStatus,
        publicationStatus: c.publicationStatus, imagePath: c.imagePath,
        createdAt: date(c.createdAt), updatedAt: date(c.updatedAt),
      })) });

      const assets = state.cards.flatMap((c) => c.asset ? [{
        id: c.asset.id, cardId: c.id, filePath: c.imagePath,
        creator: c.asset.creator, rightsHolder: c.asset.rightsHolder,
        sourceOrigin: c.asset.sourceOrigin, acquiredAt: date(c.createdAt),
        licenseType: c.asset.licenseType, commercialAllowed: c.asset.commercialAllowed,
        creditText: c.asset.creditText,
        approvalStatus: c.asset.approvalStatus === "PENDING" ? "NEEDS_PERMISSION" : c.asset.approvalStatus,
      }] : []);
      if (assets.length) await tx.cardAsset.createMany({ data: assets });

      await tx.starterPack.createMany({ data: state.starterPacks.map((p) => ({
        id: p.id, code: p.code, nameId: p.nameId, nameEn: p.nameEn, nameZh: p.nameZh,
        descriptionId: p.descriptionId, descriptionEn: p.descriptionEn,
        descriptionZh: p.descriptionZh, kingdomTheme: p.kingdomTheme,
        priceIdr: p.priceIdr, cardSlugs: p.cardSlugs, isFairPlaySafe: p.isFairPlaySafe,
      })) });

      await tx.deck.createMany({ data: state.decks.map((d) => ({
        id: d.id, name: d.name, description: d.description ?? "",
        isPreset: d.isPreset, userId: d.userId ?? null,
        createdAt: date(d.createdAt), updatedAt: date(d.updatedAt),
      })) });
      const deckCards = state.decks.flatMap((d) => {
        const quantities = new Map<string, number>();
        for (const slot of d.cards ?? []) quantities.set(slot.cardId, (quantities.get(slot.cardId) ?? 0) + 1);
        return [...quantities].map(([cardId, quantity]) => ({
          id: `${d.id}-${cardId}`, deckId: d.id, cardId, quantity,
        }));
      });
      if (deckCards.length) await tx.deckCard.createMany({ data: deckCards });

      await tx.cardCorrectionReport.createMany({ data: state.correctionReports.map((r) => ({
        id: r.id, cardId: r.cardId, reporterName: r.reporterName,
        reporterEmail: r.reporterEmail ?? "", issueType: r.category,
        description: r.description, suggestedSource: r.referenceUrl ?? null,
        status: r.status === "DISMISSED" ? "REJECTED" : r.status,
        reviewerNote: r.resolutionNote ?? null,
        createdAt: date(r.createdAt), updatedAt: date(r.updatedAt),
      })) });

      await tx.match.createMany({ data: state.matchLogs.map((m) => ({
        id: m.id, userId: m.userId ?? null, deckName: m.playerDeckName,
        botDifficulty: m.botDifficulty, winner: m.winner,
        totalTurns: m.totalTurns, durationSec: m.durationSec,
        battleLogJson: JSON.stringify({ playerScore: m.playerScore, botScore: m.botScore }),
        createdAt: date(m.createdAt),
      })) });

      await tx.shopOrder.createMany({ data: state.paymentOrders.map((o) => ({
        id: o.id, referenceCode: o.orderNumber,
        userId: o.userId ?? null, starterPackId: o.starterPackId,
        buyerName: o.buyerName, buyerEmail: o.buyerEmail,
        paymentMethod: o.paymentMethod, amountIdr: o.amountIdr,
        paymentStatus: o.paymentStatus === "PAID" ? "PAID" : o.paymentStatus === "FAILED" ? "FAILED" : o.paymentStatus === "EXPIRED" ? "EXPIRED" : "PENDING",
        paymentProvider: o.paymentProvider ?? "LEGACY_SANDBOX",
        paymentMode: o.paymentMode ?? "DEV",
        gatewayReference: o.gatewayReference ?? null,
        paymentUrl: o.paymentUrl ?? null,
        paymentInstructions: o.paymentInstructions ?? (o.sandboxRef ? { legacySandboxReference: o.sandboxRef } : undefined),
        expiresAt: date(o.expiresAt),
        drawnCardSlugs: o.drawnCardSlugs ?? [],
        createdAt: date(o.createdAt), paidAt: date(o.paidAt),
      })) });

      await tx.paymentGatewaySetting.create({ data: {
        id: "global",
        globalMode: state.paymentGatewaySetting?.globalMode ?? "DEV",
        updatedByUserId: state.paymentGatewaySetting?.updatedByUserId ?? null,
        updatedAt: date(state.paymentGatewaySetting?.updatedAt) ?? new Date(),
      } });

      await tx.userCard.createMany({ data: state.userCards.map((uc) => ({
        id: uc.id, userId: uc.userId, cardId: uc.cardId, quantity: uc.quantity,
        source: uc.source, createdAt: date(uc.createdAt), updatedAt: date(uc.updatedAt ?? uc.createdAt),
      })) });

      const ledgerTx = state.userCards.map((uc) => ({
        id: `embedded-opening-${uc.userId}-${uc.cardId}`,
        idempotencyKey: `embedded-opening:${uc.userId}:${uc.cardId}`,
        type: "MIGRATION_OPENING_BALANCE", referenceId: "embedded-import",
        createdAt: date(uc.createdAt),
      }));
      await tx.cardLedgerTransaction.createMany({ data: ledgerTx });
      const ledgerEntries = state.userCards.flatMap((uc) => {
        const transactionId = `embedded-opening-${uc.userId}-${uc.cardId}`;
        return [
          { id: `embedded-system-${uc.userId}-${uc.cardId}`, transactionId, cardId: uc.cardId, accountType: "SYSTEM", accountId: "CARD_ISSUANCE", quantity: -uc.quantity },
          { id: `embedded-user-${uc.userId}-${uc.cardId}`, transactionId, cardId: uc.cardId, accountType: "USER", accountId: uc.userId, quantity: uc.quantity },
        ];
      });
      await tx.cardLedgerEntry.createMany({ data: ledgerEntries });
    }, { timeout: 120_000 });

    const [users, cards, decks, ownership, ledger, packs, orders] = await Promise.all([
      prisma.user.count(), prisma.card.count(), prisma.deck.count(), prisma.userCard.count(),
      prisma.cardLedgerTransaction.count(), prisma.starterPack.count(), prisma.shopOrder.count(),
    ]);
    console.log(JSON.stringify({ imported: { users, cards, decks, ownership, ledgerTransactions: ledger, starterPacks: packs, paymentOrders: orders } }));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Import failed");
  process.exitCode = 1;
});
