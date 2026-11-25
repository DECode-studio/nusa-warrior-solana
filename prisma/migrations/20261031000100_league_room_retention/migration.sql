ALTER TABLE "league_rooms"
ADD COLUMN "terminalAt" TIMESTAMP(3);

UPDATE "league_rooms"
SET "terminalAt" = "updatedAt"
WHERE "status" IN ('CANCELLED', 'COMPLETED');

CREATE INDEX "league_rooms_isPublic_status_terminalAt_idx"
ON "league_rooms"("isPublic", "status", "terminalAt");
