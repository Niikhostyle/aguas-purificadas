import Link from "next/link";
import { redirect } from "next/navigation";
import { Building2, CircleCheck, ClipboardList, LayoutTemplate, Plus, Wallet } from "lucide-react";
import {
  BarChart,
  DataTable,
  EmptyState,
  KpiCard,
  KpiGrid,
  ORDER_STATUS_TONE,
  PageHeader,
  Panel,
  StatsTable,
  StatusBadge,
  adminButton,
} from "@/components/admin/ui";
import { orderPeriodStats } from "@/lib/admin-stats";
import { requireSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ORDER_STATUS_LABEL } from "@/lib/order-status";
import { formatClp } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PlatformAdminPage() {
  const admin = await requireSuperAdmin();
  if (!admin) redirect("/admin/login?tenant=plataforma");

  const tenantScope = { slug: { not: "plataforma" } };
  const [tenants, stats, recentOrders, topTenants] = await Promise.all([
    prisma.tenant.findMany({
      where: tenantScope,
      select: { id: true, name: true, slug: true, active: true, createdAt: true, city: true },
      orderBy: { createdAt: "desc" },
    }),
    orderPeriodStats({ tenant: tenantScope }),
    prisma.order.findMany({
      where: { tenant: tenantScope },
      select: {
        id: true,
        totalClp: true,
        status: true,
        createdAt: true,
        tenant: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.order.groupBy({
      by: ["tenantId"],
      where: { tenant: tenantScope },
      _count: { _all: true },
      _sum: { totalClp: true },
      orderBy: { _count: { tenantId: "desc" } },
      take: 6,
    }),
  ]);

  const activeCount = tenants.filter((t) => t.active).length;
  const tenantName = new Map(tenants.map((t) => [t.id, t.name]));
  const [ordersToday, , ordersMonth, , ordersTotal] = stats.orders;
  const [, , revenueMonth, , revenueTotal] = stats.revenue;

  const monthFmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Santiago",
    year: "numeric",
    month: "2-digit",
  });
  const monthKey = monthFmt.format(new Date());
  const newThisMonth = tenants.filter((t) => monthFmt.format(t.createdAt) === monthKey).length;

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Resumen de la plataforma MiBidón: empresas, pedidos e ingresos de todas las tiendas."
        homeHref="/admin/plataforma"
        breadcrumbs={[{ label: "Dashboard" }]}
        actions={
          <>
            <Link href="/admin/plataforma/landing" className={adminButton({ variant: "secondary" })}>
              <LayoutTemplate aria-hidden />
              Landing CMS
            </Link>
            <Link href="/admin/plataforma/nueva" className={adminButton()}>
              <Plus aria-hidden />
              Nueva empresa
            </Link>
          </>
        }
      />

      <div className="space-y-6">
        <KpiGrid>
          <KpiCard
            label="Empresas"
            value={tenants.length}
            hint={`${newThisMonth} ${newThisMonth === 1 ? "nueva" : "nuevas"} este mes`}
            icon={<Building2 />}
            tone="navy"
            href="/admin/plataforma/empresas"
          />
          <KpiCard
            label="Empresas activas"
            value={activeCount}
            hint={`${tenants.length - activeCount} suspendidas`}
            icon={<CircleCheck />}
            tone="success"
            href="/admin/plataforma/empresas?estado=activas"
          />
          <KpiCard
            label="Pedidos totales"
            value={ordersTotal.toLocaleString("es-CL")}
            hint={`${ordersToday} hoy · ${ordersMonth} este mes`}
            icon={<ClipboardList />}
            tone="brand"
          />
          <KpiCard
            label="Ingresos pagados"
            value={formatClp(revenueTotal)}
            hint={`${formatClp(revenueMonth)} este mes`}
            icon={<Wallet />}
            tone="warning"
          />
        </KpiGrid>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <Panel title="Estadísticas" description="Todas las tiendas, horario de Chile." flush>
            <StatsTable
              caption="Estadísticas por período"
              rows={[
                { label: "Ingresos", values: stats.revenue.map((v) => formatClp(v) ) },
                { label: "Pedidos", values: stats.orders.map((v) => v.toLocaleString("es-CL") ) },
              ]}
            />
          </Panel>
          <Panel title="Ingresos · últimos 14 días">
            <BarChart
              ariaLabel="Ingresos pagados por día, últimos 14 días"
              data={stats.daily.map((d) => ({ label: d.label, value: d.revenue, display: formatClp(d.revenue) }))}
            />
          </Panel>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <Panel title="Pedidos recientes" description="Últimos pedidos en todas las empresas." flush>
            <DataTable
              caption="Pedidos recientes"
              rows={recentOrders}
              rowKey={(o) => o.id}
              empty={<EmptyState icon={<ClipboardList />} title="Aún no hay pedidos" />}
              columns={[
                {
                  key: "ref",
                  header: "Ref.",
                  cell: (o) => <span className="font-mono text-xs">{o.id.slice(-8).toUpperCase()}</span>,
                },
                {
                  key: "tenant",
                  header: "Empresa",
                  cell: (o) => (
                    <Link
                      href={`/admin/plataforma/${o.tenant.id}`}
                      className="font-medium text-[var(--brand-deep)] hover:underline"
                    >
                      {o.tenant.name}
                    </Link>
                  ),
                },
                { key: "total", header: "Total", align: "right", cell: (o) => formatClp(o.totalClp) },
                {
                  key: "status",
                  header: "Estado",
                  cell: (o) => (
                    <StatusBadge tone={ORDER_STATUS_TONE[o.status] ?? "neutral"}>
                      {ORDER_STATUS_LABEL[o.status] ?? o.status}
                    </StatusBadge>
                  ),
                },
                {
                  key: "date",
                  header: "Fecha",
                  hideOnMobile: true,
                  cell: (o) => (
                    <span className="whitespace-nowrap text-[#5a6578]">
                      {o.createdAt.toLocaleString("es-CL", { dateStyle: "short", timeStyle: "short" })}
                    </span>
                  ),
                },
              ]}
            />
          </Panel>

          <Panel
            title="Empresas con más pedidos"
            flush
            actions={
              <Link href="/admin/plataforma/empresas" className={adminButton({ variant: "ghost", size: "sm" })}>
                Ver todas
              </Link>
            }
          >
            <DataTable
              caption="Empresas con más pedidos"
              minWidth={320}
              rows={topTenants}
              rowKey={(r) => r.tenantId}
              empty={
                <EmptyState
                  icon={<Building2 />}
                  title="Sin actividad todavía"
                  description="Cuando las tiendas reciban pedidos aparecerán aquí."
                />
              }
              columns={[
                {
                  key: "name",
                  header: "Empresa",
                  cell: (r) => (
                    <Link
                      href={`/admin/plataforma/${r.tenantId}`}
                      className="font-medium text-[var(--brand-deep)] hover:underline"
                    >
                      {tenantName.get(r.tenantId) ?? "—"}
                    </Link>
                  ),
                },
                { key: "orders", header: "Pedidos", align: "right", cell: (r) => r._count._all },
                {
                  key: "revenue",
                  header: "Monto",
                  align: "right",
                  cell: (r) => formatClp(r._sum.totalClp ?? 0),
                },
              ]}
            />
          </Panel>
        </div>

        <Panel
          title="Empresas recientes"
          flush
          actions={
            <Link href="/admin/plataforma/empresas" className={adminButton({ variant: "ghost", size: "sm" })}>
              Ir al listado
            </Link>
          }
        >
          <DataTable
            caption="Empresas recientes"
            rows={tenants.slice(0, 5)}
            rowKey={(t) => t.id}
            empty={
              <EmptyState
                icon={<Building2 />}
                title="Aún no hay empresas"
                action={
                  <Link href="/admin/plataforma/nueva" className={adminButton()}>
                    Crear empresa
                  </Link>
                }
              />
            }
            columns={[
              {
                key: "name",
                header: "Empresa",
                cell: (t) => (
                  <Link
                    href={`/admin/plataforma/${t.id}`}
                    className="font-semibold text-[var(--brand-deep)] hover:underline"
                  >
                    {t.name}
                  </Link>
                ),
              },
              { key: "slug", header: "Subdominio", cell: (t) => <span className="font-mono text-xs">{t.slug}.mibidon.cl</span> },
              { key: "city", header: "Ciudad", hideOnMobile: true, cell: (t) => t.city ?? "—" },
              {
                key: "status",
                header: "Estado",
                cell: (t) => (
                  <StatusBadge tone={t.active ? "success" : "warning"}>{t.active ? "Activa" : "Suspendida"}</StatusBadge>
                ),
              },
              {
                key: "created",
                header: "Alta",
                hideOnMobile: true,
                cell: (t) => t.createdAt.toLocaleDateString("es-CL", { dateStyle: "medium" }),
              },
            ]}
          />
        </Panel>
      </div>
    </>
  );
}
