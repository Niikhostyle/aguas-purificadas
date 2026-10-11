import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { Building2, CirclePause, CircleCheck, Plus, Wallet } from "lucide-react";
import {
  bulkSetTenantsActiveAction,
  setTenantActiveAction,
} from "@/app/admin/(panel)/plataforma/manage-actions";
import {
  DataTable,
  EmptyState,
  FilterBar,
  KpiCard,
  KpiGrid,
  PageHeader,
  Pagination,
  Panel,
  SelectAllCheckbox,
  StatusBadge,
  adminButton,
  paginate,
  type DataColumn,
} from "@/components/admin/ui";
import { requireSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;
const BULK_FORM = "tenant-bulk";

type SearchParams = { q?: string; estado?: string; webpay?: string; page?: string };

export default async function PlatformTenantsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const admin = await requireSuperAdmin();
  if (!admin) redirect("/admin/login?tenant=plataforma");

  const sp = await searchParams;
  const q = sp.q?.trim().slice(0, 80) ?? "";
  const estado = ["activas", "suspendidas"].includes(sp.estado ?? "") ? sp.estado! : "all";
  const webpay = ["si", "no"].includes(sp.webpay ?? "") ? sp.webpay! : "all";

  const base: Prisma.TenantWhereInput = { slug: { not: "plataforma" } };
  const where: Prisma.TenantWhereInput = {
    AND: [
      base,
      q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { slug: { contains: q, mode: "insensitive" } },
              { city: { contains: q, mode: "insensitive" } },
            ],
          }
        : {},
      estado === "activas" ? { active: true } : estado === "suspendidas" ? { active: false } : {},
      webpay === "si"
        ? { webpayCredential: { is: { active: true } } }
        : webpay === "no"
          ? { OR: [{ webpayCredential: { is: null } }, { webpayCredential: { is: { active: false } } }] }
          : {},
    ],
  };

  const [total, all, activeCount, webpayCount] = await Promise.all([
    prisma.tenant.count({ where }),
    prisma.tenant.count({ where: base }),
    prisma.tenant.count({ where: { ...base, active: true } }),
    prisma.tenant.count({ where: { ...base, webpayCredential: { is: { active: true } } } }),
  ]);
  const { page, pages, skip, take } = paginate(sp.page, total, PAGE_SIZE);
  const tenants = await prisma.tenant.findMany({
    where,
    include: {
      _count: { select: { products: true, orders: true, adminUsers: true } },
      webpayCredential: { select: { active: true, environment: true } },
    },
    orderBy: { createdAt: "desc" },
    skip,
    take,
  });

  const host = (await headers()).get("host") ?? "";
  const storefront = (slug: string) =>
    host.endsWith("mibidon.cl") ? `https://${slug}.mibidon.cl/` : `/?tenant=${slug}`;

  const params = { q, estado, webpay };
  const qs = new URLSearchParams(
    Object.entries({ ...params, page: page > 1 ? String(page) : "" }).filter(([, v]) => v && v !== "all"),
  ).toString();
  const returnTo = `/admin/plataforma/empresas${qs ? `?${qs}` : ""}`;

  type Row = (typeof tenants)[number];
  const columns: DataColumn<Row>[] = [
    {
      key: "select",
      header: <SelectAllCheckbox formId={BULK_FORM} name="tenantIds" label="Seleccionar todas" />,
      headerClassName: "w-10",
      cell: (t) => (
        <input
          type="checkbox"
          name="tenantIds"
          value={t.id}
          form={BULK_FORM}
          aria-label={`Seleccionar ${t.name}`}
          className="size-4 rounded accent-[var(--brand)]"
        />
      ),
    },
    {
      key: "name",
      header: "Empresa",
      cell: (t) => (
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className="grid size-9 shrink-0 place-items-center rounded-full text-xs font-bold text-white"
            style={{ background: t.primaryColor }}
          >
            {t.name.slice(0, 2).toUpperCase()}
          </span>
          <div className="min-w-0">
            <Link
              href={`/admin/plataforma/${t.id}`}
              className="font-semibold text-[var(--brand-deep)] hover:text-[var(--brand)] hover:underline"
            >
              {t.name}
            </Link>
            <p className="font-mono text-xs text-[#6b7a8f]">{t.slug}.mibidon.cl</p>
          </div>
        </div>
      ),
    },
    {
      key: "city",
      header: "Ubicación",
      hideOnMobile: true,
      cell: (t) => (
        <span className="text-[#5a6578]">{[t.city, t.region].filter(Boolean).join(", ") || "—"}</span>
      ),
    },
    {
      key: "usage",
      header: "Uso",
      hideOnMobile: true,
      cell: (t) => (
        <span className="tabular-nums text-[#3d4a5c]">
          {t._count.products} prod. · {t._count.orders} ped. · {t._count.adminUsers} adm.
        </span>
      ),
    },
    {
      key: "webpay",
      header: "WebPay",
      cell: (t) =>
        t.webpayCredential?.active ? (
          <StatusBadge tone={t.webpayCredential.environment === "production" ? "success" : "info"}>
            {t.webpayCredential.environment === "production" ? "Producción" : "Sandbox"}
          </StatusBadge>
        ) : (
          <StatusBadge tone="neutral">Sin configurar</StatusBadge>
        ),
    },
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
      cell: (t) => (
        <span className="whitespace-nowrap text-[#5a6578]">
          {t.createdAt.toLocaleDateString("es-CL", { dateStyle: "medium" })}
        </span>
      ),
    },
    {
      key: "actions",
      header: <span className="sr-only">Acciones</span>,
      align: "right",
      cell: (t) => (
        <div className="flex items-center justify-end gap-1.5">
          <Link href={`/admin/plataforma/${t.id}`} className={adminButton({ variant: "secondary", size: "sm" })}>
            Gestionar
          </Link>
          <a
            href={storefront(t.slug)}
            target="_blank"
            rel="noopener noreferrer"
            className={adminButton({ variant: "ghost", size: "sm" })}
          >
            Tienda
          </a>
          <form action={setTenantActiveAction}>
            <input type="hidden" name="tenantId" value={t.id} />
            <input type="hidden" name="active" value={t.active ? "0" : "1"} />
            <input type="hidden" name="returnTo" value={returnTo} />
            <button
              type="submit"
              className={adminButton({ variant: t.active ? "danger" : "secondary", size: "sm" })}
            >
              {t.active ? "Suspender" : "Activar"}
            </button>
          </form>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Empresas"
        description="Clientes de la plataforma: cada empresa tiene su tienda en slug.mibidon.cl y sus propios administradores."
        homeHref="/admin/plataforma"
        breadcrumbs={[{ label: "Plataforma", href: "/admin/plataforma" }, { label: "Empresas" }]}
        actions={
          <Link href="/admin/plataforma/nueva" className={adminButton()}>
            <Plus aria-hidden />
            Nueva empresa
          </Link>
        }
      />

      <div className="space-y-6">
        <KpiGrid>
          <KpiCard label="Total" value={all} icon={<Building2 />} tone="navy" href="/admin/plataforma/empresas" />
          <KpiCard
            label="Activas"
            value={activeCount}
            icon={<CircleCheck />}
            tone="success"
            href="/admin/plataforma/empresas?estado=activas"
          />
          <KpiCard
            label="Suspendidas"
            value={all - activeCount}
            icon={<CirclePause />}
            tone="warning"
            href="/admin/plataforma/empresas?estado=suspendidas"
          />
          <KpiCard
            label="Con WebPay"
            value={webpayCount}
            icon={<Wallet />}
            tone="brand"
            href="/admin/plataforma/empresas?webpay=si"
          />
        </KpiGrid>

        <Panel
          title="Listado de empresas"
          description="Filtra por estado o WebPay, selecciona varias para activarlas o suspenderlas en bloque."
          flush
          toolbar={
            <FilterBar
              q={q}
              searchPlaceholder="Nombre, slug o ciudad…"
              selects={[
                {
                  name: "estado",
                  label: "Estado",
                  value: estado,
                  options: [
                    { value: "all", label: "Todos los estados" },
                    { value: "activas", label: "Activas" },
                    { value: "suspendidas", label: "Suspendidas" },
                  ],
                },
                {
                  name: "webpay",
                  label: "WebPay",
                  value: webpay,
                  options: [
                    { value: "all", label: "WebPay: todas" },
                    { value: "si", label: "Con WebPay" },
                    { value: "no", label: "Sin WebPay" },
                  ],
                },
              ]}
              actions={
                <form id={BULK_FORM} action={bulkSetTenantsActiveAction} className="flex items-center gap-2">
                  <input type="hidden" name="returnTo" value={returnTo} />
                  <span className="text-[13px] text-[#5a6578]">
                    <span id={`${BULK_FORM}-count`} className="font-semibold tabular-nums">
                      0
                    </span>{" "}
                    seleccionadas
                  </span>
                  <button
                    type="submit"
                    name="op"
                    value="activate"
                    form={BULK_FORM}
                    className={adminButton({ variant: "secondary", size: "sm" })}
                  >
                    Activar
                  </button>
                  <button
                    type="submit"
                    name="op"
                    value="suspend"
                    form={BULK_FORM}
                    className={adminButton({ variant: "danger", size: "sm" })}
                  >
                    Suspender
                  </button>
                </form>
              }
            />
          }
          footer={
            <Pagination
              page={page}
              pages={pages}
              total={total}
              pageSize={PAGE_SIZE}
              basePath="/admin/plataforma/empresas"
              params={params}
              noun="empresas"
            />
          }
        >
          <DataTable
            caption="Empresas de la plataforma"
            columns={columns}
            rows={tenants}
            rowKey={(t) => t.id}
            empty={
              <EmptyState
                icon={<Building2 />}
                title={q || estado !== "all" || webpay !== "all" ? "Sin resultados" : "Aún no hay empresas"}
                description={
                  q || estado !== "all" || webpay !== "all"
                    ? "Prueba con otros filtros o limpia la búsqueda."
                    : "Crea la primera empresa: solo necesitas un nombre y un slug."
                }
                action={
                  <Link href="/admin/plataforma/nueva" className={adminButton()}>
                    <Plus aria-hidden />
                    Nueva empresa
                  </Link>
                }
              />
            }
          />
        </Panel>
      </div>
    </>
  );
}
