import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminShell, type AdminNotification } from "@/components/admin/shell/admin-shell";
import { PLATFORM_APPEARANCE, adminThemeVars, tenantAppearance } from "@/lib/appearance";
import { isDemoTenantSlug, isSuperAdmin, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { zonesNeedSetup } from "@/lib/delivery-zones";
import { DISPATCHABLE_PAYMENT, addDaysStr, dateFromStr, todayCl } from "@/lib/dispatch";
import { parseModuleFlags } from "@/lib/modules";
import { getTenantSlugFromHeaders } from "@/lib/tenant";

export async function generateMetadata(): Promise<Metadata> {
  const admin = await requireAdmin();
  if (!admin || isSuperAdmin(admin)) return {};
  const favicon = tenantAppearance(admin.tenant).images.faviconUrl;
  return favicon ? { icons: { icon: favicon, apple: favicon } } : {};
}

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
  const appearance = superAdmin ? PLATFORM_APPEARANCE : tenantAppearance(admin.tenant);
  const theme = adminThemeVars(appearance);

  const flags = parseModuleFlags(admin.tenant.modulesEnabled);
  const hiddenHrefs = superAdmin
    ? []
    : [
        !flags.despacho && "/admin/despacho",
        !flags.despacho && "/admin/despacho/mapa",
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
    const [pending, unassigned, dueSoon, zones, debtors] = await Promise.all([
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
      prisma.deliveryZone.findMany({
        where: { tenantId: admin.tenantId },
        select: { active: true, createdAt: true, updatedAt: true },
      }),
      prisma.order.count({
        where: { tenantId: admin.tenantId, status: "pending", fulfillmentStatus: "entregado" },
      }),
    ]);
    if (debtors) {
      notifications.push({
        id: "debtors",
        label: "Pedidos entregados sin pagar",
        href: "/admin/alertas#morosos",
        count: debtors,
        tone: "danger",
      });
    }
    if (zonesNeedSetup(zones)) {
      notifications.push({
        id: "zones-setup",
        label: "Configura tus zonas de despacho",
        href: "/admin/zonas",
        count: 1,
        tone: "warning",
      });
    }
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
    <div style={theme} data-admin-theme data-kpi-style={appearance.kpiStyle}>
      <AdminShell
        variant={superAdmin ? "platform" : "tenant"}
        orgName={admin.tenant.name}
        orgSubtitle={appearance.panelSubtitle}
        orgLogoUrl={appearance.images.panelLogoUrl}
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
