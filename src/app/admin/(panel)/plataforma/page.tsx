import { redirect } from "next/navigation";
import {
  PlatformDashboard,
  type PlatformStats,
  type PlatformTenantRow,
} from "@/components/admin/platform-dashboard";
import { requireSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function PlatformAdminPage() {
  const admin = await requireSuperAdmin();
  if (!admin) redirect("/admin/login?tenant=plataforma");

  const tenants = await prisma.tenant.findMany({
    where: { slug: { not: "plataforma" } },
    include: {
      _count: {
        select: { products: true, orders: true, adminUsers: true },
      },
      webpayCredential: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const rows: PlatformTenantRow[] = tenants.map((t) => ({
    id: t.id,
    name: t.name,
    slug: t.slug,
    active: t.active,
    city: t.city,
    region: t.region,
    products: t._count.products,
    orders: t._count.orders,
    admins: t._count.adminUsers,
    webpay: t.webpayCredential?.active
      ? (t.webpayCredential.environment === "production"
          ? "production"
          : "integration")
      : null,
    createdAt: t.createdAt.toISOString(),
  }));

  const stats: PlatformStats = {
    empresas: rows.length,
    activas: rows.filter((t) => t.active).length,
    suspendidas: rows.filter((t) => !t.active).length,
    productos: rows.reduce((n, t) => n + t.products, 0),
    pedidos: rows.reduce((n, t) => n + t.orders, 0),
    webpayConfigurados: rows.filter((t) => t.webpay).length,
    adminsEmpresa: rows.reduce((n, t) => n + t.admins, 0),
  };

  return <PlatformDashboard stats={stats} tenants={rows} />;
}
