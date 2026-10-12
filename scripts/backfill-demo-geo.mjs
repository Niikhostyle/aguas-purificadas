#!/usr/bin/env node
/**
 * Idempotent backfill for an already-seeded demo tenant: fills lat/lng on the demo
 * dispatch customers/orders (rows created by seed-demo-dispatch.mjs only), gives
 * untracked demo products some stock and re-orders demo routes by proximity so the
 * dispatch map shows realistic Santiago routes. Safe to run repeatedly.
 *
 * Usage: DATABASE_URL=... node scripts/backfill-demo-geo.mjs [tenantSlug=demo]
 */
import { PrismaClient } from "@prisma/client";
import { DEMO_COORDS, demoGeoQuery, demoStockFor } from "./demo-geo-data.mjs";

const prisma = new PrismaClient();
const slug = process.argv[2] || "demo";
const MARK = "DEMOSEED-";
const PHONE_PREFIX = "56991000";

function nearestNeighbour(list) {
  if (list.length < 3 || list.some((o) => o.lat == null)) return list;
  const out = [list[0]];
  const rest = list.slice(1);
  const d = (a, b) => (a.lat - b.lat) ** 2 + (a.lng - b.lng) ** 2;
  while (rest.length) {
    const last = out.at(-1);
    let best = 0;
    for (let k = 1; k < rest.length; k++) if (d(last, rest[k]) < d(last, rest[best])) best = k;
    out.push(rest.splice(best, 1)[0]);
  }
  return out;
}

async function main() {
  const tenant = await prisma.tenant.findUnique({ where: { slug } });
  if (!tenant) throw new Error(`Tenant ${slug} not found`);
  const tenantId = tenant.id;

  let customers = 0;
  const seedCustomers = await prisma.deliveryCustomer.findMany({
    where: { tenantId, phone: { startsWith: PHONE_PREFIX }, lat: null },
    select: { id: true, address: true, commune: true },
  });
  for (const c of seedCustomers) {
    const coords = c.address ? DEMO_COORDS[c.address] : undefined;
    if (!coords) continue;
    await prisma.deliveryCustomer.update({
      where: { id: c.id },
      data: { lat: coords[0], lng: coords[1], geoSource: "seed", geoAddress: demoGeoQuery(c.address, c.commune) },
    });
    customers++;
  }

  let orders = 0;
  const seedOrders = await prisma.order.findMany({
    where: { tenantId, buyOrder: { startsWith: MARK }, lat: null },
    select: { id: true, customerAddress: true, createdAt: true },
  });
  for (const o of seedOrders) {
    const coords = DEMO_COORDS[o.customerAddress];
    if (!coords) continue;
    await prisma.order.update({
      where: { id: o.id },
      data: { lat: coords[0], lng: coords[1], geoSource: "seed", geocodedAt: o.createdAt },
    });
    orders++;
  }

  let products = 0;
  for (const p of await prisma.product.findMany({ where: { tenantId, stock: null }, select: { id: true, name: true } })) {
    const stock = demoStockFor(p.name);
    if (stock === null) continue;
    await prisma.product.update({ where: { id: p.id }, data: { stock } });
    products++;
  }

  let routes = 0;
  const demoRoutes = await prisma.deliveryRoute.findMany({
    where: { tenantId, orders: { some: { buyOrder: { startsWith: MARK } }, every: { buyOrder: { startsWith: MARK } } } },
    select: { id: true },
  });
  for (const r of demoRoutes) {
    const list = await prisma.order.findMany({
      where: { tenantId, routeId: r.id },
      select: { id: true, deliveryCommune: true, customerAddress: true, lat: true, lng: true, routeStop: true },
    });
    list.sort((a, b) =>
      `${a.deliveryCommune}|${a.customerAddress}`.localeCompare(`${b.deliveryCommune}|${b.customerAddress}`, "es", { numeric: true }),
    );
    const ordered = nearestNeighbour(list);
    let changed = false;
    for (const [i, o] of ordered.entries()) {
      if (o.routeStop !== i + 1) {
        await prisma.order.update({ where: { id: o.id }, data: { routeStop: i + 1 } });
        changed = true;
      }
    }
    if (changed) routes++;
  }

  console.log(
    `Demo geo backfill OK for "${slug}": ${orders} orders, ${customers} customers located · ${products} products with demo stock · ${routes} routes re-ordered`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
