CREATE TABLE "user_cards" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "source" TEXT NOT NULL DEFAULT 'PURCHASE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_cards_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "user_cards_userId_cardId_key" ON "user_cards"("userId", "cardId");
CREATE INDEX "user_cards_userId_idx" ON "user_cards"("userId");

ALTER TABLE "user_cards"
    ADD CONSTRAINT "user_cards_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "user_cards"
    ADD CONSTRAINT "user_cards_cardId_fkey"
    FOREIGN KEY ("cardId") REFERENCES "cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill already-paid starter pack orders so existing buyers keep their cards.
INSERT INTO "user_cards" ("id", "userId", "cardId", "quantity", "source", "createdAt", "updatedAt")
SELECT
    md5(tx."userId" || ':' || card."id"),
    tx."userId",
    card."id",
    COUNT(*)::INTEGER,
    'LEGACY_PURCHASE',
    MIN(tx."createdAt"),
    CURRENT_TIMESTAMP
FROM "sandbox_transactions" tx
JOIN "starter_packs" pack ON pack."id" = tx."starterPackId"
JOIN "cards" card ON card."slug" = ANY(pack."cardSlugs")
WHERE tx."userId" IS NOT NULL
  AND tx."status" IN ('PAID', 'PAID_SANDBOX_SIMULATION')
GROUP BY tx."userId", card."id"
ON CONFLICT ("userId", "cardId") DO NOTHING;
