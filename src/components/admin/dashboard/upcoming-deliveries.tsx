import Link from "next/link";
import { CalendarCheck, Eye, MapPin, MessageCircle } from "lucide-react";
import { FulfillmentBadge, PaymentBadge, btn } from "@/components/admin/dispatch-ui";
import { FocusOnMapButton } from "@/components/admin/map/dispatch-map-lazy";
import { OrderDispatchActions } from "@/components/admin/order-dispatch-actions";
import { EmptyState } from "@/components/admin/ui";
import { customerWhatsappHref, formatDateCl, shortRef } from "@/lib/dispatch";
import { cn, formatClp } from "@/lib/utils";

export type UpcomingRow = {
  id: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  deliveryCommune: string | null;
  fulfillmentStatus: string;
  status: string;
  paymentProvider: string | null;
  totalClp: number;
  deliveryDate: string | null;
  deliverySlot: string | null;
  routeName: string | null;
  routeStop: number | null;
  bottles: number;
  located: boolean;
};

function RouteCell({ r }: { r: UpcomingRow }) {
  if (!r.routeName) return <span className="text-xs text-amber-700">Sin ruta</span>;
  return (
    <span className="flex items-center gap-2">
      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[var(--brand-deep)] text-[11px] font-bold text-white">
        {r.routeStop ?? "·"}
      </span>
      <span className="truncate text-xs font-medium text-[#12233d]">{r.routeName}</span>
    </span>
  );
}

function When({ r, today }: { r: UpcomingRow; today: string }) {
  const day = r.deliveryDate === today ? "Hoy" : formatDateCl(r.deliveryDate);
  return (
    <span className="text-xs text-[#5a6578]">
      {day}
      {r.deliverySlot ? ` · ${r.deliverySlot === "manana" ? "AM" : "PM"}` : ""}
    </span>
  );
}

function Actions({ r, dispatchEnabled }: { r: UpcomingRow; dispatchEnabled: boolean }) {
  const ghost = cn(btn.ghost, "ring-1 ring-[#d5e3ec]");
  return (
    <div className="flex flex-wrap items-center gap-1.5 md:justify-end">
      {r.located ? (
        <FocusOnMapButton orderId={r.id} className={ghost}>
          <MapPin className="size-3.5" />
          <span className="sr-only">Ver {r.customerName} en el mapa</span>
        </FocusOnMapButton>
      ) : null}
      <a
        href={customerWhatsappHref(r.customerPhone, `Hola ${r.customerName.split(" ")[0]}, te escribimos por tu pedido de agua #${shortRef(r.id)}.`)}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(ghost, "text-emerald-700")}
        title="WhatsApp"
      >
        <MessageCircle className="size-3.5" />
        <span className="sr-only">WhatsApp a {r.customerName}</span>
      </a>
      <Link href={`/admin/pedidos/${r.id}`} className={ghost} title="Ver pedido">
        <Eye className="size-3.5" />
        <span className="sr-only">Ver pedido de {r.customerName}</span>
      </Link>
      {dispatchEnabled ? (
        <OrderDispatchActions orderId={r.id} status={r.fulfillmentStatus} returnTo="/admin/" bottlesExpected={r.bottles} />
      ) : null}
    </div>
  );
}

export function UpcomingDeliveries({
  rows,
  total,
  today,
  dispatchEnabled,
}: {
  rows: UpcomingRow[];
  total: number;
  today: string;
  dispatchEnabled: boolean;
}) {
  return (
    <section aria-labelledby="upcoming-title" className="overflow-visible rounded-xl border border-[#dde7ee] bg-white shadow-[0_1px_2px_rgba(16,40,70,0.04)]">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e8f0f5] px-5 py-3.5">
        <h2 id="upcoming-title" className="text-[15px] font-semibold text-[#12233d]">
          Próximas entregas <span className="font-normal text-[#5a6578]">({total} pendientes)</span>
        </h2>
        {dispatchEnabled ? (
          <Link href="/admin/despacho?fecha=todas" className="text-sm font-medium text-[var(--brand)] hover:underline">
            Ver todas
          </Link>
        ) : null}
      </header>

      {rows.length === 0 ? (
        <EmptyState
          compact
          icon={<CalendarCheck />}
          title="Sin entregas pendientes"
          description="Todo lo programado ya fue entregado. Los pedidos nuevos aparecerán aquí."
        />
      ) : (
        <>
          <table className="hidden w-full text-sm md:table">
            <caption className="sr-only">Próximas entregas</caption>
            <thead>
              <tr className="border-b border-[#e8f0f5] bg-[#fafcfd] text-left text-[11px] font-semibold uppercase tracking-wide text-[#5a6578]">
                <th scope="col" className="px-5 py-2.5">Ruta</th>
                <th scope="col" className="px-3 py-2.5">Cliente</th>
                <th scope="col" className="px-3 py-2.5">Estado</th>
                <th scope="col" className="px-3 py-2.5">Pago</th>
                <th scope="col" className="px-3 py-2.5">Entrega</th>
                <th scope="col" className="px-5 py-2.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eef3f7]">
              {rows.map((r) => (
                <tr key={r.id} className="align-middle hover:bg-[#fafdfe]">
                  <td className="max-w-44 px-5 py-2.5">
                    <RouteCell r={r} />
                  </td>
                  <td className="max-w-64 px-3 py-2.5">
                    <Link href={`/admin/pedidos/${r.id}`} className="font-medium text-[var(--brand-deep)] hover:text-[var(--brand)]">
                      {r.customerName}
                    </Link>
                    <span className="block truncate text-xs text-[#5a6578]">
                      {r.customerAddress}
                      {r.deliveryCommune ? `, ${r.deliveryCommune}` : ""}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <FulfillmentBadge status={r.fulfillmentStatus} />
                  </td>
                  <td className="px-3 py-2.5">
                    <PaymentBadge status={r.status} />
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5">
                    <When r={r} today={today} />
                    <span className="block text-xs text-[#7b8aa0]">
                      {formatClp(r.totalClp)}
                      {r.bottles ? ` · ${r.bottles} bid.` : ""}
                    </span>
                  </td>
                  <td className="px-5 py-2.5">
                    <Actions r={r} dispatchEnabled={dispatchEnabled} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <ul className="divide-y divide-[#eef3f7] md:hidden">
            {rows.map((r) => (
              <li key={r.id} className="space-y-2 px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link href={`/admin/pedidos/${r.id}`} className="font-medium text-[var(--brand-deep)]">
                      {r.customerName}
                    </Link>
                    <p className="truncate text-xs text-[#5a6578]">
                      {r.customerAddress}
                      {r.deliveryCommune ? `, ${r.deliveryCommune}` : ""}
                    </p>
                  </div>
                  <When r={r} today={today} />
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <RouteCell r={r} />
                  <FulfillmentBadge status={r.fulfillmentStatus} />
                  <PaymentBadge status={r.status} />
                </div>
                <Actions r={r} dispatchEnabled={dispatchEnabled} />
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
