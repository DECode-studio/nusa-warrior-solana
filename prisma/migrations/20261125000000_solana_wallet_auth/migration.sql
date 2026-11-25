-- AlterTable users: remove email, googleId, isGuest and add walletAddress
DROP INDEX IF EXISTS "users_email_key";
DROP INDEX IF EXISTS "users_googleId_key";
DROP INDEX IF EXISTS "users_isGuest_lastActiveAt_idx";

ALTER TABLE "users"
  DROP COLUMN IF EXISTS "email",
  DROP COLUMN IF EXISTS "googleId",
  DROP COLUMN IF EXISTS "isGuest",
  ADD COLUMN IF NOT EXISTS "walletAddress" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "users_walletAddress_key" ON "users"("walletAddress");

-- AlterTable auth_sessions: replace email and isGuest with walletAddress
ALTER TABLE "auth_sessions"
  DROP COLUMN IF EXISTS "email",
  DROP COLUMN IF EXISTS "isGuest",
  ADD COLUMN IF NOT EXISTS "walletAddress" TEXT;
