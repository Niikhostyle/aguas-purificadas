-- AlterTable
ALTER TABLE "tenants" ADD COLUMN     "billingClientId" TEXT,
ADD COLUMN     "billingOrderId" TEXT,
ADD COLUMN     "billingStatus" TEXT,
ADD COLUMN     "billingUpdatedAt" TIMESTAMP(3),
ADD COLUMN     "plan" TEXT;

-- CreateTable
CREATE TABLE "admin_invites" (
    "id" TEXT NOT NULL,
    "adminUserId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_invites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admin_invites_tokenHash_key" ON "admin_invites"("tokenHash");

-- CreateIndex
CREATE INDEX "admin_invites_adminUserId_idx" ON "admin_invites"("adminUserId");

-- CreateIndex
CREATE UNIQUE INDEX "tenants_billingOrderId_key" ON "tenants"("billingOrderId");

-- AddForeignKey
ALTER TABLE "admin_invites" ADD CONSTRAINT "admin_invites_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "admin_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
