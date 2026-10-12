import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { DISPATCHABLE_PAYMENT, bottlesForItems, dateFromStr, shortRef } from "@/lib/dispatch";
import { cityCenter, type DispatchMapData, type LatLng, type MapOrder, type MapRoute } from "@/lib/geo";
import { TRAIL_WINDOW_MS, isLive } from "@/lib/live-tracking";

export type MapFilters = {
  /** YYYY-MM-DD */
  date: string;
  routeId?: string;
  driver?: string;
  status?: string;
};

const MAP_ORDER_SELECT = {
  id: true,
  lat: true,
  lng: true,
  geoSource: true,
  status: true,
  fulfillmentStatus: true,
  customerName: true,
  customerAddress: true,
  deliveryCommune: true,
  totalClp: true,
  routeId: true,
  routeStop: true,
  deliverySlot: true,
  items: { select: { productName: true, quantity: true } },
  route: {
    select: {
      id: true,
      name: true,
      driverName: true,
      status: true,
      driverLat: true,
      driverLng: true,
      driverSeenAt: true,
    },
  },
} satisfies Prisma.OrderSelect;

type MapRow = Prisma.OrderGetPayload<{ select: typeof MAP_ORDER_SELECT }>;

function toMapOrder(o: MapRow): Omit<MapOrder, "lat" | "lng"> {
  return {
    id: o.id,
    ref: shortRef(o.id),
    status: o.fulfillmentStatus,
    payment: o.status,
    customerName: o.customerName,
    address: o.customerAddress,
    commune: o.deliveryCommune,
    items: o.items.map((i) => `${i.quantity}× ${i.productName}`).join(" · "),
    totalClp: o.totalClp,
    bottles: bottlesForItems(o.items),
    routeId: o.routeId,
    routeStop: o.routeStop,
    slot: o.deliverySlot,
    geoSource: o.geoSource,
  };
}

/**
 * Orders of a day (plus unplanned ones) with their routes, in one tenant-scoped query.
 * Routes are drawn in stop order; the driver marker sits on the last delivered stop
 * (or the first stop if the route hasn't delivered anything yet).
 */
export async function getDispatchMapData(
  tenantId: string,
  city: string | null,
  filters: MapFilters,
): Promise<DispatchMapData> {
  const day = dateFromStr(filters.date);
  const where: Prisma.OrderWhereInput = {
    tenantId,
    status: { in: DISPATCHABLE_PAYMENT },
    OR: [
      { deliveryDate: day },
      { deliveryDate: null, fulfillmentStatus: { in: ["por_asignar", "no_entregado"] } },
    ],
    ...(filters.status ? { fulfillmentStatus: filters.status } : {}),
    ...(filters.routeId ? { routeId: filters.routeId } : {}),
    ...(filters.driver ? { route: { driverName: filters.driver } } : {}),
  };

  const rows = await prisma.order.findMany({
    where,
    select: MAP_ORDER_SELECT,
    orderBy: [{ routeStop: "asc" }, { createdAt: "asc" }],
    take: 500,
  });

  const center = cityCenter(city);
  const orders: MapOrder[] = [];
  const seen = new Map<string, number>();
  let unlocated = 0;
  let notFound = 0;
  for (const o of rows) {
    if (o.lat == null || o.lng == null) {
      if (o.geoSource !== "no_encontrado") {
        unlocated++;
        continue;
      }
      // Parked next to the city center so the admin can drag it to the right place.
      const angle = notFound * 0.9;
      const r = 0.004 + notFound * 0.0012;
      notFound++;
      orders.push({
        ...toMapOrder(o),
        lat: center[0] + r * Math.sin(angle),
        lng: center[1] + r * Math.cos(angle),
        approx: true,
      });
      continue;
    }
    // Same address twice (e.g. a customer with two orders): fan the pins out ~15 m so both stay clickable.
    const key = `${o.lat.toFixed(5)},${o.lng.toFixed(5)}`;
    const dup = seen.get(key) ?? 0;
    seen.set(key, dup + 1);
    const angle = dup * 2.4;
    const offset = dup ? 0.00014 : 0;
    orders.push({
      ...toMapOrder(o),
      lat: o.lat + offset * Math.sin(angle),
      lng: o.lng + offset * Math.cos(angle),
    });
  }

  const byRoute = new Map<
    string,
    { meta: NonNullable<MapRow["route"]>; list: MapOrder[]; total: number; deliveredCount: number }
  >();
  for (const o of rows) {
    if (!o.route) continue;
    const entry = byRoute.get(o.route.id) ?? { meta: o.route, list: [], total: 0, deliveredCount: 0 };
    entry.total++;
    if (o.fulfillmentStatus === "entregado") entry.deliveredCount++;
    byRoute.set(o.route.id, entry);
  }
  for (const o of orders) {
    if (o.routeId && !o.approx) byRoute.get(o.routeId)?.list.push(o);
  }

  const trails = new Map<string, LatLng[]>();
  if (byRoute.size) {
    const pings = await prisma.routePing.findMany({
      where: {
        tenantId,
        routeId: { in: Array.from(byRoute.keys()) },
        createdAt: { gte: new Date(Date.now() - TRAIL_WINDOW_MS) },
      },
      select: { routeId: true, lat: true, lng: true },
      orderBy: { createdAt: "asc" },
      take: 5000,
    });
    for (const p of pings) trails.set(p.routeId, [...(trails.get(p.routeId) ?? []), [p.lat, p.lng]]);
  }

  const routes: MapRoute[] = Array.from(byRoute.values())
    .sort((a, b) => a.meta.name.localeCompare(b.meta.name, "es"))
    .map(({ meta, list, total, deliveredCount }, i) => {
      const stops = [...list].sort((a, b) => (a.routeStop ?? 999) - (b.routeStop ?? 999));
      const delivered = stops.filter((s) => s.status === "entregado");
      const anchor = delivered.at(-1) ?? stops[0];
      const live = isLive(meta.driverSeenAt) && meta.driverLat != null && meta.driverLng != null;
      const estimated = anchor && meta.status !== "completada" ? ([anchor.lat, anchor.lng] as LatLng) : null;
      return {
        id: meta.id,
        name: meta.name,
        driverName: meta.driverName,
        status: meta.status,
        colorIndex: i,
        stops: stops.map((s) => [s.lat, s.lng] as LatLng),
        driverPos: live ? ([meta.driverLat!, meta.driverLng!] as LatLng) : estimated,
        driverLive: live,
        driverSeenAt: meta.driverSeenAt?.toISOString() ?? null,
        trail: trails.get(meta.id) ?? [],
        total,
        delivered: deliveredCount,
      };
    });

  return { center, orders, routes, unlocated, notFound };
}
