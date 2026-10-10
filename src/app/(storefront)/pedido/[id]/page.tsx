import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { retryPaymentAction } from "@/app/(storefront)/pedido/actions";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db";
import { requireTenant } from "@/lib/tenant";
import { formatClp } from "@/lib/utils";

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

  return (
    <div className="bg-[linear-gradient(180deg,#e8f4f1_0%,#f3f7f6_50%)]">
      <div className="mx-auto max-w-2xl px-5 pb-20 pt-12 md:px-8">
        <p className="text-sm font-medium uppercase tracking-wide text-[var(--brand)]">
          {copy.eyebrow}
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl text-[var(--brand-deep)]">
          {copy.title}
        </h1>
        <p className="mt-3 text-[#4a655f]">{copy.body}</p>

        <dl className="mt-10 space-y-4 border-y border-[#c5d8d2] py-8 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-[#4a655f]">Referencia</dt>
            <dd className="font-mono text-[var(--brand-deep)]">
              {order.id.slice(-8).toUpperCase()}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-[#4a655f]">Estado de pago</dt>
            <dd className="text-[var(--brand-deep)]">
              {order.status}
              {order.webpayStatus ? (
                <span className="block text-xs text-[#4a655f]">
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
            <dt className="text-[#4a655f]">Cliente</dt>
            <dd className="text-right text-[var(--brand-deep)]">
              {order.customerName}
              <br />
              {order.customerPhone}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-[#4a655f]">Entrega</dt>
            <dd className="text-right text-[var(--brand-deep)]">
              {order.customerAddress}
              <br />
              {order.deliveryZoneName}
            </dd>
          </div>
        </dl>

        <ul className="mt-6 space-y-2 text-sm">
          {order.items.map((item) => (
            <li key={item.id} className="flex justify-between gap-4">
              <span>
                {item.productName} × {item.quantity}
              </span>
              <span>{formatClp(item.lineTotalClp)}</span>
            </li>
          ))}
        </ul>

        <div className="mt-6 space-y-1 border-t border-[#c5d8d2] pt-4 text-sm">
          <div className="flex justify-between text-[#4a655f]">
            <span>Subtotal</span>
            <span>{formatClp(order.subtotalClp)}</span>
          </div>
          <div className="flex justify-between text-[#4a655f]">
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

        <div className="mt-10 flex flex-wrap gap-3">
          {canRetry ? (
            <form action={retryPaymentAction}>
              <input type="hidden" name="orderId" value={order.id} />
              <Button type="submit">Reintentar pago</Button>
            </form>
          ) : null}
          <Link
            href="/productos"
            className="inline-flex h-8 items-center rounded-md border border-[#c5d8d2] bg-white px-4 text-sm font-medium text-[var(--brand-deep)]"
          >
            Seguir comprando
          </Link>
        </div>
      </div>
    </div>
  );
}
