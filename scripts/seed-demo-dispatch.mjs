#!/usr/bin/env node
/**
 * Idempotent demo data for the tenant dispatch panel (orders across comunas,
 * days and statuses, routes, recurring customers and bottle balances).
 * Only touches rows it created (buyOrder prefix DEMOSEED-, phones 56991000xxx).
 *
 * Usage: DATABASE_URL=... node scripts/seed-demo-dispatch.mjs [tenantSlug=demo]
 * Plain JS so it runs inside the production image (no tsx).
 */
import { PrismaClient } from "@prisma/client";
import { DEMO_COORDS, demoGeoQuery, demoStockFor } from "./demo-geo-data.mjs";

const prisma = new PrismaClient();
const slug = process.argv[2] || "demo";
const MARK = "DEMOSEED-";
const PHONE_PREFIX = "56991000";

const TZ = "America/Santiago";
const todayStr = new Intl.DateTimeFormat("en-CA", {
  timeZone: TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
}).format(new Date());
const day = (offset) => {
  const d = new Date(`${todayStr}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + offset);
  return d;
};
/** Chile local hour on a given day offset → UTC instant (approx. UTC-3/-4). */
const at = (offset, hour, minute = 0) => {
  const d = day(offset);
  d.setUTCHours(hour + 3, minute, 0, 0);
  return d > new Date() ? new Date(Date.now() - 5 * 60_000) : d;
};

let seed = 42;
const rand = () => {
  seed = (seed * 1103515245 + 12345) % 2147483648;
  return seed / 2147483648;
};

const ZONES = [
  { name: "Santiago centro", communes: "Santiago, Providencia, Ñuñoa", costClp: 0 },
  { name: "Gran Santiago", communes: "Maipú, La Florida, Puente Alto", costClp: 1990 },
  { name: "Sector oriente", communes: "Las Condes, Vitacura, La Reina", costClp: 1490 },
];

const CUSTOMERS = [
  ["Camila Rojas", "Av. Providencia 1840, depto 1203", "Providencia", "Santiago centro"],
  ["Matías González", "Eliodoro Yáñez 2250", "Providencia", "Santiago centro"],
  ["Fernanda Muñoz", "Irarrázaval 3410, depto 504", "Ñuñoa", "Santiago centro"],
  ["Diego Soto", "Pedro de Valdivia 4120", "Ñuñoa", "Santiago centro"],
  ["Valentina Díaz", "San Diego 980", "Santiago", "Santiago centro"],
  ["Sebastián Pérez", "Lira 455, depto 81", "Santiago", "Santiago centro"],
  ["Javiera Contreras", "Av. Pajaritos 3120", "Maipú", "Gran Santiago"],
  ["Benjamín Silva", "5 de Abril 1050", "Maipú", "Gran Santiago"],
  ["Catalina Morales", "Vicuña Mackenna 7350", "La Florida", "Gran Santiago"],
  ["Tomás Araya", "Walker Martínez 1420", "La Florida", "Gran Santiago"],
  ["Antonia Fuentes", "Concha y Toro 2890", "Puente Alto", "Gran Santiago"],
  ["Nicolás Espinoza", "Av. Gabriela 1765", "Puente Alto", "Gran Santiago"],
  ["Isidora Castillo", "Apoquindo 5400, of. 302", "Las Condes", "Sector oriente"],
  ["Joaquín Herrera", "Manquehue Sur 520", "Las Condes", "Sector oriente"],
  ["Martina Vargas", "Vitacura 6780", "Vitacura", "Sector oriente"],
  ["Agustín Tapia", "Príncipe de Gales 6930", "La Reina", "Sector oriente"],
  ["Florencia Reyes", "Larraín 8120", "La Reina", "Sector oriente"],
  ["Lucas Guzmán", "Av. Ossa 1450", "Ñuñoa", "Santiago centro"],
  ["Emilia Navarro", "Santa Rosa 7020", "La Florida", "Gran Santiago"],
  ["Vicente Cortés", "Américo Vespucio 1500", "Maipú", "Gran Santiago"],
  ["Sofía Cárdenas", "Holanda 3150", "Providencia", "Santiago centro"],
  ["Maximiliano Lagos", "Las Condes 11200", "Las Condes", "Sector oriente"],
];

const RECURRING = {
  0: ["quincenal", 0],
  2: ["semanal", -2],
  6: ["mensual", 1],
  8: ["semanal", 2],
  12: ["quincenal", -1],
  14: ["mensual", 3],
  16: ["semanal", 6],
  20: ["quincenal", 1],
};

const FALLBACK_PRODUCTS = [
  { name: "Botellón 20 Lts", slug: "botellon-20-lts", priceClp: 2300 },
  { name: "Botellón 12 Lts", slug: "botellon-12-lts", priceClp: 2000 },
  { name: "Dispensador de mesa", slug: "dispensador-mesa", priceClp: 10000 },
  { name: "Bomba Manual", slug: "bomba-manual", priceClp: 4000 },
];

const isReturnable = (name) =>
  !/dispensador|surtidor|bomba|vaso|soporte|toma|rack|porta/i.test(name) &&
  /bid[oó]n|recarga|botell[oó]n/i.test(name);

async function main() {
  const tenant = await prisma.tenant.findUnique({ where: { slug } });
  if (!tenant) throw new Error(`Tenant ${slug} not found`);
  const tenantId = tenant.id;

  // Cleanup previous seed rows only
  const seedCustomers = await prisma.deliveryCustomer.findMany({
    where: { tenantId, phone: { startsWith: PHONE_PREFIX } },
    select: { id: true },
  });
  await prisma.bottleMovement.deleteMany({
    where: { tenantId, customerId: { in: seedCustomers.map((c) => c.id) } },
  });
  await prisma.order.deleteMany({ where: { tenantId, buyOrder: { startsWith: MARK } } });
  await prisma.deliveryRoute.deleteMany({ where: { tenantId, orders: { none: {} } } });
  await prisma.deliveryCustomer.deleteMany({ where: { id: { in: seedCustomers.map((c) => c.id) } } });

  const zones = {};
  for (const z of ZONES) {
    const existing = await prisma.deliveryZone.findFirst({ where: { tenantId, name: z.name } });
    zones[z.name] =
      existing ?? (await prisma.deliveryZone.create({ data: { tenantId, ...z, active: true } }));
  }

  const dbProducts = await prisma.product.findMany({
    where: { tenantId, active: true },
    orderBy: { sortOrder: "asc" },
  });
  const products = dbProducts.length ? dbProducts : FALLBACK_PRODUCTS;
  const bottlesP = products.filter((p) => isReturnable(p.name));
  const extrasP = products.filter((p) => !isReturnable(p.name));
  if (!bottlesP.length) bottlesP.push(FALLBACK_PRODUCTS[0]);

  for (const p of dbProducts) {
    const stock = demoStockFor(p.name);
    if (p.stock === null && stock !== null) {
      await prisma.product.update({ where: { id: p.id }, data: { stock } });
    }
  }

  const customers = [];
  for (const [i, [name, address, commune]] of CUSTOMERS.entries()) {
    const rec = RECURRING[i];
    const coords = DEMO_COORDS[address];
    customers.push(
      await prisma.deliveryCustomer.create({
        data: {
          tenantId,
          name,
          phone: `${PHONE_PREFIX}${String(100 + i).padStart(3, "0")}`,
          address,
          commune,
          ...(coords
            ? { lat: coords[0], lng: coords[1], geoSource: "seed", geoAddress: demoGeoQuery(address, commune) }
            : {}),
          recurring: Boolean(rec),
          frequency: rec?.[0] ?? null,
          nextDeliveryDate: rec ? day(rec[1]) : null,
          lastReminderAt: rec && rec[1] < 0 ? at(-1, 11) : null,
        },
      }),
    );
  }

  const routeCache = new Map();
  async function route(name, offset, slot, sector, driverName, status) {
    const key = `${name}|${offset}`;
    if (!routeCache.has(key)) {
      routeCache.set(
        key,
        await prisma.deliveryRoute.create({
          data: { tenantId, name, date: day(offset), slot, sector, driverName, status },
        }),
      );
    }
    return routeCache.get(key);
  }

  let n = 0;
  async function order(ci, spec) {
    n++;
    const c = customers[ci];
    const [, , commune, zoneName] = CUSTOMERS[ci];
    const zone = zones[zoneName];
    const bp = bottlesP[Math.floor(rand() * bottlesP.length)];
    const qty = 1 + Math.floor(rand() * 4);
    const items = [{ p: bp, q: qty }];
    if (extrasP.length && rand() < 0.2) items.push({ p: extrasP[Math.floor(rand() * extrasP.length)], q: 1 });
    const subtotal = items.reduce((s, it) => s + it.p.priceClp * it.q, 0);
    const bottles = items.reduce((s, it) => s + (isReturnable(it.p.name) ? it.q : 0), 0);
    const created = at(spec.createdOffset ?? spec.dayOffset ?? 0, 8 + Math.floor(rand() * 4), Math.floor(rand() * 60));
    const paid = spec.payment === "paid";
    const f = spec.fulfillment;
    const dayOffset = spec.dayOffset;
    const scheduledAt = ["programado", "en_ruta", "entregado"].includes(f) ? new Date(created.getTime() + 30 * 60_000) : null;
    const outAt = ["en_ruta", "entregado"].includes(f) ? at(dayOffset ?? 0, spec.slot === "tarde" ? 14 : 9, 15) : null;
    const deliveredAt = f === "entregado" ? at(dayOffset ?? 0, spec.slot === "tarde" ? 15 : 10, Math.floor(rand() * 59)) : null;
    const returned = f === "entregado" ? Math.max(0, bottles - (rand() < 0.35 ? 1 + Math.floor(rand() * 2) : 0)) : null;

    const o = await prisma.order.create({
      data: {
        tenantId,
        deliveryZoneId: zone.id,
        deliveryZoneName: zone.name,
        deliveryCommune: commune,
        deliveryCustomerId: c.id,
        status: spec.payment,
        customerName: c.name,
        customerPhone: `+${c.phone.slice(0, 2)} ${c.phone.slice(2, 3)} ${c.phone.slice(3, 7)} ${c.phone.slice(7)}`,
        customerAddress: c.address,
        ...(c.lat != null ? { lat: c.lat, lng: c.lng, geoSource: "seed", geocodedAt: created } : {}),
        customerNotes: rand() < 0.25 ? ["Dejar en conserjería", "Tocar timbre 2 veces", "Llamar al llegar", "Horario después de las 10"][Math.floor(rand() * 4)] : null,
        subtotalClp: subtotal,
        shippingClp: zone.costClp,
        totalClp: subtotal + zone.costClp,
        buyOrder: `${MARK}${String(n).padStart(4, "0")}`,
        paymentProvider: spec.payment === "pending" ? null : "mock",
        webpayStatus: paid ? "AUTHORIZED" : spec.payment === "failed" ? "FAILED" : null,
        webpayResponseCode: paid ? 0 : spec.payment === "failed" ? -1 : null,
        webpayAuthorizationCode: paid ? String(100000 + Math.floor(rand() * 899999)) : null,
        webpayPaymentTypeCode: paid ? (rand() < 0.6 ? "VD" : "VN") : null,
        webpayCardLast4: paid ? String(1000 + Math.floor(rand() * 8999)) : null,
        paidAt: paid ? new Date(created.getTime() + 2 * 60_000) : null,
        fulfillmentStatus: f,
        deliveryDate: dayOffset === undefined ? null : day(dayOffset),
        deliverySlot: spec.slot ?? null,
        routeId: spec.route?.id ?? null,
        scheduledAt,
        outForDeliveryAt: outAt,
        deliveredAt,
        bottlesDelivered: f === "entregado" ? bottles : null,
        bottlesReturned: returned,
        dispatchNotes: f === "entregado" && returned < bottles ? `Cliente se quedó con ${bottles - returned} envase(s)` : null,
        createdAt: created,
        items: {
          create: items.map((it) => ({
            productId: it.p.id ?? null,
            productName: it.p.name,
            productSlug: it.p.slug,
            unitPriceClp: it.p.priceClp,
            quantity: it.q,
            lineTotalClp: it.p.priceClp * it.q,
          })),
        },
      },
    });

    const events = [];
    if (scheduledAt) events.push({ type: "asignado", fromStatus: "por_asignar", toStatus: "programado", createdAt: scheduledAt, note: spec.route?.name ?? null });
    if (outAt) events.push({ type: "en_ruta", fromStatus: "programado", toStatus: "en_ruta", createdAt: outAt });
    if (deliveredAt) events.push({ type: "entregado", fromStatus: "en_ruta", toStatus: "entregado", createdAt: deliveredAt, note: returned ? `${returned} envases devueltos` : null });
    if (events.length) {
      await prisma.orderEvent.createMany({
        data: events.map((e) => ({ tenantId, orderId: o.id, actorEmail: "demo@mibidon.cl", ...e })),
      });
    }
    if (f === "entregado") {
      const mv = [{ direction: "out", quantity: bottles, reason: "entrega" }];
      if (returned) mv.push({ direction: "in", quantity: returned, reason: "devolucion" });
      await prisma.bottleMovement.createMany({
        data: mv
          .filter((m) => m.quantity > 0)
          .map((m) => ({ tenantId, customerId: c.id, orderId: o.id, createdAt: deliveredAt, actorEmail: "demo@mibidon.cl", ...m })),
      });
      await prisma.deliveryCustomer.update({ where: { id: c.id }, data: { lastDeliveredAt: deliveredAt } });
    }
    return o;
  }

  // History: last 6 days, delivered
  for (let d = -6; d <= -1; d++) {
    const centro = await route(`Santiago centro · ${day(d).toISOString().slice(8, 10)}/${day(d).toISOString().slice(5, 7)}`, d, "manana", "Santiago centro", "Juan Pérez", "completada");
    const gran = await route(`Gran Santiago · ${day(d).toISOString().slice(8, 10)}/${day(d).toISOString().slice(5, 7)}`, d, "tarde", "Gran Santiago", "Rodrigo Muñoz", "completada");
    for (let k = 0; k < 3; k++) {
      const ci = Math.floor(rand() * CUSTOMERS.length);
      const sector = CUSTOMERS[ci][3];
      await order(ci, {
        payment: "paid",
        fulfillment: "entregado",
        dayOffset: d,
        createdOffset: d - 1,
        slot: sector === "Gran Santiago" ? "tarde" : "manana",
        route: sector === "Gran Santiago" ? gran : sector === "Santiago centro" ? centro : null,
      });
    }
  }

  // Today
  const dd = todayStr.slice(8, 10);
  const mm = todayStr.slice(5, 7);
  const rCentro = await route(`Santiago centro · ${dd}/${mm}`, 0, "manana", "Santiago centro", "Juan Pérez", "en_ruta");
  const rGran = await route(`Gran Santiago · ${dd}/${mm}`, 0, "tarde", "Gran Santiago", "Rodrigo Muñoz", "planificada");
  const today = [
    [0, "paid", "entregado", rCentro, "manana"],
    [4, "paid", "entregado", rCentro, "manana"],
    [1, "paid", "en_ruta", rCentro, "manana"],
    [3, "pending", "en_ruta", rCentro, "manana"],
    [5, "paid", "en_ruta", rCentro, "manana"],
    [17, "paid", "programado", rCentro, "manana"],
    [6, "paid", "programado", rGran, "tarde"],
    [8, "paid", "programado", rGran, "tarde"],
    [9, "pending", "programado", rGran, "tarde"],
    [10, "paid", "programado", rGran, "tarde"],
    [19, "paid", "programado", rGran, "tarde"],
    [12, "paid", "por_asignar", null, null],
    [13, "paid", "por_asignar", null, null],
    [15, "pending", "por_asignar", null, null],
  ];
  for (const [ci, payment, fulfillment, r, slot] of today) {
    await order(ci, { payment, fulfillment, dayOffset: 0, createdOffset: -1, route: r, slot });
  }

  // Tomorrow and day after: scheduled without route yet
  for (const ci of [2, 7, 11, 14, 20]) {
    await order(ci, { payment: "paid", fulfillment: "programado", dayOffset: 1, createdOffset: 0, slot: rand() < 0.5 ? "manana" : "tarde" });
  }
  for (const ci of [16, 18, 21]) {
    await order(ci, { payment: rand() < 0.7 ? "paid" : "pending", fulfillment: "programado", dayOffset: 2, createdOffset: 0 });
  }
  // New today, not planned (no date)
  for (const ci of [1, 9, 13, 21]) {
    await order(ci, { payment: ci === 9 ? "pending" : "paid", fulfillment: "por_asignar", createdOffset: 0 });
  }
  // Payment problems (excluded from dispatch)
  await order(11, { payment: "failed", fulfillment: "por_asignar", createdOffset: 0 });
  await order(18, { payment: "cancelled", fulfillment: "por_asignar", createdOffset: -2 });

  for (const r of routeCache.values()) {
    const list = await prisma.order.findMany({
      where: { tenantId, routeId: r.id },
      select: { id: true, deliveryCommune: true, customerAddress: true, lat: true, lng: true },
    });
    list.sort((a, b) => `${a.deliveryCommune}|${a.customerAddress}`.localeCompare(`${b.deliveryCommune}|${b.customerAddress}`, "es", { numeric: true }));
    // Nearest-neighbour from the first stop so the demo map draws plausible routes
    if (list.length > 2 && list.every((o) => o.lat != null)) {
      const rest = list.splice(1);
      while (rest.length) {
        const last = list.at(-1);
        let best = 0;
        for (let k = 1; k < rest.length; k++) {
          const d = (o) => (o.lat - last.lat) ** 2 + (o.lng - last.lng) ** 2;
          if (d(rest[k]) < d(rest[best])) best = k;
        }
        list.push(rest.splice(best, 1)[0]);
      }
    }
    for (const [i, o] of list.entries()) {
      await prisma.order.update({ where: { id: o.id }, data: { routeStop: i + 1 } });
    }
  }

  await prisma.deliveryRoute.deleteMany({ where: { tenantId, orders: { none: {} } } });

  console.log(`Demo dispatch seed OK for "${slug}": ${n} orders, ${customers.length} customers, ${routeCache.size} routes (today ${todayStr})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
