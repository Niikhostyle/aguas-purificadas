import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

const TZ = "America/Santiago";
const dayFmt = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" });
const labelFmt = new Intl.DateTimeFormat("es-CL", { timeZone: TZ, day: "2-digit", month: "short" });

function dayKey(d: Date) {
  return dayFmt.format(d);
}

export type PeriodTuple = [number, number, number, number, number];

export type OrderPeriodStats = {
  orders: PeriodTuple;
  revenue: PeriodTuple;
  daily: { key: string; label: string; orders: number; revenue: number }[];
};

/** Orders and paid revenue bucketed by Chile-local day/month. `where` must carry the tenant scope. */
export async function orderPeriodStats(where: Prisma.OrderWhereInput, days = 14): Promise<OrderPeriodStats> {
  const now = new Date();
  const since = new Date(now.getTime() - 70 * 86_400_000);
  const [recent, totalCount, totalPaid] = await Promise.all([
    prisma.order.findMany({
      where: { ...where, createdAt: { gte: since } },
      select: { createdAt: true, totalClp: true, status: true },
    }),
    prisma.order.count({ where }),
    prisma.order.aggregate({ where: { ...where, status: "paid" }, _sum: { totalClp: true } }),
  ]);

  const today = dayKey(now);
  const yesterday = dayKey(new Date(now.getTime() - 86_400_000));
  const month = today.slice(0, 7);
  const [y, m] = month.split("-").map(Number);
  const lastMonth = m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, "0")}`;

  const orders: PeriodTuple = [0, 0, 0, 0, totalCount];
  const revenue: PeriodTuple = [0, 0, 0, 0, totalPaid._sum.totalClp ?? 0];
  const byDay = new Map<string, { orders: number; revenue: number }>();

  for (const o of recent) {
    const k = dayKey(o.createdAt);
    const paid = o.status === "paid" ? o.totalClp : 0;
    const slots = [k === today, k === yesterday, k.startsWith(month), k.startsWith(lastMonth)];
    slots.forEach((hit, i) => {
      if (hit) {
        orders[i] += 1;
        revenue[i] += paid;
      }
    });
    const b = byDay.get(k) ?? { orders: 0, revenue: 0 };
    b.orders += 1;
    b.revenue += paid;
    byDay.set(k, b);
  }

  const daily = Array.from({ length: days }, (_, i) => {
    const d = new Date(now.getTime() - (days - 1 - i) * 86_400_000);
    const k = dayKey(d);
    const b = byDay.get(k) ?? { orders: 0, revenue: 0 };
    return { key: k, label: labelFmt.format(d).replace(".", ""), ...b };
  });

  return { orders, revenue, daily };
}
