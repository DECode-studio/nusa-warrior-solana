ALTER TABLE "battle_sessions"
ADD COLUMN "storyKingdom" "Kingdom",
ADD COLUMN "storyMissionId" TEXT,
ADD COLUMN "storyChoiceId" TEXT;

CREATE TABLE "story_progress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kingdom" "Kingdom" NOT NULL,
    "completedMissionIds" JSONB NOT NULL DEFAULT '[]',
    "replayCounts" JSONB NOT NULL DEFAULT '{}',
    "choices" JSONB NOT NULL DEFAULT '{}',
    "claimedBattleIds" JSONB NOT NULL DEFAULT '[]',
    "claimResults" JSONB NOT NULL DEFAULT '{}',
    "endingSeen" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "story_progress_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "story_progress_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "story_progress_userId_kingdom_key"
ON "story_progress"("userId", "kingdom");

CREATE INDEX "story_progress_userId_idx"
ON "story_progress"("userId");
