import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ORDER_STATUS_LABEL } from "@/lib/order-status";
import { formatClp } from "@/lib/utils";

export default async function AdminOrdersPage() {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin/login");

  const orders = await prisma.order.findMany({
    where: { tenantId: admin.tenantId },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--brand-deep)]">
        Pedidos
      </h1>
      <p className="mt-2 text-sm text-[#5a6578]">
        Incluye estado de pago WebPay (sandbox o mock).
      </p>

      {orders.length === 0 ? (
        <p className="mt-10 rounded-lg border border-dashed border-[#d5e3ec] bg-white px-6 py-12 text-center text-[#5a6578]">
          Aún no hay pedidos. Probá el flujo tienda → carrito → checkout →
          WebPay.
        </p>
      ) : (
        <div className="mt-8 overflow-hidden rounded-lg border border-[#d5e3ec] bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ref.</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Pago</TableHead>
                <TableHead>WebPay</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead className="text-right">Detalle</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-xs">
                    {order.id.slice(-8).toUpperCase()}
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">{order.customerName}</p>
                    <p className="text-xs text-[#5a6578]">
                      {order.customerPhone}
                    </p>
                  </TableCell>
                  <TableCell>{formatClp(order.totalClp)}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        order.status === "paid" ? "default" : "secondary"
                      }
                    >
                      {ORDER_STATUS_LABEL[order.status] ?? order.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-[#5a6578]">
                    {order.webpayStatus ?? "—"}
                    {order.paymentProvider ? (
                      <span className="block">{order.paymentProvider}</span>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-sm text-[#5a6578]">
                    {order.createdAt.toLocaleString("es-CL", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={`/admin/pedidos/${order.id}`}
                      className="text-sm text-[var(--brand)] hover:underline"
                    >
                      Ver
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
