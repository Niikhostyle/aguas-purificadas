import Link from "next/link";
import {
  ArrowRight,
  BellRing,
  CalendarClock,
  ClipboardList,
  CreditCard,
  Droplets,
  LocateFixed,
  Maximize2,
  Package,
  PackageCheck,
  Route as RouteIcon,
  ShoppingCart,
  Truck,
  Wallet,
} from "lucide-react";
import { redirect } from "next/navigation";
import { locateOrdersAction } from "./despacho/map-actions";
import { AutoRefresh } from "@/components/admin/dashboard/auto-refresh";
import { InventoryPanel, hasInventoryData } from "@/components/admin/dashboard/inventory-panel";
import { UpcomingDeliveries, type UpcomingRow } from "@/components/admin/dashboard/upcoming-deliveries";
import { FulfillmentBadge, PageHeader, PaymentBadge, StatCard, btn } from "@/components/admin/dispatch-ui";
import { LazyDispatchMap } from "@/components/admin/map/dispatch-map-lazy";
import { ConfirmSubmitButton, EmptyState, StatsTable } from "@/components/admin/ui";
import { LazySalesChart } from "@/components/admin/ui/sales-chart-lazy";
import { Tabs } from "@/components/admin/ui/tabs";
import { orderPeriodStats } from "@/lib/admin-stats";
import { isSuperAdmin, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  DISPATCHABLE_PAYMENT,
  addDaysStr,
  bottlesForItems,
  dateFromStr,
  formatDateCl,
  formatDateTimeCl,
  isReturnableItem,
  shortRef,
  startOfDayCl,
  toDateStr,
} from "@/lib/dispatch";
import { getDispatchMapData } from "@/lib/dispatch-map";
import { getDispatchStats } from "@/lib/dispatch-queries";
import { getInventorySnapshot, litersFromName } from "@/lib/inventory";
import { parseModuleFlags } from "@/lib/modules";
import { formatClp } from "@/lib/utils";

