import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { MapPin, MessageCircle, Phone } from "lucide-react";
import { Flash, FulfillmentBadge, PaymentBadge, btn } from "@/components/admin/dispatch-ui";
import { OrderDispatchActions } from "@/components/admin/order-dispatch-actions";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  FULFILLMENT_LABEL,
  SLOT_LABEL,
  bottlesForItems,
  customerWhatsappHref,
  formatDateCl,
  formatDateTimeCl,
  mapsHref,
  shortRef,
  toDateStr,
} from "@/lib/dispatch";
import { ORDER_STATUS_LABEL } from "@/lib/order-status";
import { parseModuleFlags } from "@/lib/modules";
import { formatClp } from "@/lib/utils";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; error?: string }>;
};

export default async function AdminOrderDetailPage({ params, searchParams }: Props) {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin/login");
  const flags = parseModuleFlags(admin.tenant.modulesEnabled);

  const { id } = await params;
  const sp = await searchParams;
  const order = await prisma.order.findFirst({
    where: { id, tenantId: admin.tenantId },
    include: {
      items: true,
      route: true,
      events: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!order) notFound();
  const bottles = bottlesForItems(order.items);
  const dispatchable = order.status === "paid" || order.status === "pending";

  const timeline = [
    { label: "Pedido creado", at: order.createdAt },
    { label: "Pago confirmado", at: order.paidAt },
    { label: "Programado", at: order.scheduledAt },
    { label: "En ruta", at: order.outForDeliveryAt },
    { label: "Entregado", at: order.deliveredAt },
  ];

  return (
    <div className="max-w-4xl">
      <Link href="/admin/pedidos" className="text-sm text-[var(--brand)] hover:underline">
        ← Pedidos
      </Link>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--brand-deep)]">
          Pedido #{shortRef(order.id)}
        </h1>
        <PaymentBadge status={order.status} provider={order.paymentProvider} />
        <FulfillmentBadge status={order.fulfillmentStatus} />
      </div>
      <p className="mt-1 text-sm text-[#5a6578]">Creado {formatDateTimeCl(order.createdAt)}</p>
      <Flash ok={sp.ok} error={sp.error} />

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <section className="rounded-xl border border-[#d5e3ec] bg-white p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[#5a6578]">Cliente y entrega</h2>
            <p className="mt-2 text-lg font-semibold text-[var(--brand-deep)]">{order.customerName}</p>
            <p className="text-sm text-[#3d4a5c]">{order.customerPhone}</p>
            <p className="mt-2 text-sm text-[#3d4a5c]">
              {order.customerAddress}
              {order.deliveryCommune ? `, ${order.deliveryCommune}` : ""}
            </p>
            <p className="text-sm text-[#5a6578]">Sector: {order.deliveryZoneName ?? "—"}</p>
            {order.customerNotes ? (
              <p className="mt-2 rounded-lg bg-[#f4fbfe] px-3 py-2 text-sm italic text-[#3d4a5c]">“{order.customerNotes}”</p>
            ) : null}
            <div className="mt-3 flex flex-wrap gap-2">
              <a href={`tel:${order.customerPhone.replace(/\s/g, "")}`} className={btn.outline}>
                <Phone className="size-4" /> Llamar
              </a>
              <a href={customerWhatsappHref(order.customerPhone, `Hola ${order.customerName.split(" ")[0]}, te escribimos por tu pedido #${shortRef(order.id)}.`)} target="_blank" rel="noopener noreferrer" className={btn.outline}>
                <MessageCircle className="size-4 text-emerald-600" /> WhatsApp
              </a>
              <a href={mapsHref(order.customerAddress, order.deliveryCommune)} target="_blank" rel="noopener noreferrer" className={btn.outline}>
                <MapPin className="size-4 text-[var(--brand)]" /> Google Maps
              </a>
            </div>
          </section>

          <section className="rounded-xl border border-[#d5e3ec] bg-white p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[#5a6578]">Productos</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {order.items.map((item) => (
                <li key={item.id} className="flex justify-between gap-4">
                  <span>
                    {item.productName} × {item.quantity}
                  </span>
                  <span className="tabular-nums">{formatClp(item.lineTotalClp)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 space-y-1 border-t border-[#e8f0f5] pt-3 text-sm">
              <div className="flex justify-between text-[#5a6578]">
                <span>Subtotal</span>
                <span>{formatClp(order.subtotalClp)}</span>
              </div>
              {order.discountClp > 0 ? (
                <div className="flex justify-between text-emerald-700">
                  <span>Descuento{order.couponCode ? ` (cupón ${order.couponCode})` : ""}</span>
                  <span>−{formatClp(order.discountClp)}</span>
                </div>
              ) : null}
              {order.discountLabel ? (
                <p className="text-xs text-[#5a6578]">Descuentos aplicados: {order.discountLabel}</p>
              ) : null}
              <div className="flex justify-between text-[#5a6578]">
                <span>Despacho</span>
                <span>{order.shippingClp === 0 ? "Gratis" : formatClp(order.shippingClp)}</span>
              </div>
              <div className="flex justify-between pt-1 font-semibold text-[var(--brand-deep)]">
                <span>Total</span>
                <span>{formatClp(order.totalClp)}</span>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-[#d5e3ec] bg-white p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[#5a6578]">Pago WebPay</h2>
            <dl className="mt-3 grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
              {[
                ["Estado", ORDER_STATUS_LABEL[order.status] ?? order.status],
                ["Proveedor", order.paymentProvider ?? "—"],
                ["WebPay status", order.webpayStatus ?? "—"],
                ["Buy order", order.buyOrder ?? "—"],
                ["Autorización", order.webpayAuthorizationCode ?? "—"],
                ["Código respuesta", order.webpayResponseCode ?? "—"],
                ["Tipo de pago", order.webpayPaymentTypeCode ?? "—"],
                ["Tarjeta", order.webpayCardLast4 ? `**** ${order.webpayCardLast4}` : "—"],
                ["Pagado", formatDateTimeCl(order.paidAt)],
              ].map(([k, v]) => (
                <div key={String(k)} className="flex justify-between gap-3 border-b border-dashed border-[#eef3f7] py-1">
                  <dt className="text-[#5a6578]">{k}</dt>
                  <dd className="text-right font-medium text-[var(--brand-deep)]">{String(v)}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-xl border border-[#d5e3ec] bg-white p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[#5a6578]">Despacho</h2>
            <dl className="mt-3 space-y-1 text-sm">
              <div className="flex justify-between"><dt className="text-[#5a6578]">Estado</dt><dd>{FULFILLMENT_LABEL[order.fulfillmentStatus]}</dd></div>
              <div className="flex justify-between"><dt className="text-[#5a6578]">Día</dt><dd>{formatDateCl(toDateStr(order.deliveryDate))}</dd></div>
              <div className="flex justify-between"><dt className="text-[#5a6578]">Bloque</dt><dd>{order.deliverySlot ? SLOT_LABEL[order.deliverySlot] : "—"}</dd></div>
              <div className="flex justify-between">
                <dt className="text-[#5a6578]">Ruta</dt>
                <dd>
                  {order.route ? (
                    <Link href={`/admin/despacho/hoja?ruta=${order.route.id}`} className="text-[var(--brand)] hover:underline">
                      {order.route.name} · parada {order.routeStop ?? "—"}
                    </Link>
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
              <div className="flex justify-between"><dt className="text-[#5a6578]">Envases</dt><dd>{order.fulfillmentStatus === "entregado" ? `${order.bottlesDelivered ?? 0} entregados · ${order.bottlesReturned ?? 0} devueltos` : `${bottles} a entregar`}</dd></div>
            </dl>
            {order.dispatchNotes ? (
              <p className="mt-3 whitespace-pre-line rounded-lg bg-[#f4fbfe] px-3 py-2 text-xs text-[#3d4a5c]">{order.dispatchNotes}</p>
            ) : null}
            {flags.despacho && dispatchable ? (
              <div className="mt-4">
                <OrderDispatchActions orderId={order.id} status={order.fulfillmentStatus} returnTo={`/admin/pedidos/${order.id}`} bottlesExpected={bottles} size="lg" />
                <Link href={`/admin/despacho?fecha=${toDateStr(order.deliveryDate) ?? "sin-fecha"}`} className="mt-2 block text-center text-xs text-[var(--brand)] hover:underline">
                  Asignar ruta y día en el panel de despacho →
                </Link>
              </div>
            ) : null}
          </section>

          <section className="rounded-xl border border-[#d5e3ec] bg-white p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[#5a6578]">Línea de tiempo</h2>
            <ol className="mt-3 space-y-2">
              {timeline.map((t) => (
                <li key={t.label} className="flex items-center gap-3 text-sm">
                  <span className={`size-2.5 rounded-full ${t.at ? "bg-[var(--brand)]" : "bg-[#d5e3ec]"}`} />
                  <span className={t.at ? "text-[var(--brand-deep)]" : "text-[#8a95a6]"}>{t.label}</span>
                  <span className="ml-auto text-xs text-[#5a6578]">{t.at ? formatDateTimeCl(t.at) : "—"}</span>
                </li>
              ))}
            </ol>
            {order.events.length ? (
              <>
                <h3 className="mt-5 text-xs font-semibold uppercase tracking-wide text-[#5a6578]">Auditoría</h3>
                <ul className="mt-2 space-y-2 text-xs">
                  {order.events.map((e) => (
                    <li key={e.id} className="rounded-lg border border-[#eef3f7] px-3 py-2">
                      <p className="font-medium text-[var(--brand-deep)]">
                        {FULFILLMENT_LABEL[e.fromStatus ?? ""] ?? e.fromStatus ?? "—"} → {FULFILLMENT_LABEL[e.toStatus ?? ""] ?? e.toStatus}
                      </p>
                      {e.note ? <p className="text-[#3d4a5c]">{e.note}</p> : null}
                      <p className="text-[#8a95a6]">
                        {formatDateTimeCl(e.createdAt)} · {e.actorEmail ?? "sistema"}
                      </p>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
          </section>
        </aside>
      </div>
    </div>
  );
}
