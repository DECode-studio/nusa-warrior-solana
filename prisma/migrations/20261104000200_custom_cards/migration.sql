-- CreateEnum
CREATE TYPE "CustomCardStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "cards"
ADD COLUMN "isCustom" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "creatorId" TEXT,
ADD COLUMN "customStatus" "CustomCardStatus",
ADD COLUMN "rejectionReason" TEXT;

-- CreateIndex
CREATE INDEX "cards_isCustom_customStatus_idx" ON "cards"("isCustom", "customStatus");
CREATE INDEX "cards_creatorId_idx" ON "cards"("creatorId");

-- AddForeignKey
ALTER TABLE "cards" ADD CONSTRAINT "cards_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

