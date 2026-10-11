import { redirect } from "next/navigation";
import { AdminShell, type AdminNotification } from "@/components/admin/shell/admin-shell";
import { isDemoTenantSlug, isSuperAdmin, requireAdmin } from "@/lib/auth";
import { adminThemeStyle } from "@/lib/branding";
import { prisma } from "@/lib/db";
import { DISPATCHABLE_PAYMENT, addDaysStr, dateFromStr, todayCl } from "@/lib/dispatch";
import { parseModuleFlags } from "@/lib/modules";
import { getTenantSlugFromHeaders } from "@/lib/tenant";

export default async function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();
  if (!admin) {
    const slug = await getTenantSlugFromHeaders();
    if (isDemoTenantSlug(slug)) redirect("/admin/demo-access");
    redirect("/admin/login");
  }

  const superAdmin = isSuperAdmin(admin);
  const theme = adminThemeStyle();

  const flags = parseModuleFlags(admin.tenant.modulesEnabled);
  const hiddenHrefs = superAdmin
    ? []
    : [
        !flags.despacho && "/admin/despacho",
        !flags.recordatorios && "/admin/recordatorios",
        !flags.envases && "/admin/envases",
      ].filter((h): h is string => Boolean(h));

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
    const today = todayCl();
    const [pending, unassigned, dueSoon] = await Promise.all([
      prisma.order.count({ where: { tenantId: admin.tenantId, status: "pending" } }),
      flags.despacho
        ? prisma.order.count({
            where: {
              tenantId: admin.tenantId,
              status: { in: DISPATCHABLE_PAYMENT },
              fulfillmentStatus: "por_asignar",
            },
          })
        : 0,
      flags.recordatorios
        ? prisma.deliveryCustomer.count({
            where: {
              tenantId: admin.tenantId,
              recurring: true,
              nextDeliveryDate: { lte: dateFromStr(addDaysStr(today, 3)) },
            },
          })
        : 0,
    ]);
    if (unassigned) {
      notifications.push({
        id: "unassigned",
        label: "Pedidos sin ruta asignada",
        href: "/admin/despacho?fecha=todas&estado=por_asignar",
        count: unassigned,
        tone: "danger",
      });
    }
    if (pending) {
      notifications.push({
        id: "pending-orders",
        label: "Pedidos con pago pendiente",
        href: "/admin/pedidos?pago=pending",
        count: pending,
        tone: "warning",
      });
    }
    if (dueSoon) {
      notifications.push({
        id: "due-soon",
        label: "Clientes próximos a reponer",
        href: "/admin/recordatorios",
        count: dueSoon,
        tone: "info",
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
        hiddenHrefs={hiddenHrefs}
        year={todayCl().slice(0, 4)}
      >
        {children}
      </AdminShell>
    </div>
  );
}
