import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { retryPaymentAction } from "@/app/(storefront)/pedido/actions";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db";
import { requireTenant } from "@/lib/tenant";
import { formatClp } from "@/lib/utils";
import { tenantWhatsappHref } from "@/lib/whatsapp";

type Props = { params: Promise<{ id: string }> };

export const metadata: Metadata = { title: "Pedido" };

const statusCopy: Record<
  string,
  { eyebrow: string; title: string; body: string }
> = {
  pending: {
    eyebrow: "Pago pendiente",
    title: "Tu pedido está listo para pagar",
    body: "Si cerraste WebPay sin terminar, podés reintentar el pago.",
  },
  paid: {
    eyebrow: "Pago confirmado",
    title: "¡Gracias! Tu pedido está pagado",
    body: "La empresa coordinará la entrega con los datos que indicaste.",
  },
  failed: {
    eyebrow: "Pago rechazado",
    title: "No se pudo completar el pago",
    body: "Podés reintentar con otra tarjeta o contactar a la empresa.",
  },
  cancelled: {
    eyebrow: "Pago anulado",
    title: "Cancelaste el pago en WebPay",
    body: "El pedido quedó anulado. Si fue un error, generá un pedido nuevo desde el carrito.",
  },
};

export default async function OrderConfirmationPage({ params }: Props) {
  const { id } = await params;
  const tenant = await requireTenant();
  const order = await prisma.order.findFirst({
    where: { id, tenantId: tenant.id },
    include: { items: true },
  });
  if (!order) notFound();

  const copy = statusCopy[order.status] ?? statusCopy.pending;
  const canRetry = order.status === "pending" || order.status === "failed";
  const whatsapp = tenantWhatsappHref(
    tenant.whatsapp,
    `Hola ${tenant.name}, te escribo por mi pedido ${order.id.slice(-8).toUpperCase()}.`,
  );

  return (
    <div className="bg-[linear-gradient(180deg,var(--mist)_0%,#fff_420px)]">
      <div className="mx-auto max-w-2xl px-5 pb-20 pt-12 md:px-8">
        <p className="sf-eyebrow">
          {copy.eyebrow}
        </p>
        <h1 className="rc-display mt-3 text-4xl uppercase text-[var(--brand-deep)] md:text-5xl">
          {copy.title}
        </h1>
        <p className="mt-3 text-[#5a6578]">{copy.body}</p>

        <div className="sf-enter sf-card mt-10 p-6">
          <dl className="space-y-4 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-[#5a6578]">Referencia</dt>
              <dd className="font-mono text-[var(--brand-deep)]">
                {order.id.slice(-8).toUpperCase()}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[#5a6578]">Estado de pago</dt>
              <dd className="text-[var(--brand-deep)]">
                {order.status}
                {order.webpayStatus ? (
                  <span className="block text-xs text-[#5a6578]">
                    WebPay: {order.webpayStatus}
                    {order.webpayAuthorizationCode
                      ? ` · auth ${order.webpayAuthorizationCode}`
                      : ""}
                    {order.paymentProvider
                      ? ` · ${order.paymentProvider}`
                      : ""}
                  </span>
                ) : null}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[#5a6578]">Cliente</dt>
              <dd className="text-right text-[var(--brand-deep)]">
                {order.customerName}
                <br />
                {order.customerPhone}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[#5a6578]">Entrega</dt>
              <dd className="text-right text-[var(--brand-deep)]">
                {order.customerAddress}
                <br />
                {order.deliveryZoneName}
              </dd>
            </div>
          </dl>

          <ul className="mt-6 space-y-2 border-t border-[var(--sf-line)] pt-6 text-sm">
            {order.items.map((item) => (
              <li key={item.id} className="flex justify-between gap-4">
                <span>
                  {item.productName} × {item.quantity}
                </span>
                <span>{formatClp(item.lineTotalClp)}</span>
              </li>
            ))}
          </ul>

          <div className="mt-6 space-y-1 border-t border-dashed border-[var(--sf-line-strong)] pt-4 text-sm">
            <div className="flex justify-between text-[#5a6578]">
              <span>Subtotal</span>
              <span>{formatClp(order.subtotalClp)}</span>
            </div>
            <div className="flex justify-between text-[#5a6578]">
              <span>Despacho</span>
              <span>
                {order.shippingClp === 0
                  ? "Gratis"
                  : formatClp(order.shippingClp)}
              </span>
            </div>
            <div className="flex justify-between pt-2 text-base font-medium text-[var(--brand-deep)]">
              <span>Total</span>
              <span>{formatClp(order.totalClp)}</span>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          {canRetry ? (
            <form action={retryPaymentAction}>
              <input type="hidden" name="orderId" value={order.id} />
              <Button type="submit" className="h-10 px-5 font-semibold">Reintentar pago</Button>
            </form>
          ) : null}
          <Link
            href="/productos"
            className="inline-flex h-10 items-center rounded-full border border-[var(--sf-line-strong)] bg-white px-5 text-sm font-semibold text-[var(--brand-deep)] transition hover:border-[var(--brand)] hover:text-[var(--brand)]"
          >
            Seguir comprando
          </Link>
          {whatsapp ? (
            <a
              href={whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 items-center rounded-full bg-[#25D366] px-5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#1ebe5b]"
            >
              Consultar por WhatsApp
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}
