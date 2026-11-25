ALTER TABLE "shop_orders"
ADD COLUMN "originalAmountIdr" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "pointsSpent" INTEGER NOT NULL DEFAULT 0;

UPDATE "shop_orders"
SET "originalAmountIdr" = "amountIdr"
WHERE "originalAmountIdr" = 0;

CREATE TABLE "nusa_point_transactions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "source" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "opponentUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "nusa_point_transactions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "nusa_point_transactions_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "nusa_point_transactions_userId_source_sourceId_key"
ON "nusa_point_transactions"("userId", "source", "sourceId");

CREATE INDEX "nusa_point_transactions_userId_createdAt_idx"
ON "nusa_point_transactions"("userId", "createdAt");

CREATE INDEX "nusa_point_transactions_source_createdAt_idx"
ON "nusa_point_transactions"("source", "createdAt");

CREATE INDEX "nusa_point_transactions_opponentUserId_createdAt_idx"
ON "nusa_point_transactions"("opponentUserId", "createdAt");
