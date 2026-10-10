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
import { formatClp } from "@/lib/utils";

const statusLabel: Record<string, string> = {
  pending: "Pendiente",
  paid: "Pagado",
  failed: "Fallido",
  cancelled: "Cancelado",
};

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
      <p className="mt-2 text-sm text-[#4a655f]">
        Pedidos del tenant. En Fase 3 se conectará WebPay y los estados de pago.
      </p>

      {orders.length === 0 ? (
        <p className="mt-10 rounded-lg border border-dashed border-[#b7cdc6] bg-white px-6 py-12 text-center text-[#4a655f]">
          Aún no hay pedidos. Probá el flujo tienda → carrito → checkout.
        </p>
      ) : (
        <div className="mt-8 overflow-hidden rounded-lg border border-[#c5d8d2] bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ref.</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Zona</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Estado</TableHead>
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
                    <p className="text-xs text-[#4a655f]">
                      {order.customerPhone}
                    </p>
                  </TableCell>
                  <TableCell className="text-sm">
                    {order.deliveryZoneName ?? "—"}
                  </TableCell>
                  <TableCell>{formatClp(order.totalClp)}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {statusLabel[order.status] ?? order.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-[#4a655f]">
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
