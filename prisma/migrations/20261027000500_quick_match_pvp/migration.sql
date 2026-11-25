ALTER TABLE "battle_sessions"
  ADD COLUMN "opponentUserId" TEXT,
  ADD COLUMN "opponentDeckId" TEXT,
  ADD COLUMN "opponentDeckName" TEXT,
  ADD COLUMN "isQuickMatch" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "playerDeckCardSlugsJson" TEXT,
  ADD COLUMN "opponentDeckCardSlugsJson" TEXT,
  ADD COLUMN "rewardCardSlug" TEXT;
ALTER TABLE "battle_sessions"
  ADD COLUMN "opponentLastSeenAt" TIMESTAMP(3),
  ADD COLUMN "opponentDisconnectedAt" TIMESTAMP(3),
  ADD COLUMN "opponentReconnectDeadlineAt" TIMESTAMP(3);

ALTER TABLE "battle_sessions"
  ADD CONSTRAINT "battle_sessions_opponentUserId_fkey"
  FOREIGN KEY ("opponentUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "battle_sessions_opponentUserId_status_updatedAt_idx"
  ON "battle_sessions"("opponentUserId", "status", "updatedAt");

CREATE TABLE "quick_match_queue" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "deckId" TEXT NOT NULL,
  "deckName" TEXT NOT NULL,
  "battlePower" INTEGER NOT NULL,
  "characterSlugsJson" TEXT NOT NULL,
  "instrumentSlugsJson" TEXT NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "acceptedAt" TIMESTAMP(3) NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'WAITING',
  "battleSessionId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "quick_match_queue_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "quick_match_queue_userId_key" ON "quick_match_queue"("userId");
CREATE UNIQUE INDEX "quick_match_queue_idempotencyKey_key" ON "quick_match_queue"("idempotencyKey");
CREATE INDEX "quick_match_queue_status_createdAt_battlePower_idx"
  ON "quick_match_queue"("status", "createdAt", "battlePower");
ALTER TABLE "quick_match_queue"
  ADD CONSTRAINT "quick_match_queue_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
