import { prisma } from "@/lib/db";
import { addDaysStr, isReturnableItem, startOfDayCl, todayCl } from "@/lib/dispatch";
import { bottleBalances } from "@/lib/dispatch-server";

const DISPENSER_RE = /dispensador|surtidor/i;

/** Liters per unit from names like "Botellón 20 Lts" / "Bidón 12 L"; 0 when unknown. */
export function litersFromName(name: string): number {
  const m = name.match(/(\d+(?:[.,]\d+)?)\s*(?:l|lt|lts|litros?)\b/i);
  return m ? Number(m[1].replace(",", ".")) : 0;
}

export type StockLine = { id: string; name: string; stock: number };

export type InventorySnapshot = {
  /** Returnable full jugs with tracked stock (null = nothing tracked). */
  full: { total: number; lines: StockLine[] } | null;
  dispensers: { total: number; lines: StockLine[] } | null;
  /** Returnable jugs still to deliver today. */
  demandToday: number;
  envases: { inStreet: number; owing: number; out30: number; in30: number; returnRate: number; receivedToday: number } | null;
};

export async function getInventorySnapshot(
  tenantId: string,
  opts: { envases: boolean; demandToday: number },
): Promise<InventorySnapshot> {
  const today = todayCl();
  const [products, balances, last30, inToday] = await Promise.all([
    prisma.product.findMany({
      where: { tenantId, active: true, stock: { not: null } },
      select: { id: true, name: true, stock: true },
      orderBy: { sortOrder: "asc" },
    }),
    opts.envases ? bottleBalances(tenantId) : null,
    opts.envases
      ? prisma.bottleMovement.groupBy({
          by: ["direction"],
          where: { tenantId, createdAt: { gte: startOfDayCl(addDaysStr(today, -30)) } },
          _sum: { quantity: true },
        })
      : null,
    opts.envases
      ? prisma.bottleMovement.aggregate({
          where: { tenantId, direction: "in", createdAt: { gte: startOfDayCl(today) } },
          _sum: { quantity: true },
        })
      : null,
  ]);

  const fullLines: StockLine[] = [];
  const dispenserLines: StockLine[] = [];
  for (const p of products) {
    const line = { id: p.id, name: p.name, stock: Math.max(0, p.stock ?? 0) };
    if (isReturnableItem(p.name)) fullLines.push(line);
    else if (DISPENSER_RE.test(p.name)) dispenserLines.push(line);
  }
  const sum = (l: StockLine[]) => l.reduce((s, x) => s + x.stock, 0);

  let envases: InventorySnapshot["envases"] = null;
  if (balances && last30) {
    let inStreet = 0;
    let owing = 0;
    for (const b of balances.values()) {
      if (b.balance > 0) {
        inStreet += b.balance;
        owing++;
      }
    }
    const out30 = last30.find((r) => r.direction === "out")?._sum.quantity ?? 0;
    const in30 = last30.find((r) => r.direction === "in")?._sum.quantity ?? 0;
    if (inStreet || out30 || in30) {
      envases = {
        inStreet,
        owing,
        out30,
        in30,
        returnRate: out30 ? Math.min(100, Math.round((in30 / out30) * 100)) : 0,
        receivedToday: inToday?._sum.quantity ?? 0,
      };
    }
  }

  return {
    full: fullLines.length ? { total: sum(fullLines), lines: fullLines } : null,
    dispensers: dispenserLines.length ? { total: sum(dispenserLines), lines: dispenserLines } : null,
    demandToday: opts.demandToday,
    envases,
  };
}
