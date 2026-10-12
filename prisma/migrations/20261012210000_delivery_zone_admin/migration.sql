-- AlterTable
ALTER TABLE "delivery_zones" ADD COLUMN "freeOverClp" INTEGER,
ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;
