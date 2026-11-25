ALTER TABLE "battle_sessions"
  ADD COLUMN "createRequestKey" TEXT,
  ADD COLUMN "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "disconnectedAt" TIMESTAMP(3),
  ADD COLUMN "reconnectDeadlineAt" TIMESTAMP(3),
  ADD COLUMN "turnDeadlineAt" TIMESTAMP(3),
  ADD COLUMN "rngCommitment" TEXT,
  ADD COLUMN "rngSecret" TEXT,
  ADD COLUMN "rngCounter" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "rngDrawsJson" TEXT NOT NULL DEFAULT '[]';
CREATE UNIQUE INDEX "battle_sessions_createRequestKey_key" ON "battle_sessions"("createRequestKey");

CREATE TABLE "card_ledger_transactions" (
  "id" TEXT NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "referenceId" TEXT,
  "actorUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "card_ledger_transactions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "card_ledger_transactions_idempotencyKey_key" ON "card_ledger_transactions"("idempotencyKey");
CREATE INDEX "card_ledger_transactions_referenceId_type_idx" ON "card_ledger_transactions"("referenceId", "type");
ALTER TABLE "card_ledger_transactions" ADD CONSTRAINT "card_ledger_transactions_actorUserId_fkey"
  FOREIGN KEY ("actorUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "card_ledger_entries" (
  "id" TEXT NOT NULL,
  "transactionId" TEXT NOT NULL,
  "cardId" TEXT NOT NULL,
  "accountType" TEXT NOT NULL,
  "accountId" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "card_ledger_entries_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "card_ledger_entries_nonzero_quantity" CHECK ("quantity" <> 0)
);
CREATE INDEX "card_ledger_entries_cardId_accountType_accountId_idx" ON "card_ledger_entries"("cardId", "accountType", "accountId");
CREATE INDEX "card_ledger_entries_transactionId_idx" ON "card_ledger_entries"("transactionId");
ALTER TABLE "card_ledger_entries" ADD CONSTRAINT "card_ledger_entries_transactionId_fkey"
  FOREIGN KEY ("transactionId") REFERENCES "card_ledger_transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "card_ledger_entries" ADD CONSTRAINT "card_ledger_entries_cardId_fkey"
  FOREIGN KEY ("cardId") REFERENCES "cards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "card_escrows" (
  "id" TEXT NOT NULL,
  "ownerUserId" TEXT NOT NULL,
  "referenceType" TEXT NOT NULL,
  "referenceId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "idempotencyKey" TEXT NOT NULL,
  "reserveTransactionId" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "card_escrows_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "card_escrows_idempotencyKey_key" ON "card_escrows"("idempotencyKey");
CREATE UNIQUE INDEX "card_escrows_reserveTransactionId_key" ON "card_escrows"("reserveTransactionId");
CREATE INDEX "card_escrows_referenceType_referenceId_status_idx" ON "card_escrows"("referenceType", "referenceId", "status");
CREATE INDEX "card_escrows_ownerUserId_status_idx" ON "card_escrows"("ownerUserId", "status");
ALTER TABLE "card_escrows" ADD CONSTRAINT "card_escrows_ownerUserId_fkey"
  FOREIGN KEY ("ownerUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "card_escrows" ADD CONSTRAINT "card_escrows_reserveTransactionId_fkey"
  FOREIGN KEY ("reserveTransactionId") REFERENCES "card_ledger_transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "card_escrow_items" (
  "id" TEXT NOT NULL,
  "escrowId" TEXT NOT NULL,
  "cardId" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL,
  CONSTRAINT "card_escrow_items_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "card_escrow_items_positive_quantity" CHECK ("quantity" > 0)
);
CREATE UNIQUE INDEX "card_escrow_items_escrowId_cardId_key" ON "card_escrow_items"("escrowId", "cardId");
ALTER TABLE "card_escrow_items" ADD CONSTRAINT "card_escrow_items_escrowId_fkey"
  FOREIGN KEY ("escrowId") REFERENCES "card_escrows"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "card_escrow_items" ADD CONSTRAINT "card_escrow_items_cardId_fkey"
  FOREIGN KEY ("cardId") REFERENCES "cards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "api_rate_limit_buckets" (
  "key" TEXT NOT NULL,
  "tokens" DOUBLE PRECISION NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "api_rate_limit_buckets_pkey" PRIMARY KEY ("key")
);
CREATE INDEX "api_rate_limit_buckets_expiresAt_idx" ON "api_rate_limit_buckets"("expiresAt");

-- Existing UserCard rows are the opening balance for the immutable ledger.
INSERT INTO "card_ledger_transactions" ("id", "idempotencyKey", "type", "referenceId", "createdAt")
SELECT md5('inventory-migration:' || uc."userId" || ':' || uc."cardId"),
       'inventory-migration:' || uc."userId" || ':' || uc."cardId",
       'MIGRATION_OPENING_BALANCE', 'user-card-backfill', CURRENT_TIMESTAMP
FROM "user_cards" uc
ON CONFLICT ("idempotencyKey") DO NOTHING;

INSERT INTO "card_ledger_entries" ("id", "transactionId", "cardId", "accountType", "accountId", "quantity")
SELECT md5('system-opening:' || uc."userId" || ':' || uc."cardId"),
       md5('inventory-migration:' || uc."userId" || ':' || uc."cardId"),
       uc."cardId", 'SYSTEM', 'CARD_ISSUANCE', -uc."quantity"
FROM "user_cards" uc
ON CONFLICT ("id") DO NOTHING;

CREATE FUNCTION "reject_card_ledger_mutation"() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'Card ledger rows are immutable; write a compensating transaction instead.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "card_ledger_transactions_immutable"
  BEFORE UPDATE OR DELETE ON "card_ledger_transactions"
  FOR EACH ROW EXECUTE FUNCTION "reject_card_ledger_mutation"();
CREATE TRIGGER "card_ledger_entries_immutable"
  BEFORE UPDATE OR DELETE ON "card_ledger_entries"
  FOR EACH ROW EXECUTE FUNCTION "reject_card_ledger_mutation"();
CREATE TRIGGER "card_escrow_items_immutable"
  BEFORE UPDATE OR DELETE ON "card_escrow_items"
  FOR EACH ROW EXECUTE FUNCTION "reject_card_ledger_mutation"();

INSERT INTO "card_ledger_entries" ("id", "transactionId", "cardId", "accountType", "accountId", "quantity")
SELECT md5('user-opening:' || uc."userId" || ':' || uc."cardId"),
       md5('inventory-migration:' || uc."userId" || ':' || uc."cardId"),
       uc."cardId", 'USER', uc."userId", uc."quantity"
FROM "user_cards" uc
ON CONFLICT ("id") DO NOTHING;
