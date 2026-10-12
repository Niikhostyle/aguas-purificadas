import Link from "next/link";
import {
  ArrowRight,
  BellRing,
  CalendarClock,
  ClipboardList,
  CreditCard,
  Package,
  PackageCheck,
  Route as RouteIcon,
  ShoppingCart,
  Truck,
  Wallet,
} from "lucide-react";
import { redirect } from "next/navigation";
import { FulfillmentBadge, PageHeader, PaymentBadge, StatCard, btn } from "@/components/admin/dispatch-ui";
import { EmptyState, Panel, StatsTable } from "@/components/admin/ui";
import { LazySalesChart } from "@/components/admin/ui/sales-chart-lazy";
import { orderPeriodStats } from "@/lib/admin-stats";
import { isSuperAdmin, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  DISPATCHABLE_PAYMENT,
  addDaysStr,
  dateFromStr,
  formatDateCl,
  formatDateTimeCl,
  shortRef,
  startOfDayCl,
} from "@/lib/dispatch";
import { getDispatchStats } from "@/lib/dispatch-queries";
import { bottleBalances } from "@/lib/dispatch-server";
import { parseModuleFlags } from "@/lib/modules";
import { formatClp } from "@/lib/utils";

export default async function AdminHomePage() {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin/login");
  if (isSuperAdmin(admin)) redirect("/admin/plataforma");
  const tenantId = admin.tenantId;
  const flags = parseModuleFlags(admin.tenant.modulesEnabled);

  const [stats, period] = await Promise.all([getDispatchStats(tenantId), orderPeriodStats({ tenantId })]);
  const today = stats.today;
  const dayStart = startOfDayCl(today);
  const yesterdayStart = startOfDayCl(addDaysStr(today, -1));
  const weekStart = startOfDayCl(addDaysStr(today, -6));
  const prevWeekStart = startOfDayCl(addDaysStr(today, -13));

  const [
    salesToday,
    salesYesterday,
    salesWeek,
    salesPrevWeek,
    deliveredYesterday,
    pendingPayment,
    dueSoon,
    balances,
    routes,
    recent,
    productCount,
  ] = await Promise.all([
      prisma.order.aggregate({
        where: { tenantId, status: "paid", paidAt: { gte: dayStart } },
        _sum: { totalClp: true },
        _count: true,
      }),
      prisma.order.aggregate({
        where: { tenantId, status: "paid", paidAt: { gte: yesterdayStart, lt: dayStart } },
        _sum: { totalClp: true },
      }),
      prisma.order.aggregate({
        where: { tenantId, status: "paid", paidAt: { gte: weekStart } },
        _sum: { totalClp: true },
        _count: true,
      }),
      prisma.order.aggregate({
        where: { tenantId, status: "paid", paidAt: { gte: prevWeekStart, lt: weekStart } },
        _sum: { totalClp: true },
      }),
      prisma.order.count({
        where: {
          tenantId,
          status: { in: DISPATCHABLE_PAYMENT },
          fulfillmentStatus: "entregado",
          deliveredAt: { gte: yesterdayStart, lt: dayStart },
        },
      }),
      prisma.order.count({ where: { tenantId, status: "pending" } }),
      prisma.deliveryCustomer.count({
        where: { tenantId, recurring: true, nextDeliveryDate: { lte: dateFromStr(addDaysStr(today, 3)) } },
      }),
      bottleBalances(tenantId),
      prisma.deliveryRoute.findMany({
        where: { tenantId, date: dateFromStr(today) },
        include: { orders: { select: { fulfillmentStatus: true } } },
        orderBy: { name: "asc" },
      }),
      prisma.order.findMany({
        where: { tenantId },
        orderBy: { createdAt: "desc" },
        take: 6,
      }),
      prisma.product.count({ where: { tenantId, active: true } }),
    ]);

  let inStreet = 0;
  let owing = 0;
  for (const b of balances.values()) {
    if (b.balance > 0) {
      inStreet += b.balance;
      owing++;
    }
  }

  const modules = [
    { show: true, href: "/admin/pedidos", title: "Pedidos + WebPay", body: `${pendingPayment} con pago pendiente · filtros y búsqueda`, icon: CreditCard },
    { show: flags.despacho, href: "/admin/despacho", title: "Ruta de despacho", body: "Agrupa por sector y día, hoja de ruta y vista chofer", icon: RouteIcon },
    { show: flags.recordatorios, href: "/admin/recordatorios", title: "Recordatorios", body: `${dueSoon} clientes próximos a reponer`, icon: BellRing },
    { show: flags.envases, href: "/admin/envases", title: "Envases retornables", body: `${inStreet} bidones en la calle · ${owing} clientes`, icon: Package },
  ].filter((m) => m.show);

  return (
    <div>
      <PageHeader title="Dashboard" subtitle={`${admin.tenant.name} · ${formatDateCl(today, "long")}`}>
        {flags.despacho ? (
          <Link href="/admin/despacho" className={btn.primary}>
            <Truck className="size-4" /> Ir a despacho
          </Link>
        ) : null}
        <Link href="/" className={btn.outline}>
          Ver tienda
        </Link>
      </PageHeader>

      <section className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Ventas hoy"
          value={formatClp(salesToday._sum.totalClp ?? 0)}
          hint={`${salesToday._count} pagos WebPay`}
          icon={Wallet}
          tone="emerald"
          href="/admin/pedidos?pago=paid"
          trend={{ current: salesToday._sum.totalClp ?? 0, previous: salesYesterday._sum.totalClp ?? 0, label: "vs ayer" }}
        />
        <StatCard
          label="Ventas 7 días"
          value={formatClp(salesWeek._sum.totalClp ?? 0)}
          hint={`${salesWeek._count} pedidos pagados`}
          icon={CreditCard}
          tone="navy"
          href="/admin/pedidos?pago=paid"
          trend={{ current: salesWeek._sum.totalClp ?? 0, previous: salesPrevWeek._sum.totalClp ?? 0, label: "vs 7 días previos" }}
        />
        <StatCard
          label="Pedidos hoy"
          value={stats.hoy}
          hint={`${stats.creadosHoy} ingresados hoy`}
          icon={ClipboardList}
          tone="brand"
          href="/admin/despacho"
          trend={{ current: period.orders[0], previous: period.orders[1], label: "ingresos vs ayer" }}
        />
        <StatCard label="Pendientes despacho" value={stats.pendientes} hint="Por asignar o programados" icon={CalendarClock} tone="amber" href="/admin/despacho?fecha=todas&estado=por_asignar" />
        <StatCard label="En ruta" value={stats.enRuta} hint="Con el chofer ahora" icon={Truck} tone="sky" href="/admin/despacho?fecha=todas&estado=en_ruta" />
        <StatCard
          label="Entregados hoy"
          value={stats.entregadosHoy}
          icon={PackageCheck}
          tone="emerald"
          href={`/admin/despacho?fecha=${today}&estado=entregado`}
          trend={{ current: stats.entregadosHoy, previous: deliveredYesterday, label: "vs ayer" }}
        />
        {flags.recordatorios ? (
          <StatCard label="Próximos a reponer" value={dueSoon} hint="Recurrentes · 3 días" icon={BellRing} tone="rose" href="/admin/recordatorios" />
        ) : null}
        {flags.envases ? (
          <StatCard label="Envases en la calle" value={inStreet} hint={`${owing} clientes con saldo`} icon={Package} tone="navy" href="/admin/envases" />
        ) : null}
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Panel title="Estadísticas" description="Pedidos y ventas pagadas, horario de Chile." flush>
          <StatsTable
            caption="Estadísticas por período"
            rows={[
              { label: "Ventas pagadas", values: period.revenue.map((v) => formatClp(v)) },
              { label: "Pedidos", values: period.orders.map((v) => v.toLocaleString("es-CL")) },
            ]}
          />
        </Panel>
        <Panel title="Ventas · últimos 14 días" description="Pasa el cursor o toca una barra para ver el detalle.">
          <LazySalesChart data={period.daily} />
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <section className="rounded-xl border border-[#d5e3ec] bg-white">
          <header className="flex items-center justify-between border-b border-[#e8f0f5] px-4 py-3">
            <h2 className="font-semibold text-[var(--brand-deep)]">Últimos pedidos</h2>
            <Link href="/admin/pedidos" className="text-sm text-[var(--brand)] hover:underline">
              Ver todos
            </Link>
          </header>
          <ul className="divide-y divide-[#eef3f7]">
            {recent.map((o) => (
              <li key={o.id}>
                <Link href={`/admin/pedidos/${o.id}`} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 hover:bg-[#fafdfe]">
                  <span className="min-w-0">
                    <span className="font-medium text-[var(--brand-deep)]">{o.customerName}</span>{" "}
                    <span className="font-mono text-[11px] text-[#8a95a6]">#{shortRef(o.id)}</span>
                    <span className="block text-xs text-[#5a6578]">
                      {formatDateTimeCl(o.createdAt)} · {formatClp(o.totalClp)}
                    </span>
                  </span>
                  <span className="flex gap-1.5">
                    <PaymentBadge status={o.status} />
                    <FulfillmentBadge status={o.fulfillmentStatus} />
                  </span>
                </Link>
              </li>
            ))}
            {recent.length === 0 ? (
              <li>
                <EmptyState
                  compact
                  icon={<ShoppingCart />}
                  title="Aún no hay pedidos"
                  description="Cuando tus clientes compren en la tienda, aparecerán aquí."
                  action={
                    <Link href="/" target="_blank" className={btn.outline}>
                      Ver tienda
                    </Link>
                  }
                />
              </li>
            ) : null}
          </ul>
        </section>

        <section className="rounded-xl border border-[#d5e3ec] bg-white">
          <header className="flex items-center justify-between border-b border-[#e8f0f5] px-4 py-3">
            <h2 className="font-semibold text-[var(--brand-deep)]">Rutas de hoy</h2>
            {flags.despacho ? (
              <Link href="/admin/despacho" className="text-sm text-[var(--brand)] hover:underline">
                Planificar
              </Link>
            ) : null}
          </header>
          <ul className="divide-y divide-[#eef3f7]">
            {routes.map((r) => {
              const done = r.orders.filter((o) => o.fulfillmentStatus === "entregado").length;
              const pct = r.orders.length ? Math.round((done / r.orders.length) * 100) : 0;
              return (
                <li key={r.id} className="px-4 py-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-[var(--brand-deep)]">{r.name}</span>
                    <span className="text-xs text-[#5a6578]">
                      {done}/{r.orders.length} · {r.driverName ?? "sin chofer"}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#e8f0f5]">
                    <div className="h-full rounded-full bg-[var(--brand)]" style={{ width: `${pct}%` }} />
                  </div>
                </li>
              );
            })}
            {routes.length === 0 ? (
              <li>
                <EmptyState
                  compact
                  icon={<RouteIcon />}
                  title="Sin rutas para hoy"
                  description="Agrupa los pedidos del día por sector en un clic."
                  action={
                    flags.despacho ? (
                      <Link href={`/admin/despacho?fecha=${today}`} className={btn.primary}>
                        Planificar rutas
                      </Link>
                    ) : undefined
                  }
                />
              </li>
            ) : null}
          </ul>
        </section>
      </div>

      <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {modules.map((m) => (
          <Link
            key={m.href}
            href={m.href}
            className="group rounded-xl border border-[#d5e3ec] bg-white p-4 transition hover:border-[var(--brand)] hover:shadow-sm"
          >
            <m.icon className="size-5 text-[var(--brand)]" />
            <p className="mt-2 font-semibold text-[var(--brand-deep)]">{m.title}</p>
            <p className="mt-0.5 text-xs text-[#5a6578]">{m.body}</p>
            <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-[var(--brand)]">
              Abrir <ArrowRight className="size-3 transition group-hover:translate-x-0.5" />
            </span>
          </Link>
        ))}
      </section>
      <p className="mt-4 text-xs text-[#8a95a6]">
        {productCount} productos activos · slug <span className="font-mono">{admin.tenant.slug}</span>
      </p>
    </div>
  );
}
