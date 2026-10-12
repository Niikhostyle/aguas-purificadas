import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  DISPATCHABLE_PAYMENT,
  addFrequency,
  bottlesForItems,
  compareStops,
  dateFromStr,
  normalizePhone,
  orderByProximity,
  todayCl,
} from "@/lib/dispatch";

type Tx = Prisma.TransactionClient;

export async function ensureDeliveryCustomer(
  tx: Tx,
  tenantId: string,
  data: { name: string; phone: string; address?: string | null; commune?: string | null },
) {
  const phone = normalizePhone(data.phone);
  return tx.deliveryCustomer.upsert({
    where: { tenantId_phone: { tenantId, phone } },
    update: {
      name: data.name,
      address: data.address ?? undefined,
      commune: data.commune ?? undefined,
    },
    create: {
      tenantId,
      phone,
      name: data.name,
      address: data.address ?? null,
      commune: data.commune ?? null,
    },
  });
}

/** Loads orders belonging to the tenant that can be dispatched. */
async function loadOrders(tx: Tx, tenantId: string, orderIds: string[]) {
  return tx.order.findMany({
    where: {
      id: { in: orderIds },
      tenantId,
      status: { in: DISPATCHABLE_PAYMENT },
    },
    include: { items: true },
  });
}

export async function assignOrders(opts: {
  tenantId: string;
  actorEmail: string;
  orderIds: string[];
  date: string;
  slot?: string | null;
  routeId?: string | null;
  newRouteName?: string | null;
}) {
  return prisma.$transaction(async (tx) => {
    let routeId: string | null = null;
    if (opts.routeId) {
      const route = await tx.deliveryRoute.findFirst({
        where: { id: opts.routeId, tenantId: opts.tenantId },
      });
      if (!route) throw new Error("Ruta no encontrada");
      routeId = route.id;
    } else if (opts.newRouteName) {
      const route = await tx.deliveryRoute.create({
        data: {
          tenantId: opts.tenantId,
          name: opts.newRouteName,
          date: dateFromStr(opts.date),
          slot: opts.slot ?? null,
        },
      });
      routeId = route.id;
    }

    const orders = await loadOrders(tx, opts.tenantId, opts.orderIds);
    const now = new Date();
    for (const order of orders) {
      if (order.fulfillmentStatus === "entregado") continue;
      const toStatus = order.fulfillmentStatus === "en_ruta" ? "en_ruta" : "programado";
      await tx.order.update({
        where: { id: order.id },
        data: {
          deliveryDate: dateFromStr(opts.date),
          deliverySlot: opts.slot ?? order.deliverySlot,
          routeId: routeId ?? order.routeId,
          fulfillmentStatus: toStatus,
          scheduledAt: order.scheduledAt ?? now,
        },
      });
      await tx.orderEvent.create({
        data: {
          tenantId: opts.tenantId,
          orderId: order.id,
          type: "asignado",
          fromStatus: order.fulfillmentStatus,
          toStatus,
          note: [opts.date, opts.slot, opts.newRouteName ?? null].filter(Boolean).join(" · "),
          actorEmail: opts.actorEmail,
        },
      });
    }
    if (routeId) await renumberRoute(tx, opts.tenantId, routeId);
    return orders.length;
  });
}

export async function renumberRoute(tx: Tx, tenantId: string, routeId: string) {
  const orders = await tx.order.findMany({
    where: { tenantId, routeId },
    select: { id: true, deliveryCommune: true, deliveryZoneName: true, customerAddress: true, lat: true, lng: true },
  });
  orders.sort(compareStops);
  for (const [i, o] of orderByProximity(orders).entries()) {
    await tx.order.update({ where: { id: o.id }, data: { routeStop: i + 1 } });
  }
}

/**
 * Groups unrouted orders of a day into one route per sector (delivery zone),
 * stops sorted by comuna then address.
 */
export async function autoGroupDay(opts: { tenantId: string; actorEmail: string; date: string }) {
  return prisma.$transaction(async (tx) => {
    const day = dateFromStr(opts.date);
    const orders = await tx.order.findMany({
      where: {
        tenantId: opts.tenantId,
        status: { in: DISPATCHABLE_PAYMENT },
        routeId: null,
        fulfillmentStatus: { in: ["por_asignar", "programado", "no_entregado"] },
        OR: [{ deliveryDate: day }, { deliveryDate: null }],
      },
    });
    const bySector = new Map<string, typeof orders>();
    for (const o of orders) {
      const sector = o.deliveryZoneName || o.deliveryCommune || "Sin sector";
      bySector.set(sector, [...(bySector.get(sector) ?? []), o]);
    }
    const now = new Date();
    let routes = 0;
    for (const [sector, group] of bySector) {
      let route = await tx.deliveryRoute.findFirst({
        where: { tenantId: opts.tenantId, date: day, sector, status: { not: "completada" } },
      });
      if (!route) {
        const [, m, d] = opts.date.split("-");
        route = await tx.deliveryRoute.create({
          data: {
            tenantId: opts.tenantId,
            name: `${sector} · ${d}/${m}`,
            date: day,
            sector,
            slot: group[0]?.deliverySlot ?? null,
          },
        });
        routes++;
      }
      for (const o of group) {
        await tx.order.update({
          where: { id: o.id },
          data: {
            routeId: route.id,
            deliveryDate: day,
            fulfillmentStatus: "programado",
            scheduledAt: o.scheduledAt ?? now,
          },
        });
        await tx.orderEvent.create({
          data: {
            tenantId: opts.tenantId,
            orderId: o.id,
            type: "asignado",
            fromStatus: o.fulfillmentStatus,
            toStatus: "programado",
            note: `Agrupado automáticamente en ${route.name}`,
            actorEmail: opts.actorEmail,
          },
        });
      }
      await renumberRoute(tx, opts.tenantId, route.id);
    }
    return { orders: orders.length, routes };
  });
}

