import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { PrintButton } from "@/components/admin/client-helpers";
import { ModuleDisabled } from "@/components/admin/dispatch-ui";
import { prisma } from "@/lib/db";
import {
  DISPATCHABLE_PAYMENT,
  SLOT_LABEL,
  bottlesForItems,
  compareStops,
  dateFromStr,
  formatDateCl,
  formatDateTimeCl,
  shortRef,
  toDateStr,
  todayCl,
} from "@/lib/dispatch";
import { requireTenantModule } from "@/lib/tenant-admin";
import { formatClp } from "@/lib/utils";

type OrderRow = Prisma.OrderGetPayload<{ include: { items: true } }>;
type Sheet = {
  key: string;
  title: string;
  date: string | null;
  slot: string | null;
  driver: string | null;
  orders: OrderRow[];
};

export default async function RouteSheetPage({
  searchParams,
}: {
  searchParams: Promise<{ ruta?: string; fecha?: string }>;
}) {
  const { admin, tenantId, enabled } = await requireTenantModule("despacho");
  if (!enabled) return <ModuleDisabled name="Ruta de despacho" />;
  const sp = await searchParams;
  const sheets: Sheet[] = [];

  if (sp.ruta) {
    const route = await prisma.deliveryRoute.findFirst({
      where: { id: sp.ruta, tenantId },
      include: {
        orders: {
          where: { status: { in: DISPATCHABLE_PAYMENT } },
          include: { items: true },
          orderBy: { routeStop: "asc" },
        },
      },
    });
    if (route) {
      sheets.push({
        key: route.id,
        title: route.name,
        date: toDateStr(route.date),
        slot: route.slot,
        driver: route.driverName,
        orders: route.orders,
      });
    }
  } else {
    const fecha = /^\d{4}-\d{2}-\d{2}$/.test(sp.fecha ?? "") ? sp.fecha! : todayCl();
    const day = dateFromStr(fecha);
    const [routes, loose] = await Promise.all([
      prisma.deliveryRoute.findMany({
        where: { tenantId, date: day },
        orderBy: { name: "asc" },
        include: {
          orders: {
            where: { status: { in: DISPATCHABLE_PAYMENT } },
            include: { items: true },
            orderBy: { routeStop: "asc" },
          },
        },
      }),
      prisma.order.findMany({
        where: { tenantId, deliveryDate: day, routeId: null, status: { in: DISPATCHABLE_PAYMENT } },
        include: { items: true },
      }),
    ]);
    for (const r of routes) {
      if (r.orders.length === 0) continue;
      sheets.push({ key: r.id, title: r.name, date: fecha, slot: r.slot, driver: r.driverName, orders: r.orders });
    }
    if (loose.length) {
      sheets.push({ key: "loose", title: "Pedidos sin ruta", date: fecha, slot: null, driver: null, orders: loose.sort(compareStops) });
    }
  }

  return (
    <div className="route-sheet">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href="/admin/despacho" className="text-sm text-[var(--brand)] hover:underline">
          ← Panel de despacho
        </Link>
        <PrintButton label="Imprimir hoja de ruta" />
      </div>

      {sheets.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[#d5e3ec] bg-white px-6 py-12 text-center text-[#5a6578]">
          No hay pedidos programados para imprimir.
        </p>
      ) : null}

      {sheets.map((sheet) => {
        const bottles = sheet.orders.reduce((s, o) => s + bottlesForItems(o.items), 0);
        const toCollect = sheet.orders.filter((o) => o.status !== "paid").reduce((s, o) => s + o.totalClp, 0);
        return (
          <article
            key={sheet.key}
            className="mb-10 break-after-page rounded-xl border border-[#d5e3ec] bg-white p-6 print:mb-0 print:rounded-none print:border-0 print:p-0"
          >
            <header className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-[var(--brand-deep)] pb-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-[var(--brand)]">
                  {admin.tenant.name} · Hoja de ruta
                </p>
                <h1 className="text-2xl font-bold text-[var(--brand-deep)]">{sheet.title}</h1>
                <p className="text-sm text-[#3d4a5c]">
                  {formatDateCl(sheet.date, "long")} · {sheet.slot ? SLOT_LABEL[sheet.slot] : "Todo el día"}
                </p>
              </div>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                <dt className="text-[#5a6578]">Chofer</dt>
                <dd className="font-semibold text-[var(--brand-deep)]">{sheet.driver || "________________"}</dd>
                <dt className="text-[#5a6578]">Paradas</dt>
                <dd className="font-semibold text-[var(--brand-deep)]">{sheet.orders.length}</dd>
                <dt className="text-[#5a6578]">Bidones</dt>
                <dd className="font-semibold text-[var(--brand-deep)]">{bottles}</dd>
                <dt className="text-[#5a6578]">Por cobrar</dt>
                <dd className="font-semibold text-[var(--brand-deep)]">{formatClp(toCollect)}</dd>
              </dl>
            </header>

            <table className="mt-4 w-full border-collapse text-[13px] leading-snug">
              <thead>
                <tr className="border-b border-[#9aa7b8] text-left text-[11px] uppercase tracking-wide text-[#5a6578]">
                  <th className="py-2 pr-2">#</th>
                  <th className="py-2 pr-2">Cliente</th>
                  <th className="py-2 pr-2">Dirección</th>
                  <th className="py-2 pr-2">Productos</th>
                  <th className="py-2 pr-2">Pago</th>
                  <th className="py-2 pr-2 text-center">Envases dev.</th>
                  <th className="w-32 py-2">Firma / obs.</th>
                </tr>
              </thead>
              <tbody>
                {sheet.orders.map((o, i) => (
                  <tr key={o.id} className="break-inside-avoid border-b border-[#d5e3ec] align-top">
                    <td className="py-2 pr-2 font-bold text-[var(--brand-deep)]">{o.routeStop ?? i + 1}</td>
                    <td className="py-2 pr-2">
                      <p className="font-semibold">{o.customerName}</p>
                      <p className="text-[#3d4a5c]">{o.customerPhone}</p>
                      <p className="font-mono text-[10px] text-[#8a95a6]">#{shortRef(o.id)}</p>
                    </td>
                    <td className="py-2 pr-2">
                      <p>{o.customerAddress}</p>
                      <p className="text-[#3d4a5c]">{o.deliveryCommune ?? o.deliveryZoneName}</p>
                      {o.customerNotes ? <p className="text-[11px] italic text-[#5a6578]">{o.customerNotes}</p> : null}
                    </td>
                    <td className="py-2 pr-2">
                      {o.items.map((it) => (
                        <p key={it.id}>
                          {it.quantity}× {it.productName}
                        </p>
                      ))}
                    </td>
                    <td className="py-2 pr-2">
                      {o.status === "paid" ? (
                        <span className="font-semibold text-emerald-700">Pagado</span>
                      ) : (
                        <span className="font-semibold text-amber-700">Cobrar {formatClp(o.totalClp)}</span>
                      )}
                      {o.fulfillmentStatus === "entregado" ? (
                        <p className="text-[11px] text-emerald-700">Entregado {formatDateTimeCl(o.deliveredAt)}</p>
                      ) : null}
                    </td>
                    <td className="py-2 pr-2 text-center">
                      {o.fulfillmentStatus === "entregado" ? o.bottlesReturned ?? 0 : "____"}
                      <p className="text-[10px] text-[#8a95a6]">de {bottlesForItems(o.items)}</p>
                    </td>
                    <td className="py-2" />
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-3 text-[10px] text-[#8a95a6]">
              Orden de paradas por comuna/sector y dirección (no es optimización de recorrido). Impreso {formatDateTimeCl(new Date())}.
            </p>
          </article>
        );
      })}
    </div>
  );
}
