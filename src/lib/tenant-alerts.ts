import { prisma } from "@/lib/db";
import { DISPATCHABLE_PAYMENT, todayCl, dateFromStr } from "@/lib/dispatch";
import { bottleBalances } from "@/lib/dispatch-server";
import type { ModuleFlags } from "@/lib/modules";

const DAY = 24 * 60 * 60 * 1000;
/** A customer with no recurrence counts as "sin compra" after this many days. */
export const NO_PURCHASE_DAYS = 30;
/** Expected days between purchases per recurrence, before the grace period. */
const FREQUENCY_DAYS: Record<string, number> = { semanal: 7, quincenal: 15, mensual: 30 };
const NO_PURCHASE_GRACE_DAYS = 5;
/** Returnable bottles out longer than this are flagged. */
export const BOTTLES_STALE_DAYS = 14;
export const BOTTLES_HIGH_BALANCE = 4;
/** Paid or COD orders waiting for a route longer than this are flagged. */
const UNASSIGNED_HOURS = 24;
export const LOW_STOCK = 5;
const LIST_LIMIT = 50;

export type AlertCustomer = {
  id: string;
  name: string;
  phone: string;
  commune: string | null;
  lastDeliveredAt: Date | null;
};

export type TenantAlerts = {
  /** Delivered orders still marked as unpaid (cash on delivery not collected). */
  debtors: {
    id: string;
    customerName: string;
    customerPhone: string;
    totalClp: number;
    deliveredAt: Date | null;
  }[];
  debtTotalClp: number;
  noPurchase: (AlertCustomer & { daysSince: number; expectedDays: number })[];
  bottles: (AlertCustomer & { balance: number; daysSince: number | null })[];
  overdueRefills: (AlertCustomer & { nextDeliveryDate: Date })[];
  failedDeliveries: { id: string; customerName: string; customerPhone: string; customerAddress: string; updatedAt: Date }[];
  unassigned: { id: string; customerName: string; customerAddress: string; createdAt: Date }[];
  lowStock: { id: string; name: string; stock: number }[];
};

export function alertCount(a: TenantAlerts): number {
  return (
    a.debtors.length +
    a.noPurchase.length +
    a.bottles.length +
    a.overdueRefills.length +
    a.failedDeliveries.length +
    a.unassigned.length +
    a.lowStock.length
  );
}

const CUSTOMER_SELECT = { id: true, name: true, phone: true, commune: true, lastDeliveredAt: true } as const;

export async function getTenantAlerts(tenantId: string, flags: ModuleFlags): Promise<TenantAlerts> {
  const now = Date.now();
  const today = dateFromStr(todayCl());

  const [debtors, customers, openOrderCustomers, failedDeliveries, unassigned, lowStock, balances] = await Promise.all([
    prisma.order.findMany({
      where: { tenantId, status: "pending", fulfillmentStatus: "entregado" },
      select: { id: true, customerName: true, customerPhone: true, totalClp: true, deliveredAt: true },
      orderBy: { deliveredAt: "asc" },
      take: 200,
    }),
    prisma.deliveryCustomer.findMany({
      where: { tenantId, lastDeliveredAt: { not: null } },
      select: { ...CUSTOMER_SELECT, recurring: true, frequency: true, nextDeliveryDate: true },
    }),
    prisma.order.findMany({
      where: {
        tenantId,
        deliveryCustomerId: { not: null },
        status: { in: DISPATCHABLE_PAYMENT },
        fulfillmentStatus: { in: ["por_asignar", "programado", "en_ruta"] },
      },
      select: { deliveryCustomerId: true },
      distinct: ["deliveryCustomerId"],
    }),
    flags.despacho
      ? prisma.order.findMany({
          where: { tenantId, status: { in: DISPATCHABLE_PAYMENT }, fulfillmentStatus: "no_entregado" },
          select: { id: true, customerName: true, customerPhone: true, customerAddress: true, updatedAt: true },
          orderBy: { updatedAt: "desc" },
          take: LIST_LIMIT,
        })
      : [],
    flags.despacho
      ? prisma.order.findMany({
          where: {
            tenantId,
            status: { in: DISPATCHABLE_PAYMENT },
            fulfillmentStatus: "por_asignar",
            createdAt: { lt: new Date(now - UNASSIGNED_HOURS * 60 * 60 * 1000) },
          },
          select: { id: true, customerName: true, customerAddress: true, createdAt: true },
          orderBy: { createdAt: "asc" },
          take: LIST_LIMIT,
        })
      : [],
    prisma.product.findMany({
      where: { tenantId, active: true, stock: { not: null, lte: LOW_STOCK } },
      select: { id: true, name: true, stock: true },
      orderBy: { stock: "asc" },
      take: LIST_LIMIT,
    }),
    flags.envases ? bottleBalances(tenantId) : Promise.resolve(new Map<string, { balance: number }>()),
  ]);

  const hasOpenOrder = new Set(openOrderCustomers.map((o) => o.deliveryCustomerId));
  const daysSince = (d: Date | null) => (d ? Math.floor((now - d.getTime()) / DAY) : null);

  const overdueRefills = flags.recordatorios
    ? customers
        .filter((c) => c.recurring && c.nextDeliveryDate && c.nextDeliveryDate < today && !hasOpenOrder.has(c.id))
        .map((c) => ({ ...pick(c), nextDeliveryDate: c.nextDeliveryDate! }))
        .sort((a, b) => a.nextDeliveryDate.getTime() - b.nextDeliveryDate.getTime())
        .slice(0, LIST_LIMIT)
    : [];
  const refillIds = new Set(overdueRefills.map((c) => c.id));

  const noPurchase = customers
    .filter((c) => !hasOpenOrder.has(c.id) && !refillIds.has(c.id))
    .map((c) => {
      const expectedDays =
        c.recurring && c.frequency && FREQUENCY_DAYS[c.frequency]
          ? FREQUENCY_DAYS[c.frequency] + NO_PURCHASE_GRACE_DAYS
          : NO_PURCHASE_DAYS;
      return { ...pick(c), daysSince: daysSince(c.lastDeliveredAt) ?? 0, expectedDays };
    })
    .filter((c) => c.daysSince >= c.expectedDays)
    .sort((a, b) => b.daysSince - a.daysSince)
    .slice(0, LIST_LIMIT);

  const bottles = flags.envases
    ? customers
        .map((c) => ({ ...pick(c), balance: balances.get(c.id)?.balance ?? 0, daysSince: daysSince(c.lastDeliveredAt) }))
        .filter(
          (c) => c.balance > 0 && (c.balance >= BOTTLES_HIGH_BALANCE || (c.daysSince ?? 0) >= BOTTLES_STALE_DAYS),
        )
        .sort((a, b) => b.balance - a.balance)
        .slice(0, LIST_LIMIT)
    : [];

  return {
    debtors: debtors.slice(0, LIST_LIMIT),
    debtTotalClp: debtors.reduce((s, o) => s + o.totalClp, 0),
    noPurchase,
    bottles,
    overdueRefills,
    failedDeliveries,
    unassigned,
    lowStock: lowStock.map((p) => ({ id: p.id, name: p.name, stock: p.stock ?? 0 })),
  };
}

function pick(c: AlertCustomer): AlertCustomer {
  return { id: c.id, name: c.name, phone: c.phone, commune: c.commune, lastDeliveredAt: c.lastDeliveredAt };
}