const OPEN_STATUSES = ["por_asignar", "programado", "en_ruta", "no_entregado"];

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

  const upcomingWhere = {
    tenantId,
    status: { in: DISPATCHABLE_PAYMENT },
    fulfillmentStatus: { in: OPEN_STATUSES },
    OR: [{ deliveryDate: { lte: dateFromStr(addDaysStr(today, 2)) } }, { deliveryDate: null }],
  };

  const [
    salesToday,
    salesYesterday,
    salesWeek,
    salesPrevWeek,
    deliveredRecent,
    pendingPayment,
    dueSoon,
    routes,
    recent,
    productCount,
    upcoming,
    upcomingCount,
    pendingToday,
    mapData,
    inventory,
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
    prisma.order.findMany({
      where: {
        tenantId,
        status: { in: DISPATCHABLE_PAYMENT },
        fulfillmentStatus: "entregado",
        deliveredAt: { gte: yesterdayStart },
      },
      select: { deliveredAt: true, items: { select: { productName: true, quantity: true } } },
    }),
    prisma.order.count({ where: { tenantId, status: "pending" } }),
    prisma.deliveryCustomer.count({
      where: { tenantId, recurring: true, nextDeliveryDate: { lte: dateFromStr(addDaysStr(today, 3)) } },
    }),
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
    prisma.order.findMany({
      where: upcomingWhere,
      select: {
        id: true,
        customerName: true,
        customerPhone: true,
        customerAddress: true,
        deliveryCommune: true,
        fulfillmentStatus: true,
        status: true,
        paymentProvider: true,
        totalClp: true,
        deliveryDate: true,
        deliverySlot: true,
        routeStop: true,
        lat: true,
        route: { select: { name: true } },
        items: { select: { productName: true, quantity: true } },
      },
      orderBy: [
        { deliveryDate: { sort: "asc", nulls: "last" } },
        { deliverySlot: { sort: "asc", nulls: "last" } },
        { route: { name: "asc" } },
        { routeStop: "asc" },
        { createdAt: "asc" },
      ],
      take: 8,
    }),
    prisma.order.count({ where: upcomingWhere }),
    prisma.orderItem.findMany({
      where: {
        order: {
          tenantId,
          status: { in: DISPATCHABLE_PAYMENT },
          fulfillmentStatus: { in: ["por_asignar", "programado", "en_ruta"] },
          deliveryDate: dateFromStr(today),
        },
      },
      select: { productName: true, quantity: true },
    }),
    getDispatchMapData(tenantId, admin.tenant.city, { date: today }),
    getInventorySnapshot(tenantId, { envases: flags.envases, demandToday: 0 }),
  ]);

  let bottlesToday = 0;
  let bottlesYesterday = 0;
  let litersToday = 0;
  let deliveredYesterday = 0;
  for (const o of deliveredRecent) {
    const isToday = o.deliveredAt! >= dayStart;
    const bottles = bottlesForItems(o.items);
    if (!isToday) deliveredYesterday++;
    if (isToday) {
      bottlesToday += bottles;
      litersToday += o.items.reduce(
        (s, i) => s + (isReturnableItem(i.productName) ? litersFromName(i.productName) * i.quantity : 0),
        0,
      );
    } else {
      bottlesYesterday += bottles;
    }
  }
  const inv = { ...inventory, demandToday: bottlesForItems(pendingToday) };
  const showInventory = hasInventoryData(inv);

  const upcomingRows: UpcomingRow[] = upcoming.map((o) => ({
    id: o.id,
    customerName: o.customerName,
    customerPhone: o.customerPhone,
    customerAddress: o.customerAddress,
    deliveryCommune: o.deliveryCommune,
    fulfillmentStatus: o.fulfillmentStatus,
    status: o.status,
    paymentProvider: o.paymentProvider,
    totalClp: o.totalClp,
    deliveryDate: toDateStr(o.deliveryDate),
    deliverySlot: o.deliverySlot,
    routeName: o.route?.name ?? null,
    routeStop: o.routeStop,
    bottles: bottlesForItems(o.items),
    located: o.lat != null,
  }));

  const activeRoutes = routes.filter((r) => r.status === "en_ruta").length;
  const inStreet = inv.envases?.inStreet ?? 0;

  const modules = [
    { show: true, href: "/admin/pedidos", title: "Pedidos + WebPay", body: `${pendingPayment} con pago pendiente · filtros y búsqueda`, icon: CreditCard },
    { show: flags.despacho, href: "/admin/despacho", title: "Ruta de despacho", body: "Agrupa por sector y día, hoja de ruta y vista chofer", icon: RouteIcon },
    { show: flags.recordatorios, href: "/admin/recordatorios", title: "Recordatorios", body: `${dueSoon} clientes próximos a reponer`, icon: BellRing },
    { show: flags.envases, href: "/admin/envases", title: "Envases retornables", body: `${inStreet} bidones en la calle · ${inv.envases?.owing ?? 0} clientes`, icon: Package },
  ].filter((m) => m.show);

  const mapPanel = (
    <section
      aria-labelledby="map-title"
      className="flex h-full flex-col overflow-hidden rounded-xl border border-[#dde7ee] bg-white shadow-[0_1px_2px_rgba(16,40,70,0.04)]"
    >
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e8f0f5] px-4 py-3">
        <div className="min-w-0">
          <h2 id="map-title" className="text-[15px] font-semibold text-[#12233d]">
            Mapa de entregas · hoy
          </h2>
          <p className="text-xs text-[#5a6578]">
            {mapData.orders.length - mapData.notFound} pedidos ubicados · {mapData.routes.length} ruta(s)
            {mapData.unlocated ? ` · ${mapData.unlocated} por ubicar` : ""}
            {mapData.notFound ? ` · ${mapData.notFound} con dirección no encontrada (pin gris)` : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {mapData.unlocated ? (
            <form action={locateOrdersAction}>
              <input type="hidden" name="returnTo" value="/admin/" />
              <ConfirmSubmitButton
                className={btn.outline}
                tone="primary"
                confirmTitle="¿Ubicar pedidos en el mapa?"
                confirmText="Buscaremos las direcciones sin coordenadas en OpenStreetMap (aprox. 1 segundo por pedido, hasta 12 por vez)."
                confirmLabel="Ubicar"
              >
                <LocateFixed className="size-4" /> Ubicar pedidos
              </ConfirmSubmitButton>
            </form>
          ) : null}
          {flags.despacho ? (
            <Link href="/admin/despacho/mapa" className={btn.outline}>
              <Maximize2 className="size-4" /> <span className="hidden sm:inline">Pantalla completa</span>
              <span className="sr-only sm:hidden">Mapa en pantalla completa</span>
            </Link>
          ) : null}
        </div>
      </header>
      <div className="h-[340px] shrink-0 p-2 sm:h-[400px] lg:h-auto lg:min-h-[420px] lg:flex-1">
        <LazyDispatchMap data={mapData} className="h-full" />
      </div>
    </section>
  );

  return (
    <div>
      <AutoRefresh seconds={60} />
      <PageHeader
        title="Centro de despacho"
        subtitle={
          <>
            {admin.tenant.name} · {formatDateCl(today, "long")}
            <span className="ml-2 inline-flex items-center gap-1.5 align-middle text-xs font-medium text-emerald-700">
              <span aria-hidden className="mb-live-dot size-1.5 rounded-full bg-emerald-500" /> Se actualiza cada minuto
            </span>
          </>
        }
      >
        {flags.despacho ? (
          <Link href="/admin/despacho" className={btn.primary}>
            <Truck className="size-4" /> Ir a despacho
          </Link>
        ) : null}
        <Link href="/" className={btn.outline}>
          Ver tienda
        </Link>
      </PageHeader>

      <section
        aria-label="Indicadores del día"
        className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:max-xl:[&_.kpi-card]:gap-2.5 lg:max-xl:[&_.kpi-card]:p-3 lg:max-xl:[&_.kpi-icon]:size-9 lg:max-xl:[&_.kpi-value]:text-xl"
      >
        <StatCard
          label="Entregas activas"
          value={stats.enRuta}
          hint={`${activeRoutes} ruta(s) en curso · ${stats.entregadosHoy} entregadas hoy`}
          icon={Truck}
          tone="brand"
          href="/admin/despacho?fecha=todas&estado=en_ruta"
          trend={{ current: stats.entregadosHoy, previous: deliveredYesterday, label: "entregas vs ayer" }}
        />
        <StatCard
          label="Recargas pendientes"
          value={stats.pendientes}
          hint={flags.recordatorios ? `${dueSoon} clientes por reponer (3 días)` : "Por asignar o programadas"}
          icon={CalendarClock}
          tone="amber"
          href="/admin/despacho?fecha=todas&estado=por_asignar"
          trend={{ current: period.orders[0], previous: period.orders[1], label: "pedidos nuevos vs ayer" }}
        />
        <StatCard
          label="Bidones despachados hoy"
          value={bottlesToday.toLocaleString("es-CL")}
          hint={litersToday ? `${litersToday.toLocaleString("es-CL")} litros entregados` : "Litros según el formato de cada bidón"}
          icon={Droplets}
          tone="navy"
          href={`/admin/despacho?fecha=${today}&estado=entregado`}
          trend={{ current: bottlesToday, previous: bottlesYesterday, label: "vs ayer" }}
        />
        <StatCard
          label="Ventas de hoy"
          value={formatClp(salesToday._sum.totalClp ?? 0)}
          hint={`${salesToday._count} pagos WebPay`}
          icon={Wallet}
          tone="emerald"
          href="/admin/pedidos?pago=paid"
          trend={{ current: salesToday._sum.totalClp ?? 0, previous: salesYesterday._sum.totalClp ?? 0, label: "vs ayer" }}
        />
      </section>

      <div className={`mt-6 grid gap-6 ${showInventory ? "lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_340px]" : ""}`}>
        {mapPanel}
        {showInventory ? <InventoryPanel inv={inv} showEnvasesLink={flags.envases} /> : null}
      </div>

      <div className="mt-6">
        <UpcomingDeliveries rows={upcomingRows} total={upcomingCount} today={today} dispatchEnabled={flags.despacho} />
      </div>

      <section className="mt-6 overflow-hidden rounded-xl border border-[#dde7ee] bg-white shadow-[0_1px_2px_rgba(16,40,70,0.04)]">
        <Tabs
          label="Ventas y actividad"
          items={[
            {
              id: "ventas",
              label: "Ventas · 14 días",
              content: (
                <div className="p-5">
                  <p className="mb-3 text-[13px] text-[#5a6578]">Pasa el cursor o toca una barra para ver el detalle.</p>
                  <LazySalesChart data={period.daily} />
                </div>
              ),
            },
            {
              id: "estadisticas",
              label: "Estadísticas",
              content: (
                <div>
                  <p className="px-5 pt-4 text-[13px] text-[#5a6578]">Pedidos y ventas pagadas, horario de Chile.</p>
                  <StatsTable
                    caption="Estadísticas por período"
                    rows={[
                      { label: "Ventas pagadas", values: period.revenue.map((v) => formatClp(v)) },
                      { label: "Pedidos", values: period.orders.map((v) => v.toLocaleString("es-CL")) },
                    ]}
                  />
                </div>
              ),
            },
            {
              id: "indicadores",
              label: "Más indicadores",
              content: (
                <div className="grid grid-cols-2 gap-3 p-5 xl:grid-cols-4">
                  <StatCard
                    label="Ventas 7 días"
                    value={formatClp(salesWeek._sum.totalClp ?? 0)}
                    hint={`${salesWeek._count} pedidos pagados`}
                    icon={CreditCard}
                    tone="navy"
                    href="/admin/pedidos?pago=paid"
                    trend={{ current: salesWeek._sum.totalClp ?? 0, previous: salesPrevWeek._sum.totalClp ?? 0, label: "vs 7 días previos" }}
                  />
                  <StatCard label="Pedidos hoy" value={stats.hoy} hint={`${stats.creadosHoy} ingresados hoy`} icon={ClipboardList} tone="brand" href="/admin/despacho" />
                  <StatCard label="Entregados hoy" value={stats.entregadosHoy} icon={PackageCheck} tone="emerald" href={`/admin/despacho?fecha=${today}&estado=entregado`} />
                  {flags.recordatorios ? (
                    <StatCard label="Próximos a reponer" value={dueSoon} hint="Recurrentes · 3 días" icon={BellRing} tone="rose" href="/admin/recordatorios" />
                  ) : null}
                  {flags.envases ? (
                    <StatCard label="Envases en la calle" value={inStreet} hint={`${inv.envases?.owing ?? 0} clientes con saldo`} icon={Package} tone="navy" href="/admin/envases" />
                  ) : null}
                </div>
              ),
            },
            {
              id: "actividad",
              label: "Actividad",
              content: (
                <div className="grid gap-0 lg:grid-cols-2 lg:divide-x lg:divide-[#e8f0f5]">
                  <div>
                    <header className="flex items-center justify-between px-5 py-3">
                      <h3 className="text-sm font-semibold text-[var(--brand-deep)]">Últimos pedidos</h3>
                      <Link href="/admin/pedidos" className="text-sm text-[var(--brand)] hover:underline">
                        Ver todos
                      </Link>
                    </header>
                    <ul className="divide-y divide-[#eef3f7] border-t border-[#eef3f7]">
                      {recent.map((o) => (
                        <li key={o.id}>
                          <Link href={`/admin/pedidos/${o.id}`} className="flex flex-wrap items-center justify-between gap-2 px-5 py-2.5 hover:bg-[#fafdfe]">
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
                          />
                        </li>
                      ) : null}
                    </ul>
                  </div>
                  <div>
                    <header className="flex items-center justify-between px-5 py-3">
                      <h3 className="text-sm font-semibold text-[var(--brand-deep)]">Rutas de hoy</h3>
                      {flags.despacho ? (
                        <Link href="/admin/despacho" className="text-sm text-[var(--brand)] hover:underline">
                          Planificar
                        </Link>
                      ) : null}
                    </header>
                    <ul className="divide-y divide-[#eef3f7] border-t border-[#eef3f7]">
                      {routes.map((r) => {
                        const done = r.orders.filter((o) => o.fulfillmentStatus === "entregado").length;
                        const pct = r.orders.length ? Math.round((done / r.orders.length) * 100) : 0;
                        return (
                          <li key={r.id} className="px-5 py-3">
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
                  </div>
                </div>
              ),
            },
          ]}
        />
      </section>

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
