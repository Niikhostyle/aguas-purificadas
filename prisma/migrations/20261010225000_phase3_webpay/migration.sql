-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "buyOrder" TEXT,
ADD COLUMN     "paidAt" TIMESTAMP(3),
ADD COLUMN     "paymentProvider" TEXT,
ADD COLUMN     "webpayAuthorizationCode" TEXT,
ADD COLUMN     "webpayCardLast4" TEXT,
ADD COLUMN     "webpayPaymentTypeCode" TEXT,
ADD COLUMN     "webpayResponseCode" INTEGER,
ADD COLUMN     "webpayStatus" TEXT,
ADD COLUMN     "webpayToken" TEXT;

-- CreateTable
CREATE TABLE "webpay_credentials" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "commerceCode" TEXT NOT NULL,
    "apiKeyEncrypted" TEXT NOT NULL,
    "environment" TEXT NOT NULL DEFAULT 'integration',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "webpay_credentials_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "webpay_credentials_tenantId_key" ON "webpay_credentials"("tenantId");

-- CreateIndex
CREATE INDEX "orders_webpayToken_idx" ON "orders"("webpayToken");

-- CreateIndex
CREATE UNIQUE INDEX "orders_tenantId_buyOrder_key" ON "orders"("tenantId", "buyOrder");

-- AddForeignKey
ALTER TABLE "webpay_credentials" ADD CONSTRAINT "webpay_credentials_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
