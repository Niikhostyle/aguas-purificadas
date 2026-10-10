import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireTenant } from "@/lib/tenant";
import { formatClp } from "@/lib/utils";

type Props = { params: Promise<{ id: string }> };

export const metadata: Metadata = { title: "Pedido recibido" };

export default async function OrderConfirmationPage({ params }: Props) {
  const { id } = await params;
  const tenant = await requireTenant();
  const order = await prisma.order.findFirst({
    where: { id, tenantId: tenant.id },
    include: { items: true },
  });
  if (!order) notFound();

  return (
    <div className="bg-[linear-gradient(180deg,#e8f4f1_0%,#f3f7f6_50%)]">
      <div className="mx-auto max-w-2xl px-5 pb-20 pt-12 md:px-8">
        <p className="text-sm font-medium uppercase tracking-wide text-[var(--brand)]">
          Pedido pendiente
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl text-[var(--brand-deep)]">
          Recibimos tu pedido
        </h1>
        <p className="mt-3 text-[#4a655f]">
          {tenant.name} coordinará la entrega. El pago online (WebPay) se
          habilitará en la siguiente fase.
        </p>

        <dl className="mt-10 space-y-4 border-y border-[#c5d8d2] py-8 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-[#4a655f]">Referencia</dt>
            <dd className="font-mono text-[var(--brand-deep)]">
              {order.id.slice(-8).toUpperCase()}
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

        <Link
          href="/productos"
          className="mt-10 inline-flex rounded-md bg-[var(--brand)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[var(--brand-deep)]"
        >
          Seguir comprando
        </Link>
      </div>
    </div>
  );
}
