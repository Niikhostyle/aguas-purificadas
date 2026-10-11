import Link from "next/link";
import type { Prisma } from "@prisma/client";
import {
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  MapPin,
  MessageCircle,
  PackageCheck,
  Printer,
  Route as RouteIcon,
  Smartphone,
  Sparkles,
  Truck,
} from "lucide-react";
import {
  assignOrdersAction,
  autoGroupAction,
  markOrdersAction,
  startRouteAction,
  updateRouteAction,
} from "./actions";
import { SelectAllCheckbox } from "@/components/admin/client-helpers";
import {
  Flash,
  FulfillmentBadge,
  ModuleDisabled,
  PageHeader,
  PaymentBadge,
  Pill,
  StatCard,
  btn,
  field,
} from "@/components/admin/dispatch-ui";
import { OrderDispatchActions } from "@/components/admin/order-dispatch-actions";
import { prisma } from "@/lib/db";
import {
  DISPATCHABLE_PAYMENT,
  FULFILLMENT_LABEL,
  FULFILLMENT_STATUSES,
  SLOTS,
  SLOT_LABEL,
  addDaysStr,
  bottlesForItems,
  compareStops,
  customerWhatsappHref,
  dateFromStr,
  formatDateCl,
  mapsHref,
  shortRef,
  toDateStr,
} from "@/lib/dispatch";
import { getDispatchStats } from "@/lib/dispatch-queries";
import { requireTenantModule } from "@/lib/tenant-admin";
import { cn, formatClp } from "@/lib/utils";

const BULK_FORM = "bulk-dispatch";

type SP = {
  fecha?: string;
  zona?: string;
  estado?: string;
  pago?: string;
  ok?: string;
  error?: string;
};

type OrderRow = Prisma.OrderGetPayload<{ include: { items: true } }>;

