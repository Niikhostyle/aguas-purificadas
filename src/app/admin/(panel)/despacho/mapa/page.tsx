import Link from "next/link";
import { List, LocateFixed, MapPin, Route as RouteIcon } from "lucide-react";
import { locateOrdersAction } from "../map-actions";
import { Flash, ModuleDisabled, PageHeader, btn, field } from "@/components/admin/dispatch-ui";
import { AutoRefresh } from "@/components/admin/dashboard/auto-refresh";
import { FocusOnMapButton, LazyDispatchMap } from "@/components/admin/map/dispatch-map-lazy";
import { ConfirmSubmitButton } from "@/components/admin/ui";
import { prisma } from "@/lib/db";
import { FULFILLMENT_LABEL, FULFILLMENT_STATUSES, addDaysStr, dateFromStr, formatDateCl, todayCl } from "@/lib/dispatch";
import { getDispatchMapData } from "@/lib/dispatch-map";
import { PIN_COLOR, PIN_LABEL, ROUTE_COLORS } from "@/lib/geo";
import { requireTenantModule } from "@/lib/tenant-admin";
import { cn } from "@/lib/utils";

type SP = { fecha?: string; ruta?: string; chofer?: string; estado?: string; ok?: string; error?: string };

export default async function DespachoMapaPage({ searchParams }: { searchParams: Promise<SP> }) {
  const { admin, tenantId, enabled } = await requireTenantModule("despacho");
  if (!enabled) return <ModuleDisabled name="Ruta de despacho" />;
  const sp = await searchParams;
  const today = todayCl();
  const fecha = /^\d{4}-\d{2}-\d{2}$/.test(sp.fecha ?? "") ? sp.fecha! : today;
  const estado = FULFILLMENT_STATUSES.includes(sp.estado as never) ? sp.estado : undefined;
  const ruta = sp.ruta && sp.ruta.length <= 40 ? sp.ruta : undefined;
  const chofer = sp.chofer?.trim().slice(0, 80) || undefined;

  const [data, routesOfDay] = await Promise.all([
    getDispatchMapData(tenantId, admin.tenant.city, { date: fecha, routeId: ruta, driver: chofer, status: estado }),
    prisma.deliveryRoute.findMany({
      where: { tenantId, date: dateFromStr(fecha) },
      select: { id: true, name: true, driverName: true },
      orderBy: { name: "asc" },
    }),
  ]);
  const drivers = Array.from(new Set(routesOfDay.map((r) => r.driverName).filter(Boolean))) as string[];

  const qs = new URLSearchParams();
  if (sp.fecha) qs.set("fecha", fecha);
  if (ruta) qs.set("ruta", ruta);
  if (chofer) qs.set("chofer", chofer);
  if (estado) qs.set("estado", estado);
  const returnTo = `/admin/despacho/mapa${qs.toString() ? `?${qs}` : ""}`;

  const quick = [
    { label: "Ayer", value: addDaysStr(today, -1) },
    { label: "Hoy", value: today },
    { label: "Mañana", value: addDaysStr(today, 1) },
  ];

  const ordersByRoute = new Map<string, typeof data.orders>();
  const loose: typeof data.orders = [];
  for (const o of data.orders) {
    if (o.routeId) ordersByRoute.set(o.routeId, [...(ordersByRoute.get(o.routeId) ?? []), o]);
    else loose.push(o);
  }

  const liveDrivers = data.routes.filter((r) => r.driverLive).length;

  return (
    <div>
      {fecha === today ? <AutoRefresh seconds={liveDrivers ? 20 : 60} /> : null}
      <PageHeader
        title="Mapa de entregas"
        subtitle={`${admin.tenant.name} · ${formatDateCl(fecha, "long")} · pedidos, rutas y choferes`}
      >
        <Link href={`/admin/despacho?fecha=${fecha}`} className={btn.outline}>
          <List className="size-4" /> Vista lista
        </Link>
        {data.unlocated ? (
          <form action={locateOrdersAction}>
            <input type="hidden" name="returnTo" value={returnTo} />
            <ConfirmSubmitButton
              className={btn.primary}
              tone="primary"
              confirmTitle="¿Ubicar pedidos en el mapa?"
              confirmText="Buscaremos las direcciones sin coordenadas en OpenStreetMap (aprox. 1 segundo por pedido, hasta 12 por vez)."
              confirmLabel="Ubicar"
            >
              <LocateFixed className="size-4" /> Ubicar {data.unlocated} pedido(s)
            </ConfirmSubmitButton>
          </form>
        ) : null}
      </PageHeader>

      <Flash ok={sp.ok} error={sp.error} />
      {data.notFound ? (
        <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-900">
          {data.notFound} pedido(s) con dirección no encontrada aparecen como pin gris «?» cerca del centro. Activa
          «Corregir» en el mapa y arrástralos a su ubicación real.
        </p>
      ) : null}

      <section className="mt-6 rounded-xl border border-[#d5e3ec] bg-white p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-[#5a6578]">Día</span>
          {quick.map((q) => {
            const p = new URLSearchParams(qs);
            p.set("fecha", q.value);
            p.delete("ruta");
            return (
              <Link
                key={q.value}
                href={`/admin/despacho/mapa?${p}`}
                className={cn(
                  "rounded-full px-3 py-1 text-sm font-medium ring-1 ring-inset transition",
                  fecha === q.value
                    ? "bg-[var(--brand)] text-white ring-[var(--brand)]"
                    : "bg-white text-[var(--brand-deep)] ring-[#d5e3ec] hover:ring-[var(--brand)]",
                )}
              >
                {q.label}
              </Link>
            );
          })}
        </div>
        <form method="get" className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          <input type="date" name="fecha" defaultValue={fecha} className={field} aria-label="Fecha de entrega" />
          <select name="ruta" defaultValue={ruta ?? ""} className={field} aria-label="Ruta">
            <option value="">Todas las rutas</option>
            {routesOfDay.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
          <select name="chofer" defaultValue={chofer ?? ""} className={field} aria-label="Chofer">
            <option value="">Todos los choferes</option>
            {drivers.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <select name="estado" defaultValue={estado ?? ""} className={field} aria-label="Estado de despacho">
            <option value="">Todos los estados</option>
            {FULFILLMENT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {FULFILLMENT_LABEL[s]}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <button type="submit" className={cn(btn.primary, "flex-1")}>
              Filtrar
            </button>
            <Link href="/admin/despacho/mapa" className={btn.outline}>
              Limpiar
            </Link>
          </div>
        </form>
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="h-[60vh] min-h-[380px] rounded-xl border border-[#dde7ee] bg-white p-2 lg:h-[calc(100vh-300px)] lg:min-h-[520px]">
          <LazyDispatchMap data={data} className="h-full" scrollZoom />
        </div>

        <aside aria-label="Rutas y pedidos del mapa" className="space-y-4 xl:max-h-[calc(100vh-300px)] xl:overflow-y-auto">
          {data.routes.map((r) => {
            const list = ordersByRoute.get(r.id) ?? [];
            const color = ROUTE_COLORS[r.colorIndex % ROUTE_COLORS.length];
            return (
              <section key={r.id} className="overflow-hidden rounded-xl border border-[#dde7ee] bg-white">
                <header className="border-b border-[#e8f0f5] px-4 py-2.5">
                  <p className="flex items-center gap-2 text-sm font-semibold text-[var(--brand-deep)]">
                    <span
                      aria-hidden
                      className="h-1.5 w-5 rounded-full"
                      style={{ background: r.colorIndex < 2 ? (r.colorIndex === 0 ? "var(--brand)" : "var(--brand-deep)") : color }}
                    />
                    <RouteIcon className="size-4 text-[var(--brand)]" /> {r.name}
                  </p>
                  <p className="text-xs text-[#5a6578]">
                    {r.driverName ?? "Sin chofer"} · {r.delivered}/{r.total} entregados{r.driverLive ? " · GPS en vivo" : ""}
                  </p>
                </header>
                <OrderList orders={list} />
              </section>
            );
          })}
          {loose.length ? (
            <section className="overflow-hidden rounded-xl border border-[#dde7ee] bg-white">
              <header className="border-b border-[#e8f0f5] px-4 py-2.5">
                <p className="flex items-center gap-2 text-sm font-semibold text-[var(--brand-deep)]">
                  <MapPin className="size-4 text-amber-600" /> Sin ruta
                </p>
              </header>
              <OrderList orders={loose} />
            </section>
          ) : null}
          {data.orders.length === 0 ? (
            <p className="rounded-xl border border-dashed border-[#d5e3ec] bg-white p-4 text-sm text-[#5a6578]">
              No hay pedidos ubicados para estos filtros.
              {data.unlocated ? ` Hay ${data.unlocated} pedido(s) sin coordenadas: usa «Ubicar pedidos».` : ""}
            </p>
          ) : null}
        </aside>
      </div>
    </div>
  );
}

function OrderList({ orders }: { orders: { id: string; customerName: string; address: string; status: string; routeStop: number | null }[] }) {
  return (
    <ul className="divide-y divide-[#eef3f7]">
      {orders.map((o) => (
        <li key={o.id}>
          <FocusOnMapButton
            orderId={o.id}
            className="flex w-full items-center gap-2.5 px-4 py-2 text-left hover:bg-[#fafdfe] focus-visible:bg-[#f1f8fc] focus-visible:outline-none"
          >
            <span
              aria-hidden
              className="grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-bold text-white"
              style={{ background: PIN_COLOR[o.status] ?? "#64748b" }}
            >
              {o.routeStop ?? "·"}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-[#12233d]">{o.customerName}</span>
              <span className="block truncate text-xs text-[#5a6578]">
                {o.address} · {PIN_LABEL[o.status] ?? o.status}
              </span>
            </span>
          </FocusOnMapButton>
        </li>
      ))}
    </ul>
  );
}
