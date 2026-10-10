import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";

export default async function AdminHomePage() {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin/login");

  const [productCount, zoneCount, activeCount] = await Promise.all([
    prisma.product.count({ where: { tenantId: admin.tenantId } }),
    prisma.deliveryZone.count({ where: { tenantId: admin.tenantId } }),
    prisma.product.count({
      where: { tenantId: admin.tenantId, active: true },
    }),
  ]);

  return (
    <div>
      <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--brand-deep)]">
        Resumen
      </h1>
      <p className="mt-2 text-[#4a655f]">
        Panel operativo de {admin.tenant.name}. Fase 1: productos y branding
        seed; carrito/WebPay en fases siguientes.
      </p>

      <dl className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-[#c5d8d2] bg-white p-5">
          <dt className="text-sm text-[#4a655f]">Productos</dt>
          <dd className="mt-1 font-[family-name:var(--font-display)] text-3xl text-[var(--brand-deep)]">
            {productCount}
          </dd>
          <p className="mt-1 text-xs text-[#4a655f]">{activeCount} activos</p>
        </div>
        <div className="rounded-lg border border-[#c5d8d2] bg-white p-5">
          <dt className="text-sm text-[#4a655f]">Zonas de despacho</dt>
          <dd className="mt-1 font-[family-name:var(--font-display)] text-3xl text-[var(--brand-deep)]">
            {zoneCount}
          </dd>
          <p className="mt-1 text-xs text-[#4a655f]">stub Fase 2</p>
        </div>
        <div className="rounded-lg border border-[#c5d8d2] bg-white p-5">
          <dt className="text-sm text-[#4a655f]">Slug tenant</dt>
          <dd className="mt-1 font-[family-name:var(--font-display)] text-2xl text-[var(--brand-deep)]">
            {admin.tenant.slug}
          </dd>
        </div>
      </dl>

      <div className="mt-8">
        <Link
          href="/admin/productos"
          className="inline-flex rounded-md bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--brand-deep)]"
        >
          Gestionar productos
        </Link>
      </div>
    </div>
  );
}