export default async function DespachoPage({ searchParams }: { searchParams: Promise<SP> }) {
  const { admin, tenantId, enabled } = await requireTenantModule("despacho");
  if (!enabled) return <ModuleDisabled name="Ruta de despacho" />;
  const sp = await searchParams;
  const stats = await getDispatchStats(tenantId);
  const today = stats.today;

  const fecha =
    sp.fecha === "todas" || sp.fecha === "sin-fecha" || /^\d{4}-\d{2}-\d{2}$/.test(sp.fecha ?? "")
      ? sp.fecha!
      : today;
  const specificDate = /^\d{4}-\d{2}-\d{2}$/.test(fecha) ? fecha : null;
  const estado = FULFILLMENT_STATUSES.includes(sp.estado as never) ? sp.estado : undefined;
  const pago = sp.pago === "paid" || sp.pago === "pending" ? sp.pago : undefined;
  const zona = sp.zona?.trim() || undefined;

  const where: Prisma.OrderWhereInput = {
    tenantId,
    status: pago ? pago : { in: DISPATCHABLE_PAYMENT },
    ...(estado ? { fulfillmentStatus: estado } : {}),
    ...(zona ? { OR: [{ deliveryCommune: zona }, { deliveryZoneName: zona }] } : {}),
  };
  if (fecha === "sin-fecha") where.deliveryDate = null;
  if (specificDate) {
    where.AND = [
      {
        OR: [
          { deliveryDate: dateFromStr(specificDate) },
          { deliveryDate: null, fulfillmentStatus: { in: ["por_asignar", "no_entregado"] } },
        ],
      },
    ];
  }

  const [orders, routesOfDay, communeRows, zoneRows] = await Promise.all([
    prisma.order.findMany({
      where,
      include: { items: true },
      orderBy: [{ routeStop: "asc" }, { createdAt: "asc" }],
      take: 400,
    }),
    prisma.deliveryRoute.findMany({
      where: { tenantId, ...(specificDate ? { date: dateFromStr(specificDate) } : { date: { gte: dateFromStr(addDaysStr(today, -1)) } }) },
      orderBy: [{ date: "asc" }, { name: "asc" }],
      include: { _count: { select: { orders: true } } },
      take: 50,
    }),
    prisma.order.findMany({
      where: { tenantId, deliveryCommune: { not: null } },
      distinct: ["deliveryCommune"],
      select: { deliveryCommune: true },
      take: 100,
    }),
    prisma.deliveryZone.findMany({ where: { tenantId }, select: { name: true }, orderBy: { name: "asc" } }),
  ]);

  const routeIds = Array.from(new Set(orders.map((o) => o.routeId).filter(Boolean))) as string[];
  const routesById = new Map(
    (
      await prisma.deliveryRoute.findMany({ where: { tenantId, id: { in: routeIds } } })
    ).map((r) => [r.id, r]),
  );

  const routed = new Map<string, OrderRow[]>();
  const unroutedBySector = new Map<string, OrderRow[]>();
  for (const o of orders) {
    if (o.routeId && routesById.has(o.routeId)) {
      routed.set(o.routeId, [...(routed.get(o.routeId) ?? []), o]);
    } else {
      const key = !o.deliveryDate ? "__sin_fecha" : (o.deliveryZoneName || o.deliveryCommune || "Sin sector");
      unroutedBySector.set(key, [...(unroutedBySector.get(key) ?? []), o]);
    }
  }
  for (const list of unroutedBySector.values()) list.sort(compareStops);

  const qs = new URLSearchParams();
  if (sp.fecha) qs.set("fecha", sp.fecha);
  if (zona) qs.set("zona", zona);
  if (estado) qs.set("estado", estado);
  if (pago) qs.set("pago", pago);
  const returnTo = `/admin/despacho${qs.toString() ? `?${qs}` : ""}`;

  const zoneOptions = Array.from(
    new Set([
      ...zoneRows.map((z) => z.name),
      ...communeRows.map((c) => c.deliveryCommune!).filter(Boolean),
    ]),
  ).sort((a, b) => a.localeCompare(b, "es"));

  const quick = [
    { label: "Hoy", value: today },
    { label: "Mañana", value: addDaysStr(today, 1) },
    { label: "Sin fecha", value: "sin-fecha" },
    { label: "Todas", value: "todas" },
  ];
  const assignDate = specificDate ?? today;

  return (
    <div className="pb-28">
      <PageHeader
        title="Panel de despacho"
        subtitle={
          <>
            {admin.tenant.name} · {formatDateCl(today, "long")} · rutas por sector, comuna y día
          </>
        }
      >
        <Link href={`/admin/despacho/chofer?fecha=${assignDate}`} className={btn.outline}>
          <Smartphone className="size-4" /> Vista chofer
        </Link>
        <Link href={`/admin/despacho/hoja?fecha=${assignDate}`} className={btn.outline}>
          <Printer className="size-4" /> Hojas de ruta del día
        </Link>
      </PageHeader>

      <Flash ok={sp.ok} error={sp.error} />

      <section className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Pedidos hoy" value={stats.hoy} hint={`${stats.creadosHoy} ingresados hoy`} icon={ClipboardList} tone="navy" href={`/admin/despacho?fecha=${today}`} />
        <StatCard label="Pendientes" value={stats.pendientes} hint="Por asignar o programados" icon={CalendarClock} tone="amber" href="/admin/despacho?fecha=todas&estado=por_asignar" />
        <StatCard label="En ruta" value={stats.enRuta} hint="Con el chofer ahora" icon={Truck} tone="brand" href="/admin/despacho?fecha=todas&estado=en_ruta" />
        <StatCard label="Entregados hoy" value={stats.entregadosHoy} hint="Confirmados por el equipo" icon={PackageCheck} tone="emerald" href={`/admin/despacho?fecha=${today}&estado=entregado`} />
      </section>

      <section className="mt-6 rounded-xl border border-[#d5e3ec] bg-white p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-[#5a6578]">Día</span>
          {quick.map((q) => {
            const p = new URLSearchParams(qs);
            p.set("fecha", q.value);
            const active = fecha === q.value;
            return (
              <Link
                key={q.value}
                href={`/admin/despacho?${p}`}
                className={cn(
                  "rounded-full px-3 py-1 text-sm font-medium ring-1 ring-inset transition",
                  active
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
          <input type="date" name="fecha" defaultValue={specificDate ?? ""} className={field} aria-label="Fecha de entrega" />
          <select name="zona" defaultValue={zona ?? ""} className={field} aria-label="Comuna o sector">
            <option value="">Todas las comunas / sectores</option>
            {zoneOptions.map((z) => (
              <option key={z} value={z}>
                {z}
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
          <select name="pago" defaultValue={pago ?? ""} className={field} aria-label="Estado de pago">
            <option value="">Pagados y pendientes</option>
            <option value="paid">Solo pagados</option>
            <option value="pending">Solo pago pendiente</option>
          </select>
          <div className="flex gap-2">
            <button type="submit" className={cn(btn.primary, "flex-1")}>
              Filtrar
            </button>
            <Link href="/admin/despacho" className={btn.outline}>
              Limpiar
            </Link>
          </div>
        </form>
      </section>

      {specificDate ? (
        <form action={autoGroupAction} className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#9fdcef] bg-[linear-gradient(90deg,#e6f7fc,#f4fbfe)] px-4 py-3">
          <input type="hidden" name="date" value={specificDate} />
          <input type="hidden" name="returnTo" value={returnTo} />
          <p className="text-sm text-[var(--brand-deep)]">
            <Sparkles className="mr-1 inline size-4 text-[var(--brand)]" />
            <strong>Ruta inteligente:</strong> agrupa los pedidos sin ruta del {formatDateCl(specificDate)} en una ruta por sector, con paradas ordenadas por comuna y dirección.
          </p>
          <button type="submit" className={btn.navy}>
            <RouteIcon className="size-4" /> Agrupar por sector
          </button>
        </form>
      ) : null}

      <div className="mt-6 space-y-5">
        {orders.length === 0 ? (
          <p className="rounded-xl border border-dashed border-[#d5e3ec] bg-white px-6 py-14 text-center text-[#5a6578]">
            No hay pedidos para estos filtros.
          </p>
        ) : null}

        {Array.from(routed.entries()).map(([routeId, list]) => {
          const route = routesById.get(routeId)!;
          const delivered = list.filter((o) => o.fulfillmentStatus === "entregado").length;
          const bottles = list.reduce((s, o) => s + bottlesForItems(o.items), 0);
          const pct = Math.round((delivered / list.length) * 100);
          return (
            <section key={routeId} className="overflow-hidden rounded-xl border border-[#d5e3ec] bg-white">
              <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e8f0f5] bg-[#f4fbfe] px-4 py-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <RouteIcon className="size-4 text-[var(--brand)]" />
                    <h2 className="font-semibold text-[var(--brand-deep)]">{route.name}</h2>
                    <Pill className={route.status === "completada" ? "bg-emerald-50 text-emerald-800 ring-emerald-200" : route.status === "en_ruta" ? "bg-[#e6f7fc] text-[#007fa3] ring-[#9fdcef]" : "bg-white text-[#5a6578] ring-[#d5e3ec]"}>
                      {route.status === "completada" ? "Completada" : route.status === "en_ruta" ? "En ruta" : "Planificada"}
                    </Pill>
                  </div>
                  <p className="mt-0.5 text-xs text-[#5a6578]">
                    {formatDateCl(toDateStr(route.date))} · {route.slot ? SLOT_LABEL[route.slot] : "Sin bloque"} · Chofer: {route.driverName || "sin asignar"} · {list.length} paradas · {bottles} bidones
                  </p>
                  <div className="mt-2 h-1.5 w-48 overflow-hidden rounded-full bg-[#e8f0f5]">
                    <div className="h-full rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <SelectAllCheckbox formId={BULK_FORM} group={routeId} label="Todos" />
                  <Link href={`/admin/despacho/hoja?ruta=${routeId}`} className={btn.ghost}>
                    <Printer className="size-3.5" /> Hoja
                  </Link>
                  <Link href={`/admin/despacho/chofer?ruta=${routeId}`} className={btn.ghost}>
                    <Smartphone className="size-3.5" /> Chofer
                  </Link>
                  <details className="relative">
                    <summary className={cn(btn.ghost, "cursor-pointer list-none [&::-webkit-details-marker]:hidden")}>Editar</summary>
                    <form action={updateRouteAction} className="absolute right-0 z-20 mt-2 w-64 space-y-2 rounded-xl border border-[#d5e3ec] bg-white p-3 shadow-lg">
                      <input type="hidden" name="routeId" value={routeId} />
                      <input type="hidden" name="returnTo" value={returnTo} />
                      <input name="driverName" defaultValue={route.driverName ?? ""} placeholder="Nombre del chofer" className={cn(field, "w-full")} />
                      <select name="slot" defaultValue={route.slot ?? ""} className={cn(field, "w-full")}>
                        <option value="">Sin bloque</option>
                        {SLOTS.map((s) => (
                          <option key={s} value={s}>{SLOT_LABEL[s]}</option>
                        ))}
                      </select>
                      <button type="submit" className={cn(btn.primary, "w-full")}>Guardar</button>
                    </form>
                  </details>
                  {route.status === "planificada" ? (
                    <form action={startRouteAction}>
                      <input type="hidden" name="routeId" value={routeId} />
                      <input type="hidden" name="returnTo" value={returnTo} />
                      <button type="submit" className={cn(btn.navy, "py-1.5 text-xs")}>
                        <Truck className="size-3.5" /> Iniciar ruta
                      </button>
                    </form>
                  ) : null}
                </div>
              </header>
              <OrderList orders={list} group={routeId} returnTo={returnTo} showStop />
            </section>
          );
        })}

        {Array.from(unroutedBySector.entries())
          .sort(([a], [b]) => (a === "__sin_fecha" ? 1 : b === "__sin_fecha" ? -1 : a.localeCompare(b, "es")))
          .map(([sector, list]) => (
            <section key={sector} className="overflow-hidden rounded-xl border border-[#d5e3ec] bg-white">
              <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e8f0f5] bg-[#fbfdfe] px-4 py-3">
                <div className="flex items-center gap-2">
                  <MapPin className="size-4 text-amber-600" />
                  <h2 className="font-semibold text-[var(--brand-deep)]">
                    {sector === "__sin_fecha" ? "Por planificar · sin fecha de entrega" : `${sector} · sin ruta`}
                  </h2>
                  <span className="text-xs text-[#5a6578]">{list.length} pedidos</span>
                </div>
                <SelectAllCheckbox formId={BULK_FORM} group={sector} label="Todos" />
              </header>
              <OrderList orders={list} group={sector} returnTo={returnTo} />
            </section>
          ))}
      </div>

      <form
        id={BULK_FORM}
        action={assignOrdersAction}
        className="fixed inset-x-0 bottom-0 z-30 border-t border-[#d5e3ec] bg-white/95 px-4 py-3 shadow-[0_-8px_24px_rgba(18,50,110,0.08)] backdrop-blur print:hidden"
      >
        <input type="hidden" name="returnTo" value={returnTo} />
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-[#5a6578]">Seleccionados →</span>
          <input type="date" name="date" defaultValue={assignDate} className={field} aria-label="Día de entrega" />
          <select name="slot" defaultValue="" className={field} aria-label="Bloque horario">
            <option value="">Bloque</option>
            {SLOTS.map((s) => (
              <option key={s} value={s}>{SLOT_LABEL[s]}</option>
            ))}
          </select>
          <select name="routeId" defaultValue="" className={field} aria-label="Ruta">
            <option value="">Sin ruta (solo día)</option>
            {routesOfDay.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} ({r._count.orders})
              </option>
            ))}
            <option value="__new">+ Nueva ruta…</option>
          </select>
          <input name="newRouteName" placeholder="Nombre nueva ruta" maxLength={80} className={cn(field, "w-40")} aria-label="Nombre de nueva ruta" />
          <button type="submit" className={btn.primary}>
            <CalendarClock className="size-4" /> Asignar
          </button>
          <span className="mx-1 h-6 w-px bg-[#d5e3ec]" />
          <input name="note" placeholder="Nota (opcional)" maxLength={500} className={cn(field, "w-40")} aria-label="Nota" />
          <button type="submit" formAction={markOrdersAction} name="status" value="en_ruta" className={btn.navy}>
            <Truck className="size-4" /> En ruta
          </button>
          <button type="submit" formAction={markOrdersAction} name="status" value="entregado" className={btn.success}>
            <CheckCircle2 className="size-4" /> Entregado
          </button>
        </div>
      </form>
    </div>
  );
}

function OrderList({
  orders,
  group,
  returnTo,
  showStop,
}: {
  orders: OrderRow[];
  group: string;
  returnTo: string;
  showStop?: boolean;
}) {
  return (
    <ul className="divide-y divide-[#eef3f7]">
      {orders.map((o) => {
        const bottles = bottlesForItems(o.items);
        const date = toDateStr(o.deliveryDate);
        return (
          <li key={o.id} className="grid gap-3 px-4 py-3 transition hover:bg-[#fafdfe] md:grid-cols-[auto_minmax(0,1.6fr)_minmax(0,1.3fr)_auto] md:items-center">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                name="orderIds"
                value={o.id}
                form={BULK_FORM}
                data-group={group}
                disabled={o.fulfillmentStatus === "entregado"}
                className="size-4 accent-[var(--brand)] disabled:opacity-30"
                aria-label={`Seleccionar pedido ${shortRef(o.id)}`}
              />
              {showStop ? (
                <span className="grid size-7 place-items-center rounded-full bg-[var(--brand-deep)] text-xs font-bold text-white">
                  {o.routeStop ?? "·"}
                </span>
              ) : null}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Link href={`/admin/pedidos/${o.id}`} className="font-semibold text-[var(--brand-deep)] hover:text-[var(--brand)]">
                  {o.customerName}
                </Link>
                <span className="font-mono text-[11px] text-[#8a95a6]">#{shortRef(o.id)}</span>
              </div>
              <p className="truncate text-sm text-[#3d4a5c]">
                {o.customerAddress}
                {o.deliveryCommune ? `, ${o.deliveryCommune}` : ""}
              </p>
              <p className="text-xs text-[#5a6578]">
                {o.items.map((i) => `${i.quantity}× ${i.productName}`).join(" · ")}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <FulfillmentBadge status={o.fulfillmentStatus} />
              <PaymentBadge status={o.status} provider={o.paymentProvider} />
              <span className="text-xs text-[#5a6578]">
                {formatDateCl(date)}
                {o.deliverySlot ? ` · ${o.deliverySlot === "manana" ? "AM" : "PM"}` : ""} · {formatClp(o.totalClp)}
                {bottles ? ` · ${bottles} bid.` : ""}
              </span>
              {o.dispatchNotes ? (
                <span className="w-full truncate text-xs italic text-[#5a6578]">“{o.dispatchNotes.split("\n").at(-1)}”</span>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-1.5 md:justify-end">
              <a href={customerWhatsappHref(o.customerPhone, `Hola ${o.customerName.split(" ")[0]}, te escribimos por tu pedido de agua #${shortRef(o.id)}.`)} target="_blank" rel="noopener noreferrer" className={cn(btn.ghost, "text-emerald-700")} title="WhatsApp">
                <MessageCircle className="size-3.5" />
              </a>
              <a href={mapsHref(o.customerAddress, o.deliveryCommune)} target="_blank" rel="noopener noreferrer" className={btn.ghost} title="Google Maps">
                <MapPin className="size-3.5" />
              </a>
              <OrderDispatchActions orderId={o.id} status={o.fulfillmentStatus} returnTo={returnTo} bottlesExpected={bottles} />
              {o.fulfillmentStatus === "entregado" ? (
                <span className="text-xs text-emerald-700">
                  ✓ {o.bottlesReturned ?? 0}/{o.bottlesDelivered ?? 0} envases
                </span>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