export async function markOrders(opts: {
  tenantId: string;
  actorEmail: string;
  orderIds: string[];
  status: "en_ruta" | "entregado" | "no_entregado";
  note?: string | null;
  bottlesReturned?: number | null;
}) {
  return prisma.$transaction(async (tx) => {
    const orders = await loadOrders(tx, opts.tenantId, opts.orderIds);
    const now = new Date();
    const touchedRoutes = new Set<string>();
    let changed = 0;

    for (const order of orders) {
      if (order.fulfillmentStatus === "entregado") continue;
      if (order.routeId) touchedRoutes.add(order.routeId);
      const data: Prisma.OrderUpdateInput = { fulfillmentStatus: opts.status };
      if (opts.note) {
        data.dispatchNotes = order.dispatchNotes
          ? `${order.dispatchNotes}\n${opts.note}`
          : opts.note;
      }
      if (!order.deliveryDate) data.deliveryDate = dateFromStr(todayCl());

      if (opts.status === "en_ruta") {
        data.outForDeliveryAt = now;
        if (!order.scheduledAt) data.scheduledAt = now;
      }

      if (opts.status === "entregado") {
        const customer = order.deliveryCustomerId
          ? await tx.deliveryCustomer.findFirst({
              where: { id: order.deliveryCustomerId, tenantId: opts.tenantId },
            })
          : await ensureDeliveryCustomer(tx, opts.tenantId, {
              name: order.customerName,
              phone: order.customerPhone,
              address: order.customerAddress,
              commune: order.deliveryCommune,
            });
        const delivered = bottlesForItems(order.items);
        const returned = Math.max(0, opts.bottlesReturned ?? 0);
        data.deliveredAt = now;
        data.bottlesDelivered = delivered;
        data.bottlesReturned = returned;
        if (!order.outForDeliveryAt) data.outForDeliveryAt = now;
        if (customer) {
          data.deliveryCustomer = { connect: { id: customer.id } };
          const movements: Prisma.BottleMovementCreateManyInput[] = [];
          if (delivered > 0) {
            movements.push({
              tenantId: opts.tenantId,
              customerId: customer.id,
              orderId: order.id,
              direction: "out",
              quantity: delivered,
              reason: "entrega",
              actorEmail: opts.actorEmail,
            });
          }
          if (returned > 0) {
            movements.push({
              tenantId: opts.tenantId,
              customerId: customer.id,
              orderId: order.id,
              direction: "in",
              quantity: returned,
              reason: "devolucion",
              actorEmail: opts.actorEmail,
            });
          }
          if (movements.length) await tx.bottleMovement.createMany({ data: movements });
          await tx.deliveryCustomer.update({
            where: { id: customer.id },
            data: {
              lastDeliveredAt: now,
              ...(customer.recurring
                ? { nextDeliveryDate: dateFromStr(addFrequency(todayCl(), customer.frequency)) }
                : {}),
            },
          });
        }
      }

      await tx.order.update({ where: { id: order.id }, data });
      await tx.orderEvent.create({
        data: {
          tenantId: opts.tenantId,
          orderId: order.id,
          type: opts.status,
          fromStatus: order.fulfillmentStatus,
          toStatus: opts.status,
          note:
            [
              opts.note,
              opts.status === "entregado" && opts.bottlesReturned
                ? `${opts.bottlesReturned} envases devueltos`
                : null,
            ]
              .filter(Boolean)
              .join(" · ") || null,
          actorEmail: opts.actorEmail,
        },
      });
      changed++;
    }

    for (const routeId of touchedRoutes) {
      const remaining = await tx.order.count({
        where: {
          tenantId: opts.tenantId,
          routeId,
          fulfillmentStatus: { notIn: ["entregado", "no_entregado"] },
        },
      });
      const status = remaining === 0 ? "completada" : opts.status === "en_ruta" ? "en_ruta" : undefined;
      if (status) {
        await tx.deliveryRoute.updateMany({
          where: { id: routeId, tenantId: opts.tenantId },
          data: { status },
        });
      }
    }
    return changed;
  });
}

export async function bottleBalances(tenantId: string) {
  const rows = await prisma.bottleMovement.groupBy({
    by: ["customerId", "direction"],
    where: { tenantId },
    _sum: { quantity: true },
  });
  const map = new Map<string, { out: number; in: number; balance: number }>();
  for (const r of rows) {
    const cur = map.get(r.customerId) ?? { out: 0, in: 0, balance: 0 };
    if (r.direction === "out") cur.out += r._sum.quantity ?? 0;
    else cur.in += r._sum.quantity ?? 0;
    cur.balance = cur.out - cur.in;
    map.set(r.customerId, cur);
  }
  return map;
}
