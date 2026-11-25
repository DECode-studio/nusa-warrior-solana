CREATE TYPE "PaymentMode" AS ENUM ('DEV', 'PROD');

CREATE TYPE "ShopOrderPaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'EXPIRED');

ALTER TABLE "users"
ADD COLUMN "paymentModeOverride" "PaymentMode";

ALTER TABLE "sandbox_transactions"
RENAME TO "shop_orders";

ALTER TABLE "shop_orders"
ADD COLUMN "paymentStatus" "ShopOrderPaymentStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN "paymentProvider" TEXT NOT NULL DEFAULT 'LEGACY_SANDBOX',
ADD COLUMN "paymentMode" "PaymentMode" NOT NULL DEFAULT 'DEV',
ADD COLUMN "gatewayReference" TEXT,
ADD COLUMN "paymentUrl" TEXT,
ADD COLUMN "paymentInstructions" JSONB,
ADD COLUMN "expiresAt" TIMESTAMP(3),
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "paidAt" TIMESTAMP(3);

UPDATE "shop_orders"
SET "paymentStatus" = 'PAID',
    "paymentProvider" = 'LEGACY_SANDBOX',
    "paymentMode" = 'DEV',
    "paidAt" = "createdAt",
    "updatedAt" = "createdAt";

UPDATE "users" AS users
SET "hasClaimedStarterPack" = EXISTS (
    SELECT 1
    FROM "shop_orders" AS orders
    WHERE orders."userId" = users."id"
      AND orders."amountIdr" = 0
      AND orders."paymentStatus" = 'PAID'
);

ALTER TABLE "shop_orders"
DROP COLUMN "status";

ALTER TABLE "shop_orders"
ALTER COLUMN "paymentStatus" DROP DEFAULT;

ALTER TABLE "shop_orders"
RENAME CONSTRAINT "sandbox_transactions_pkey" TO "shop_orders_pkey";

ALTER INDEX "sandbox_transactions_referenceCode_key"
RENAME TO "shop_orders_referenceCode_key";

ALTER TABLE "shop_orders"
RENAME CONSTRAINT "sandbox_transactions_userId_fkey" TO "shop_orders_userId_fkey";

ALTER TABLE "shop_orders"
RENAME CONSTRAINT "sandbox_transactions_starterPackId_fkey" TO "shop_orders_starterPackId_fkey";

CREATE UNIQUE INDEX "shop_orders_gatewayReference_key"
ON "shop_orders"("gatewayReference");

CREATE INDEX "shop_orders_userId_createdAt_idx"
ON "shop_orders"("userId", "createdAt");

CREATE INDEX "shop_orders_paymentStatus_expiresAt_idx"
ON "shop_orders"("paymentStatus", "expiresAt");

CREATE TABLE "payment_gateway_settings" (
    "id" TEXT NOT NULL DEFAULT 'global',
    "globalMode" "PaymentMode" NOT NULL DEFAULT 'DEV',
    "updatedByUserId" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_gateway_settings_pkey" PRIMARY KEY ("id")
);

INSERT INTO "payment_gateway_settings" ("id", "globalMode", "updatedAt")
VALUES ('global', 'DEV', CURRENT_TIMESTAMP);
