ALTER TABLE "delivery_routes" ADD COLUMN "driverLat" DOUBLE PRECISION,
ADD COLUMN "driverLng" DOUBLE PRECISION,
ADD COLUMN "driverAccuracy" DOUBLE PRECISION,
ADD COLUMN "driverHeading" DOUBLE PRECISION,
ADD COLUMN "driverSeenAt" TIMESTAMP(3);

CREATE TABLE "route_pings" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "route_pings_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "route_pings_routeId_createdAt_idx" ON "route_pings"("routeId", "createdAt");
CREATE INDEX "route_pings_createdAt_idx" ON "route_pings"("createdAt");

ALTER TABLE "route_pings" ADD CONSTRAINT "route_pings_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "delivery_routes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
