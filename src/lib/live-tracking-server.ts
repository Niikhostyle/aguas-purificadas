import { prisma } from "@/lib/db";
import type { LatLng } from "@/lib/geo";
import {
  PING_MIN_DISTANCE_M,
  PING_MIN_INTERVAL_MS,
  PING_RETENTION_MS,
  distanceMeters,
  etaMinutes,
  isLive,
  type OrderTracking,
} from "@/lib/live-tracking";

export type DriverFix = { lat: number; lng: number; accuracy?: number | null; heading?: number | null };

/** Stores the driver's latest fix on the route and appends a trail point when it moved or enough time passed. */
export async function recordDriverPosition(tenantId: string, routeId: string, fix: DriverFix): Promise<boolean> {
  const route = await prisma.deliveryRoute.findFirst({
    where: { id: routeId, tenantId },
    select: { id: true, driverLat: true, driverLng: true, driverSeenAt: true },
  });
  if (!route) return false;

  const now = new Date();
  const prev: LatLng | null = route.driverLat != null && route.driverLng != null ? [route.driverLat, route.driverLng] : null;
  const addPing =
    !prev ||
    !route.driverSeenAt ||
    now.getTime() - route.driverSeenAt.getTime() >= PING_MIN_INTERVAL_MS ||
    distanceMeters(prev, [fix.lat, fix.lng]) >= PING_MIN_DISTANCE_M;

  await prisma.$transaction([
    prisma.deliveryRoute.update({
      where: { id: route.id },
      data: {
        driverLat: fix.lat,
        driverLng: fix.lng,
        driverAccuracy: fix.accuracy ?? null,
        driverHeading: fix.heading ?? null,
        driverSeenAt: now,
      },
    }),
    ...(addPing ? [prisma.routePing.create({ data: { tenantId, routeId: route.id, lat: fix.lat, lng: fix.lng } })] : []),
  ]);

  if (addPing && Math.random() < 0.02) {
    await prisma.routePing.deleteMany({ where: { createdAt: { lt: new Date(now.getTime() - PING_RETENTION_MS) } } });
  }
  return true;
}

export async function stopDriverSharing(tenantId: string, routeId: string): Promise<void> {
  await prisma.deliveryRoute.updateMany({ where: { id: routeId, tenantId }, data: { driverSeenAt: null } });
}

/**
 * What the customer may see about their own order: the driver's position only while the order is
 * out for delivery, and just a count of the deliveries ahead (never other customers' addresses).
 */
export async function getOrderTracking(tenantId: string, orderId: string): Promise<OrderTracking | null> {
  const order = await prisma.order.findFirst({
    where: { id: orderId, tenantId },
    select: {
      fulfillmentStatus: true,
      lat: true,
      lng: true,
      routeId: true,
      routeStop: true,
      deliveredAt: true,
      route: {
        select: { driverName: true, driverLat: true, driverLng: true, driverHeading: true, driverSeenAt: true },
      },
    },
  });
  if (!order) return null;

  const destination: LatLng | null = order.lat != null && order.lng != null ? [order.lat, order.lng] : null;
  const base: OrderTracking = {
    fulfillment: order.fulfillmentStatus,
    destination,
    driver: null,
    driverName: order.route?.driverName ?? null,
    stopsBefore: 0,
    etaMin: null,
    deliveredAt: order.deliveredAt?.toISOString() ?? null,
  };
  const r = order.route;
  if (order.fulfillmentStatus !== "en_ruta" || !r || r.driverLat == null || r.driverLng == null || !r.driverSeenAt) {
    return base;
  }

  const stopsBefore =
    order.routeId && order.routeStop != null
      ? await prisma.order.count({
          where: {
            tenantId,
            routeId: order.routeId,
            routeStop: { lt: order.routeStop },
            fulfillmentStatus: { in: ["programado", "en_ruta"] },
          },
        })
      : 0;
  const pos: LatLng = [r.driverLat, r.driverLng];
  const live = isLive(r.driverSeenAt);
  return {
    ...base,
    driver: { pos, heading: r.driverHeading, seenAt: r.driverSeenAt.toISOString(), live },
    stopsBefore,
    etaMin: live && destination ? etaMinutes(pos, destination, stopsBefore) : null,
  };
}
