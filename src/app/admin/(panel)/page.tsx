import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";

export default async function AdminHomePage() {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin/login");

  const [productCount, zoneCount, activeCount, orderCount, pendingCount] =
    await Promise.all([
      prisma.product.count({ where: { tenantId: admin.tenantId } }),
      prisma.deliveryZone.count({ where: { tenantId: admin.tenantId } }),
      prisma.product.count({
        where: { tenantId: admin.tenantId, active: true },
      }),
      prisma.order.count({ where: { tenantId: admin.tenantId } }),
      prisma.order.count({
        where: { tenantId: admin.tenantId, status: "pending" },
      }),
    ]);

  return (
    <div>
      <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--brand-deep)]">
        Resumen
      </h1>
      <p className="mt-2 text-[#4a655f]">
        Panel de {admin.tenant.name}. Catálogo, carrito y pedidos pending listos;
        WebPay en Fase 3.
      </p>

      <dl className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-[#c5d8d2] bg-white p-5">
          <dt className="text-sm text-[#4a655f]">Productos</dt>
          <dd className="mt-1 font-[family-name:var(--font-display)] text-3xl text-[var(--brand-deep)]">
            {productCount}
          </dd>
          <p className="mt-1 text-xs text-[#4a655f]">{activeCount} activos</p>
        </div>
        <div className="rounded-lg border border-[#c5d8d2] bg-white p-5">
          <dt className="text-sm text-[#4a655f]">Zonas</dt>
          <dd className="mt-1 font-[family-name:var(--font-display)] text-3xl text-[var(--brand-deep)]">
            {zoneCount}
          </dd>
        </div>
        <div className="rounded-lg border border-[#c5d8d2] bg-white p-5">
          <dt className="text-sm text-[#4a655f]">Pedidos</dt>
          <dd className="mt-1 font-[family-name:var(--font-display)] text-3xl text-[var(--brand-deep)]">
            {orderCount}
          </dd>
          <p className="mt-1 text-xs text-[#4a655f]">
            {pendingCount} pendientes
          </p>
        </div>
        <div className="rounded-lg border border-[#c5d8d2] bg-white p-5">
          <dt className="text-sm text-[#4a655f]">Slug tenant</dt>
          <dd className="mt-1 font-[family-name:var(--font-display)] text-2xl text-[var(--brand-deep)]">
            {admin.tenant.slug}
          </dd>
        </div>
      </dl>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/admin/pedidos"
          className="inline-flex rounded-md bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--brand-deep)]"
        >
          Ver pedidos
        </Link>
        <Link
          href="/admin/productos"
          className="inline-flex rounded-md border border-[#c5d8d2] bg-white px-4 py-2 text-sm font-medium text-[var(--brand-deep)]"
        >
          Productos
        </Link>
      </div>
    </div>
  );
}
