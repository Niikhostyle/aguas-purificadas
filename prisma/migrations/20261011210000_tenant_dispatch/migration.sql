-- Tenant dispatch: routes, delivery customers (recurrence), audit events, bottle ledger
-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "bottlesDelivered" INTEGER,
ADD COLUMN     "bottlesReturned" INTEGER,
ADD COLUMN     "deliveredAt" TIMESTAMP(3),
ADD COLUMN     "deliveryCommune" TEXT,
ADD COLUMN     "deliveryCustomerId" TEXT,
ADD COLUMN     "deliveryDate" DATE,
ADD COLUMN     "deliverySlot" TEXT,
ADD COLUMN     "dispatchNotes" TEXT,
ADD COLUMN     "fulfillmentStatus" TEXT NOT NULL DEFAULT 'por_asignar',
ADD COLUMN     "outForDeliveryAt" TIMESTAMP(3),
ADD COLUMN     "routeId" TEXT,
ADD COLUMN     "routeStop" INTEGER,
ADD COLUMN     "scheduledAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "delivery_routes" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "slot" TEXT,
    "sector" TEXT,
    "driverName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'planificada',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "delivery_routes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_customers" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "address" TEXT,
    "commune" TEXT,
    "recurring" BOOLEAN NOT NULL DEFAULT false,
    "frequency" TEXT,
    "nextDeliveryDate" DATE,
    "lastDeliveredAt" TIMESTAMP(3),
    "lastReminderAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "delivery_customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_events" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT,
    "note" TEXT,
    "actorEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bottle_movements" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "orderId" TEXT,
    "direction" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "reason" TEXT NOT NULL DEFAULT 'entrega',
    "note" TEXT,
    "actorEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bottle_movements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "delivery_routes_tenantId_date_idx" ON "delivery_routes"("tenantId", "date");

-- CreateIndex
CREATE INDEX "delivery_customers_tenantId_recurring_nextDeliveryDate_idx" ON "delivery_customers"("tenantId", "recurring", "nextDeliveryDate");

-- CreateIndex
CREATE UNIQUE INDEX "delivery_customers_tenantId_phone_key" ON "delivery_customers"("tenantId", "phone");

-- CreateIndex
CREATE INDEX "order_events_tenantId_createdAt_idx" ON "order_events"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "order_events_orderId_idx" ON "order_events"("orderId");

-- CreateIndex
CREATE INDEX "bottle_movements_tenantId_customerId_idx" ON "bottle_movements"("tenantId", "customerId");

-- CreateIndex
CREATE INDEX "bottle_movements_orderId_idx" ON "bottle_movements"("orderId");

-- CreateIndex
CREATE INDEX "orders_tenantId_fulfillmentStatus_idx" ON "orders"("tenantId", "fulfillmentStatus");

-- CreateIndex
CREATE INDEX "orders_tenantId_deliveryDate_idx" ON "orders"("tenantId", "deliveryDate");

-- CreateIndex
CREATE INDEX "orders_routeId_idx" ON "orders"("routeId");

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "delivery_routes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_deliveryCustomerId_fkey" FOREIGN KEY ("deliveryCustomerId") REFERENCES "delivery_customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_routes" ADD CONSTRAINT "delivery_routes_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_customers" ADD CONSTRAINT "delivery_customers_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_events" ADD CONSTRAINT "order_events_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_events" ADD CONSTRAINT "order_events_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bottle_movements" ADD CONSTRAINT "bottle_movements_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bottle_movements" ADD CONSTRAINT "bottle_movements_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "delivery_customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bottle_movements" ADD CONSTRAINT "bottle_movements_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

