CREATE TABLE "league_rooms" (
  "id" TEXT NOT NULL,
  "creatorId" TEXT NOT NULL,
  "joinCode" TEXT NOT NULL,
  "isPublic" BOOLEAN NOT NULL DEFAULT false,
  "status" TEXT NOT NULL DEFAULT 'REGISTRATION_OPEN',
  "maxParticipants" INTEGER,
  "registrationClosesAt" TIMESTAMP(3) NOT NULL,
  "startMode" TEXT NOT NULL DEFAULT 'AUTO',
  "startDelayMinutes" INTEGER NOT NULL DEFAULT 3,
  "scheduledStartAt" TIMESTAMP(3),
  "manualStartDeadlineAt" TIMESTAMP(3),
  "rulesJson" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "league_rooms_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "league_rooms_joinCode_key" ON "league_rooms"("joinCode");
CREATE INDEX "league_rooms_isPublic_status_registrationClosesAt_idx" ON "league_rooms"("isPublic", "status", "registrationClosesAt");
CREATE INDEX "league_rooms_creatorId_status_idx" ON "league_rooms"("creatorId", "status");
ALTER TABLE "league_rooms" ADD CONSTRAINT "league_rooms_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "league_participants" (
  "id" TEXT NOT NULL,
  "leagueId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'PARTICIPANT',
  "status" TEXT NOT NULL DEFAULT 'REGISTERED',
  "deckId" TEXT,
  "stakeCardSlug" TEXT,
  "reconnectDeadlineAt" TIMESTAMP(3),
  "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "league_participants_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "league_participants_leagueId_userId_key" ON "league_participants"("leagueId", "userId");
CREATE INDEX "league_participants_leagueId_role_status_joinedAt_idx" ON "league_participants"("leagueId", "role", "status", "joinedAt");
ALTER TABLE "league_participants" ADD CONSTRAINT "league_participants_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "league_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "league_participants" ADD CONSTRAINT "league_participants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "league_rounds" (
  "id" TEXT NOT NULL,
  "leagueId" TEXT NOT NULL,
  "roundNumber" INTEGER NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "league_rounds_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "league_rounds_leagueId_roundNumber_key" ON "league_rounds"("leagueId", "roundNumber");
ALTER TABLE "league_rounds" ADD CONSTRAINT "league_rounds_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "league_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "league_matches" (
  "id" TEXT NOT NULL,
  "roundId" TEXT NOT NULL,
  "playerOneId" TEXT NOT NULL,
  "playerTwoId" TEXT,
  "winnerId" TEXT,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "battleSessionId" TEXT,
  "durationDeadlineAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  CONSTRAINT "league_matches_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "league_matches_battleSessionId_key" ON "league_matches"("battleSessionId");
CREATE INDEX "league_matches_roundId_status_idx" ON "league_matches"("roundId", "status");
ALTER TABLE "league_matches" ADD CONSTRAINT "league_matches_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "league_rounds"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "league_matches" ADD CONSTRAINT "league_matches_battleSessionId_fkey" FOREIGN KEY ("battleSessionId") REFERENCES "battle_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
