-- Descuentos por tienda (automáticos o cupón) y snapshot del descuento en pedidos. Solo aditiva.

-- AlterTable
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "couponCode" TEXT,
ADD COLUMN IF NOT EXISTS "discountClp" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "discountLabel" TEXT;

-- CreateTable
CREATE TABLE IF NOT EXISTS "discounts" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'percent',
    "value" INTEGER NOT NULL,
    "scope" TEXT NOT NULL DEFAULT 'all',
    "productIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "couponCode" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "bannerText" TEXT,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "discounts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "discounts_tenantId_active_idx" ON "discounts"("tenantId", "active");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "discounts_tenantId_couponCode_key" ON "discounts"("tenantId", "couponCode");

-- AddForeignKey
ALTER TABLE "discounts" ADD CONSTRAINT "discounts_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
