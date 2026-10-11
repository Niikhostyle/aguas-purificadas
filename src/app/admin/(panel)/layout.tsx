import { redirect } from "next/navigation";
import { AdminShell, type AdminNotification } from "@/components/admin/shell/admin-shell";
import { isSuperAdmin, requireAdmin } from "@/lib/auth";
import { adminThemeStyle } from "@/lib/branding";
import { prisma } from "@/lib/db";

export default async function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin/login");

  const superAdmin = isSuperAdmin(admin);
  const theme = adminThemeStyle();

  const notifications: AdminNotification[] = [];
  if (superAdmin) {
    const suspended = await prisma.tenant.count({
      where: { slug: { not: "plataforma" }, active: false },
    });
    if (suspended) {
      notifications.push({
        id: "suspended",
        label: "Empresas suspendidas",
        href: "/admin/plataforma/empresas?estado=suspendidas",
        count: suspended,
        tone: "warning",
      });
    }
  } else {
    const pending = await prisma.order.count({
      where: { tenantId: admin.tenantId, status: "pending" },
    });
    if (pending) {
      notifications.push({
        id: "pending-orders",
        label: "Pedidos pendientes",
        href: "/admin/pedidos?estado=pending",
        count: pending,
        tone: "warning",
      });
    }
  }

  return (
    <div style={theme}>
      <AdminShell
        variant={superAdmin ? "platform" : "tenant"}
        orgName={admin.tenant.name}
        email={admin.email}
        roleLabel={superAdmin ? "Super-admin" : "Administrador"}
        siteHref="/"
        siteLabel={superAdmin ? "Ver landing mibidon.cl" : "Ver tienda"}
        notifications={notifications}
      >
        {children}
      </AdminShell>
    </div>
  );
}
