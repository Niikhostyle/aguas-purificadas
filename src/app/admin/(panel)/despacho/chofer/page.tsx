import Link from "next/link";
import { MapPin, MessageCircle, Phone } from "lucide-react";
import { Flash, FulfillmentBadge, ModuleDisabled } from "@/components/admin/dispatch-ui";
import { DriverLocationSharer } from "@/components/admin/driver-location-sharer";
import { OrderDispatchActions } from "@/components/admin/order-dispatch-actions";
import { prisma } from "@/lib/db";
import {
  DISPATCHABLE_PAYMENT,
  bottlesForItems,
  compareStops,
  customerWhatsappHref,
  dateFromStr,
  formatDateCl,
  mapsHref,
  shortRef,
  todayCl,
} from "@/lib/dispatch";
import { platformUrl } from "@/lib/platform-url";
import { requireTenantModule } from "@/lib/tenant-admin";
import { cn, formatClp } from "@/lib/utils";

export default async function DriverViewPage({
  searchParams,
}: {
  searchParams: Promise<{ ruta?: string; fecha?: string; ok?: string; error?: string }>;
}) {
  const { admin, tenantId, enabled } = await requireTenantModule("despacho");
  if (!enabled) return <ModuleDisabled name="Ruta de despacho" />;
  const sp = await searchParams;

  const selected = sp.ruta
    ? await prisma.deliveryRoute.findFirst({ where: { id: sp.ruta, tenantId } })
    : null;
  const fecha = selected
    ? selected.date.toISOString().slice(0, 10)
    : /^\d{4}-\d{2}-\d{2}$/.test(sp.fecha ?? "")
      ? sp.fecha!
      : todayCl();
  const day = dateFromStr(fecha);

  const routes = await prisma.deliveryRoute.findMany({
    where: { tenantId, date: day },
    orderBy: { name: "asc" },
    include: { _count: { select: { orders: true } } },
  });

  const orders = await prisma.order.findMany({
    where: {
      tenantId,
      status: { in: DISPATCHABLE_PAYMENT },
      ...(selected ? { routeId: selected.id } : { deliveryDate: day }),
    },
    include: { items: true },
    orderBy: [{ routeStop: "asc" }],
  });
  if (!selected) {
    orders.sort(
      (a, b) =>
        (a.routeId ?? "~").localeCompare(b.routeId ?? "~") ||
        (a.routeStop ?? 999) - (b.routeStop ?? 999) ||
        compareStops(a, b),
    );
  }
  const pending = orders.filter((o) => o.fulfillmentStatus !== "entregado");
  const done = orders.filter((o) => o.fulfillmentStatus === "entregado");
  const returnTo = selected
    ? `/admin/despacho/chofer?ruta=${selected.id}`
    : `/admin/despacho/chofer?fecha=${fecha}`;

  return (
    <div className="mx-auto max-w-md">
      <Link href="/admin/despacho" className="text-sm text-[var(--brand)] hover:underline">
        ← Panel
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-[var(--brand-deep)]">
        {selected ? selected.name : "Entregas del día"}
      </h1>
      <p className="text-sm text-[#5a6578]">
        {formatDateCl(fecha, "long")} · {done.length}/{orders.length} entregados
      </p>
      <Flash ok={sp.ok} error={sp.error} />
      {selected && selected.status !== "completada" ? (
        <DriverLocationSharer routeId={selected.id} routeName={selected.name} />
      ) : routes.length ? (
        <p className="mt-4 rounded-xl border border-[#d5e3ec] bg-white px-4 py-3 text-sm text-[#5a6578]">
          Elige tu ruta abajo para compartir tu ubicación en vivo con los clientes y el panel.
        </p>
      ) : null}

      <div className="-mx-1 mt-4 flex gap-2 overflow-x-auto px-1 pb-1">
        <Link
          href={`/admin/despacho/chofer?fecha=${fecha}`}
          className={cn(
            "shrink-0 rounded-full px-3 py-1.5 text-sm font-medium ring-1 ring-inset",
            !selected ? "bg-[var(--brand)] text-white ring-[var(--brand)]" : "bg-white ring-[#d5e3ec]",
          )}
        >
          Todas
        </Link>
        {routes.map((r) => (
          <Link
            key={r.id}
            href={`/admin/despacho/chofer?ruta=${r.id}`}
            className={cn(
              "shrink-0 rounded-full px-3 py-1.5 text-sm font-medium ring-1 ring-inset",
              selected?.id === r.id ? "bg-[var(--brand)] text-white ring-[var(--brand)]" : "bg-white ring-[#d5e3ec]",
            )}
          >
            {r.name} ({r._count.orders})
          </Link>
        ))}
      </div>

      <ol className="mt-4 space-y-3">
        {[...pending, ...done].map((o, i) => {
          const bottles = bottlesForItems(o.items);
          const isDone = o.fulfillmentStatus === "entregado";
          return (
            <li
              key={o.id}
              className={cn(
                "rounded-2xl border bg-white p-4 shadow-sm",
                isDone ? "border-emerald-200 opacity-70" : "border-[#d5e3ec]",
              )}
            >
              <div className="flex items-start gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[var(--brand-deep)] text-sm font-bold text-white">
                  {o.routeStop ?? i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-base font-semibold text-[var(--brand-deep)]">{o.customerName}</p>
                    <FulfillmentBadge status={o.fulfillmentStatus} />
                  </div>
                  <p className="text-[15px] text-[#1f2a3a]">{o.customerAddress}</p>
                  <p className="text-sm text-[#5a6578]">
                    {o.deliveryCommune ?? o.deliveryZoneName} · #{shortRef(o.id)}
                  </p>
                </div>
              </div>
              <ul className="mt-3 rounded-lg bg-[#f4fbfe] px-3 py-2 text-sm text-[var(--brand-deep)]">
                {o.items.map((it) => (
                  <li key={it.id}>
                    <strong>{it.quantity}×</strong> {it.productName}
                  </li>
                ))}
              </ul>
              <p
                className={cn(
                  "mt-2 rounded-lg px-3 py-1.5 text-sm font-semibold",
                  o.status === "paid" ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-900",
                )}
              >
                {o.status === "paid" ? "✓ Pagado con WebPay" : `Cobrar al entregar: ${formatClp(o.totalClp)}`}
                {bottles ? ` · retirar ${bottles} envase(s)` : ""}
              </p>
              {o.customerNotes ? <p className="mt-2 text-sm italic text-[#5a6578]">“{o.customerNotes}”</p> : null}
              <div className="mt-3 grid grid-cols-3 gap-2">
                <a href={`tel:${o.customerPhone.replace(/\s/g, "")}`} className="flex flex-col items-center gap-1 rounded-xl border border-[#d5e3ec] py-2 text-xs font-medium text-[var(--brand-deep)]">
                  <Phone className="size-5" /> Llamar
                </a>
                <a
                  href={customerWhatsappHref(o.customerPhone, `Hola ${o.customerName.split(" ")[0]}, vamos en camino con tu pedido de agua. Sigue el camión en vivo aquí: ${platformUrl(`/pedido/${o.id}`, admin.tenant.slug)}`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-1 rounded-xl border border-emerald-200 bg-emerald-50 py-2 text-xs font-medium text-emerald-800"
                >
                  <MessageCircle className="size-5" /> WhatsApp
                </a>
                <a
                  href={mapsHref(o.customerAddress, o.deliveryCommune)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-1 rounded-xl border border-[#9fdcef] bg-[#e6f7fc] py-2 text-xs font-medium text-[#007fa3]"
                >
                  <MapPin className="size-5" /> Maps
                </a>
              </div>
              {!isDone ? (
                <div className="mt-3">
                  <OrderDispatchActions orderId={o.id} status={o.fulfillmentStatus} returnTo={returnTo} bottlesExpected={bottles} size="lg" />
                </div>
              ) : (
                <p className="mt-3 text-sm text-emerald-700">
                  Entregado · {o.bottlesReturned ?? 0} de {o.bottlesDelivered ?? 0} envases devueltos
                </p>
              )}
            </li>
          );
        })}
      </ol>
      {orders.length === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed border-[#d5e3ec] bg-white px-6 py-10 text-center text-[#5a6578]">
          No hay entregas para este día.
        </p>
      ) : null}
    </div>
  );
}
