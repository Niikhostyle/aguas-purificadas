-- AlterTable
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "modulesEnabled" JSONB;
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "modulesContent" JSONB;
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "youtubeUrl" TEXT;

-- CreateTable
CREATE TABLE IF NOT EXISTS "customers" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "customers_tenantId_idx" ON "customers"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "customers_tenantId_email_key" ON "customers"("tenantId", "email");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "customers" ADD CONSTRAINT "customers_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
