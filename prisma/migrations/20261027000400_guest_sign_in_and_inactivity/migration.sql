-- AlterTable users: add isGuest and lastActiveAt columns
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "isGuest" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex for guest inactivity cleanup query
CREATE INDEX IF NOT EXISTS "users_isGuest_lastActiveAt_idx" ON "users"("isGuest", "lastActiveAt");

-- AlterTable auth_sessions: add isGuest column
ALTER TABLE "auth_sessions" ADD COLUMN IF NOT EXISTS "isGuest" BOOLEAN NOT NULL DEFAULT false;

