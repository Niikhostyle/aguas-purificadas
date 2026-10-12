-- Tenant appearance overrides (storefront + admin colors, favicon, admin login)
-- AlterTable
ALTER TABLE "tenants" ADD COLUMN     "appearance" JSONB;
