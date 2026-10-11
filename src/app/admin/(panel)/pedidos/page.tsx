import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";
import { FulfillmentBadge, PageHeader, PaymentBadge, btn, field } from "@/components/admin/dispatch-ui";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  FULFILLMENT_LABEL,
  FULFILLMENT_STATUSES,
  formatDateCl,
  formatDateTimeCl,
  shortRef,
  startOfDayCl,
  toDateStr,
} from "@/lib/dispatch";
import { ORDER_STATUS_LABEL } from "@/lib/order-status";
import { cn, formatClp } from "@/lib/utils";

const PAGE_SIZE = 50;
type SP = { q?: string; pago?: string; estado?: string; desde?: string; hasta?: string; p?: string };

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<SP> }) {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin/login");
  const sp = await searchParams;
  const tenantId = admin.tenantId;

  const q = sp.q?.trim().slice(0, 80) || undefined;
  const pago = sp.pago && sp.pago in ORDER_STATUS_LABEL ? sp.pago : undefined;
  const estado = FULFILLMENT_STATUSES.includes(sp.estado as never) ? sp.estado : undefined;
  const desde = /^\d{4}-\d{2}-\d{2}$/.test(sp.desde ?? "") ? sp.desde : undefined;
  const hasta = /^\d{4}-\d{2}-\d{2}$/.test(sp.hasta ?? "") ? sp.hasta : undefined;
  const page = Math.max(1, Number(sp.p) || 1);

  const where: Prisma.OrderWhereInput = {
    tenantId,
    ...(pago ? { status: pago } : {}),
    ...(estado ? { fulfillmentStatus: estado } : {}),
    ...(desde || hasta
      ? {
          createdAt: {
            ...(desde ? { gte: startOfDayCl(desde) } : {}),
            ...(hasta ? { lt: new Date(startOfDayCl(hasta).getTime() + 86_400_000) } : {}),
          },
        }
      : {}),
    ...(q
      ? {
          OR: [
            { customerName: { contains: q, mode: "insensitive" } },
            { customerPhone: { contains: q } },
            { customerAddress: { contains: q, mode: "insensitive" } },
            { deliveryCommune: { contains: q, mode: "insensitive" } },
            { buyOrder: { contains: q, mode: "insensitive" } },
            { id: { endsWith: q.toLowerCase() } },
          ],
        }
      : {}),
  };

  const [orders, total, counts] = await Promise.all([
    prisma.order.findMany({
      where,
      include: { items: { select: { quantity: true } } },
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
    }),
    prisma.order.count({ where }),
    prisma.order.groupBy({ by: ["status"], where: { tenantId }, _count: true }),
  ]);
  const countOf = (s: string) => counts.find((c) => c.status === s)?._count ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const qsFor = (patch: Partial<SP>) => {
    const p = new URLSearchParams();
    const merged = { ...sp, ...patch };
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, String(v));
    return `/admin/pedidos?${p}`;
  };

  const tabs = [
    { label: "Todos", value: undefined, n: counts.reduce((s, c) => s + c._count, 0) },
    { label: "Pagados", value: "paid", n: countOf("paid") },
    { label: "Pago pendiente", value: "pending", n: countOf("pending") },
    { label: "Fallidos", value: "failed", n: countOf("failed") },
    { label: "Cancelados", value: "cancelled", n: countOf("cancelled") },
  ];

  return (
    <div>
      <PageHeader title="Pedidos" subtitle="Pedidos de la tienda con estado de pago WebPay y de despacho." />

      <div className="mt-6 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <Link
            key={t.label}
            href={qsFor({ pago: t.value, p: undefined })}
            className={cn(
              "rounded-full px-3 py-1 text-sm font-medium ring-1 ring-inset",
              pago === t.value ? "bg-[var(--brand)] text-white ring-[var(--brand)]" : "bg-white text-[var(--brand-deep)] ring-[#d5e3ec] hover:ring-[var(--brand)]",
            )}
          >
            {t.label} <span className="opacity-70">{t.n}</span>
          </Link>
        ))}
      </div>

      <form method="get" className="mt-3 grid gap-2 rounded-xl border border-[#d5e3ec] bg-white p-3 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_auto]">
        {pago ? <input type="hidden" name="pago" value={pago} /> : null}
        <input name="q" defaultValue={q ?? ""} placeholder="Buscar cliente, teléfono, dirección, comuna o N° de pedido" className={field} />
        <select name="estado" defaultValue={estado ?? ""} className={field} aria-label="Estado de despacho">
          <option value="">Despacho: todos</option>
          {FULFILLMENT_STATUSES.map((s) => (
            <option key={s} value={s}>{FULFILLMENT_LABEL[s]}</option>
          ))}
        </select>
        <input type="date" name="desde" defaultValue={desde ?? ""} className={field} aria-label="Desde" />
        <input type="date" name="hasta" defaultValue={hasta ?? ""} className={field} aria-label="Hasta" />
        <div className="flex gap-2">
          <button type="submit" className={btn.primary}>Filtrar</button>
          <Link href="/admin/pedidos" className={btn.outline}>Limpiar</Link>
        </div>
      </form>

      {orders.length === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed border-[#d5e3ec] bg-white px-6 py-12 text-center text-[#5a6578]">
          {total === 0 && !q && !pago && !estado ? "Aún no hay pedidos. Probá el flujo tienda → carrito → checkout → WebPay." : "Sin resultados para estos filtros."}
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-xl border border-[#d5e3ec] bg-white">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-[#e8f0f5] bg-[#fbfdfe] text-left text-[11px] uppercase tracking-wide text-[#5a6578]">
                <th className="px-4 py-2.5">Pedido</th>
                <th className="px-2 py-2.5">Cliente</th>
                <th className="px-2 py-2.5">Entrega</th>
                <th className="px-2 py-2.5 text-right">Total</th>
                <th className="px-2 py-2.5">Pago</th>
                <th className="px-2 py-2.5">Despacho</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eef3f7]">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-[#fafdfe]">
                  <td className="px-4 py-2.5">
                    <p className="font-mono text-xs font-semibold text-[var(--brand-deep)]">#{shortRef(o.id)}</p>
                    <p className="text-xs text-[#5a6578]">{formatDateTimeCl(o.createdAt)}</p>
                  </td>
                  <td className="px-2 py-2.5">
                    <p className="font-medium text-[var(--brand-deep)]">{o.customerName}</p>
                    <p className="text-xs text-[#5a6578]">{o.customerPhone}</p>
                  </td>
                  <td className="px-2 py-2.5">
                    <p className="max-w-[220px] truncate">{o.customerAddress}</p>
                    <p className="text-xs text-[#5a6578]">
                      {o.deliveryCommune ?? o.deliveryZoneName ?? "—"} · {formatDateCl(toDateStr(o.deliveryDate))}
                    </p>
                  </td>
                  <td className="px-2 py-2.5 text-right tabular-nums">
                    {formatClp(o.totalClp)}
                    <p className="text-xs text-[#5a6578]">{o.items.reduce((s, i) => s + i.quantity, 0)} uds.</p>
                  </td>
                  <td className="px-2 py-2.5">
                    <PaymentBadge status={o.status} provider={o.paymentProvider} />
                    {o.webpayStatus ? <p className="mt-0.5 text-[11px] text-[#8a95a6]">{o.webpayStatus}</p> : null}
                  </td>
                  <td className="px-2 py-2.5">
                    <FulfillmentBadge status={o.fulfillmentStatus} />
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <Link href={`/admin/pedidos/${o.id}`} className="text-sm font-medium text-[var(--brand)] hover:underline">
                      Ver
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pages > 1 ? (
        <nav className="mt-4 flex items-center justify-between text-sm text-[#5a6578]">
          <span>
            {total} pedidos · página {page} de {pages}
          </span>
          <span className="flex gap-2">
            {page > 1 ? <Link href={qsFor({ p: String(page - 1) })} className={btn.outline}>Anterior</Link> : null}
            {page < pages ? <Link href={qsFor({ p: String(page + 1) })} className={btn.outline}>Siguiente</Link> : null}
          </span>
        </nav>
      ) : null}
    </div>
  );
}
