import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";
import { ChevronRight, ClipboardList, SearchX, Store } from "lucide-react";
import { FulfillmentBadge, PageHeader, PaymentBadge, btn, field } from "@/components/admin/dispatch-ui";
import { DataTable, EmptyState, Pagination, paginate, parseSort } from "@/components/admin/ui";
import { MobileCollapse } from "@/components/admin/ui/mobile-collapse";
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

const PAGE_SIZE = 25;
const SORTS = ["fecha", "total", "cliente", "entrega"] as const;
type SP = { q?: string; pago?: string; estado?: string; desde?: string; hasta?: string; page?: string; orden?: string };

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
  const sort = parseSort(sp.orden, SORTS, "-fecha");

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

  const orderBy: Prisma.OrderOrderByWithRelationInput[] =
    sort.by === "total"
      ? [{ totalClp: sort.dir }, { createdAt: "desc" }]
      : sort.by === "cliente"
        ? [{ customerName: sort.dir }, { createdAt: "desc" }]
        : sort.by === "entrega"
          ? [{ deliveryDate: { sort: sort.dir, nulls: "last" } }, { createdAt: "desc" }]
          : [{ createdAt: sort.dir }];

  const [total, counts] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.groupBy({ by: ["status"], where: { tenantId }, _count: true }),
  ]);
  const { page, pages, skip, take } = paginate(sp.page, total, PAGE_SIZE);
  const orders = await prisma.order.findMany({
    where,
    include: { items: { select: { quantity: true } } },
    orderBy,
    take,
    skip,
  });
  const countOf = (s: string) => counts.find((c) => c.status === s)?._count ?? 0;

  const params = { q, pago, estado, desde, hasta, orden: sp.orden };
  const qsFor = (patch: Partial<SP>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...params, ...patch })) if (v) p.set(k, String(v));
    const s = p.toString();
    return s ? `/admin/pedidos?${s}` : "/admin/pedidos";
  };

  const tabs = [
    { label: "Todos", value: undefined, n: counts.reduce((s, c) => s + c._count, 0) },
    { label: "Pagados", value: "paid", n: countOf("paid") },
    { label: "Pago pendiente", value: "pending", n: countOf("pending") },
    { label: "Fallidos", value: "failed", n: countOf("failed") },
    { label: "Cancelados", value: "cancelled", n: countOf("cancelled") },
  ];
  const filtered = Boolean(q || pago || estado || desde || hasta);

  return (
    <div>
      <PageHeader title="Pedidos" subtitle="Pedidos de la tienda con estado de pago WebPay y de despacho." />

      <nav aria-label="Filtrar por estado de pago" className="mt-6 -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {tabs.map((t) => {
          const active = pago === t.value;
          return (
            <Link
              key={t.label}
              href={qsFor({ pago: t.value, page: undefined })}
              aria-current={active ? "page" : undefined}
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ring-1 ring-inset transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand)]",
                active
                  ? "bg-[var(--brand)] text-white ring-[var(--brand)]"
                  : "bg-white text-[var(--brand-deep)] ring-[#d5e3ec] hover:ring-[var(--brand)]",
              )}
            >
              {t.label}
              <span
                className={cn(
                  "rounded-full px-1.5 text-xs tabular-nums",
                  active ? "bg-white/20" : "bg-[#eef3f7] text-[#5a6578]",
                )}
              >
                {t.n}
              </span>
            </Link>
          );
        })}
      </nav>

      <form
        method="get"
        role="search"
        className="mt-3 grid gap-3 rounded-xl border border-[#d5e3ec] bg-white p-3 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_auto] lg:items-end"
      >
        {pago ? <input type="hidden" name="pago" value={pago} /> : null}
        {sp.orden ? <input type="hidden" name="orden" value={sp.orden} /> : null}
        <label className="text-xs font-medium text-[#5a6578]">
          Buscar
          <input
            name="q"
            type="search"
            defaultValue={q ?? ""}
            placeholder="Cliente, teléfono, dirección, comuna o N° de pedido"
            className={cn(field, "mt-1 w-full")}
          />
        </label>
        <MobileCollapse activeCount={[estado, desde, hasta].filter(Boolean).length}>
          <label className="text-xs font-medium text-[#5a6578]">
            Despacho
            <select name="estado" defaultValue={estado ?? ""} className={cn(field, "mt-1 w-full")}>
              <option value="">Todos</option>
              {FULFILLMENT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {FULFILLMENT_LABEL[s]}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-medium text-[#5a6578]">
            Desde
            <input type="date" name="desde" defaultValue={desde ?? ""} max={hasta} className={cn(field, "mt-1 w-full")} />
          </label>
          <label className="text-xs font-medium text-[#5a6578]">
            Hasta
            <input type="date" name="hasta" defaultValue={hasta ?? ""} min={desde} className={cn(field, "mt-1 w-full")} />
          </label>
        </MobileCollapse>
        <div className="flex gap-2">
          <button type="submit" className={cn(btn.primary, "flex-1 lg:flex-none")}>
            Filtrar
          </button>
          {filtered ? (
            <Link href="/admin/pedidos" className={btn.outline}>
              Limpiar
            </Link>
          ) : null}
        </div>
      </form>

      <div className="mt-4 overflow-hidden rounded-xl border border-[#d5e3ec] bg-white">
        <DataTable
          caption="Pedidos"
          rows={orders}
          rowKey={(o) => o.id}
          minWidth={820}
          mobileCards
          sort={{ ...sort, basePath: "/admin/pedidos", params }}
          empty={
            filtered ? (
              <EmptyState
                icon={<SearchX />}
                title="Sin resultados para estos filtros"
                description="Prueba con otra búsqueda o amplía el rango de fechas."
                action={
                  <Link href="/admin/pedidos" className={btn.outline}>
                    Limpiar filtros
                  </Link>
                }
              />
            ) : (
              <EmptyState
                icon={<ClipboardList />}
                title="Aún no hay pedidos"
                description="Prueba el flujo tienda → carrito → checkout → WebPay; los pedidos aparecerán aquí al instante."
                action={
                  <Link href="/" target="_blank" className={btn.primary}>
                    <Store className="size-4" /> Abrir la tienda
                  </Link>
                }
              />
            )
          }
          columns={[
            {
              key: "ref",
              header: "Pedido",
              sortKey: "fecha",
              mobile: "hidden",
              cell: (o) => (
                <>
                  <Link
                    href={`/admin/pedidos/${o.id}`}
                    className="font-mono text-xs font-semibold text-[var(--brand-deep)] hover:text-[var(--brand)]"
                  >
                    #{shortRef(o.id)}
                  </Link>
                  <p className="text-xs text-[#5a6578]">{formatDateTimeCl(o.createdAt)}</p>
                </>
              ),
            },
            {
              key: "customer",
              header: "Cliente",
              sortKey: "cliente",
              mobile: "title",
              cell: (o) => (
                <Link href={`/admin/pedidos/${o.id}`} className="group flex items-center justify-between gap-2">
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-[var(--brand-deep)] group-hover:text-[var(--brand)]">
                      {o.customerName}
                    </span>
                    <span className="block text-xs text-[#5a6578]">
                      {o.customerPhone}
                      <span className="md:hidden">
                        {" "}
                        · #{shortRef(o.id)} · {formatDateTimeCl(o.createdAt)}
                      </span>
                    </span>
                  </span>
                  <ChevronRight aria-hidden className="size-4 shrink-0 text-[#a9b6c4] md:hidden" />
                </Link>
              ),
            },
            {
              key: "delivery",
              header: "Entrega",
              sortKey: "entrega",
              cell: (o) => (
                <>
                  <p className="max-w-[240px] truncate">{o.customerAddress}</p>
                  <p className="text-xs text-[#5a6578]">
                    {o.deliveryCommune ?? o.deliveryZoneName ?? "—"} · {formatDateCl(toDateStr(o.deliveryDate))}
                  </p>
                </>
              ),
            },
            {
              key: "total",
              header: "Total",
              sortKey: "total",
              align: "right",
              cell: (o) => (
                <>
                  <span className="font-medium tabular-nums">{formatClp(o.totalClp)}</span>
                  <p className="text-xs text-[#5a6578]">{o.items.reduce((s, i) => s + i.quantity, 0)} uds.</p>
                </>
              ),
            },
            {
              key: "payment",
              header: "Pago",
              cell: (o) => (
                <>
                  <PaymentBadge status={o.status} provider={o.paymentProvider} />
                  {o.webpayStatus ? <p className="mt-0.5 text-[11px] text-[#8a95a6]">{o.webpayStatus}</p> : null}
                </>
              ),
            },
            {
              key: "fulfillment",
              header: "Despacho",
              cell: (o) => <FulfillmentBadge status={o.fulfillmentStatus} />,
            },
            {
              key: "open",
              header: <span className="sr-only">Abrir</span>,
              align: "right",
              mobile: "hidden",
              cell: (o) => (
                <Link
                  href={`/admin/pedidos/${o.id}`}
                  aria-label={`Ver pedido ${shortRef(o.id)} de ${o.customerName}`}
                  className="text-sm font-medium text-[var(--brand)] hover:underline"
                >
                  Ver
                </Link>
              ),
            },
          ]}
        />
        {total > 0 ? (
          <div className="border-t border-[#e8f0f5] bg-[#fafcfd] px-4 py-3">
            <Pagination
              page={page}
              pages={pages}
              total={total}
              pageSize={PAGE_SIZE}
              basePath="/admin/pedidos"
              params={params}
              noun="pedidos"
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
