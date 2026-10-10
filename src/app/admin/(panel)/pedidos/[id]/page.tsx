import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ORDER_STATUS_LABEL } from "@/lib/order-status";
import { formatClp } from "@/lib/utils";

type Props = { params: Promise<{ id: string }> };

export default async function AdminOrderDetailPage({ params }: Props) {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin/login");

  const { id } = await params;
  const order = await prisma.order.findFirst({
    where: { id, tenantId: admin.tenantId },
    include: { items: true },
  });
  if (!order) notFound();

  return (
    <div className="max-w-2xl">
      <Link
        href="/admin/pedidos"
        className="text-sm text-[var(--brand)] hover:underline"
      >
        ← Pedidos
      </Link>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--brand-deep)]">
          Pedido {order.id.slice(-8).toUpperCase()}
        </h1>
        <Badge variant={order.status === "paid" ? "default" : "secondary"}>
          {ORDER_STATUS_LABEL[order.status] ?? order.status}
        </Badge>
      </div>
      <p className="mt-2 text-sm text-[#4a655f]">
        {order.createdAt.toLocaleString("es-CL", {
          dateStyle: "long",
          timeStyle: "short",
        })}
        {order.paidAt
          ? ` · pagado ${order.paidAt.toLocaleString("es-CL", {
              dateStyle: "short",
              timeStyle: "short",
            })}`
          : ""}
      </p>

      <dl className="mt-8 grid gap-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-[#4a655f]">Cliente</dt>
          <dd className="mt-1 text-[var(--brand-deep)]">
            {order.customerName}
            <br />
            {order.customerPhone}
          </dd>
        </div>
        <div>
          <dt className="text-[#4a655f]">Entrega</dt>
          <dd className="mt-1 text-[var(--brand-deep)]">
            {order.customerAddress}
            <br />
            {order.deliveryZoneName}
          </dd>
        </div>
        <div className="sm:col-span-2 rounded-md border border-[#c5d8d2] bg-white p-4">
          <dt className="text-[#4a655f]">Pago WebPay</dt>
          <dd className="mt-2 grid gap-1 text-[var(--brand-deep)] sm:grid-cols-2">
            <span>Estado: {ORDER_STATUS_LABEL[order.status] ?? order.status}</span>
            <span>Proveedor: {order.paymentProvider ?? "—"}</span>
            <span>WebPay status: {order.webpayStatus ?? "—"}</span>
            <span>Buy order: {order.buyOrder ?? "—"}</span>
            <span>Auth: {order.webpayAuthorizationCode ?? "—"}</span>
            <span>Resp. code: {order.webpayResponseCode ?? "—"}</span>
            <span>Tipo: {order.webpayPaymentTypeCode ?? "—"}</span>
            <span>
              Tarjeta:{" "}
              {order.webpayCardLast4 ? `****${order.webpayCardLast4}` : "—"}
            </span>
          </dd>
        </div>
        {order.customerNotes ? (
          <div className="sm:col-span-2">
            <dt className="text-[#4a655f]">Notas</dt>
            <dd className="mt-1 text-[var(--brand-deep)]">
              {order.customerNotes}
            </dd>
          </div>
        ) : null}
      </dl>

      <ul className="mt-8 space-y-2 border-t border-[#c5d8d2] pt-6 text-sm">
        {order.items.map((item) => (
          <li key={item.id} className="flex justify-between gap-4">
            <span>
              {item.productName} × {item.quantity}
            </span>
            <span>{formatClp(item.lineTotalClp)}</span>
          </li>
        ))}
      </ul>
      <div className="mt-4 space-y-1 border-t border-[#c5d8d2] pt-4 text-sm">
        <div className="flex justify-between text-[#4a655f]">
          <span>Subtotal</span>
          <span>{formatClp(order.subtotalClp)}</span>
        </div>
        <div className="flex justify-between text-[#4a655f]">
          <span>Despacho</span>
          <span>
            {order.shippingClp === 0 ? "Gratis" : formatClp(order.shippingClp)}
          </span>
        </div>
        <div className="flex justify-between pt-2 font-medium text-[var(--brand-deep)]">
          <span>Total</span>
          <span>{formatClp(order.totalClp)}</span>
        </div>
      </div>
    </div>
  );
}
