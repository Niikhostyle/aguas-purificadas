import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { ClipboardList, ExternalLink, Package, ShieldCheck, Wallet } from "lucide-react";
import {
  createCompanyAdminAction,
  resetAdminPasswordAction,
  setTenantActiveAction,
  updateCompanyAction,
} from "@/app/admin/(panel)/plataforma/manage-actions";
import { KpiCard, KpiGrid, PageHeader, Panel, StatusBadge, adminButton } from "@/components/admin/ui";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { requireSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

type Props = {
  params: Promise<{ tenantId: string }>;
  searchParams: Promise<{ ok?: string; error?: string }>;
};

export default async function PlatformTenantDetailPage({
  params,
  searchParams,
}: Props) {
  const admin = await requireSuperAdmin();
  if (!admin) redirect("/admin/login?tenant=plataforma");

  const { tenantId } = await params;
  const { ok, error } = await searchParams;
  const tenant = await prisma.tenant.findFirst({
    where: { id: tenantId, slug: { not: "plataforma" } },
    include: {
      adminUsers: { orderBy: { createdAt: "asc" } },
      webpayCredential: true,
      _count: { select: { products: true, orders: true } },
    },
  });
  if (!tenant) notFound();

  const host = (await headers()).get("host") ?? "";
  const storefront = host.endsWith("mibidon.cl")
    ? `https://${tenant.slug}.mibidon.cl/`
    : `/?tenant=${tenant.slug}`;
  const returnTo = `/admin/plataforma/${tenant.id}`;

  return (
    <>
      <PageHeader
        title={tenant.name}
        description={
          <span className="inline-flex flex-wrap items-center gap-2">
            <span className="font-mono">{tenant.slug}.mibidon.cl</span>
            <StatusBadge tone={tenant.active ? "success" : "warning"}>
              {tenant.active ? "Activa" : "Suspendida"}
            </StatusBadge>
          </span>
        }
        homeHref="/admin/plataforma"
        breadcrumbs={[
          { label: "Plataforma", href: "/admin/plataforma" },
          { label: "Empresas", href: "/admin/plataforma/empresas" },
          { label: tenant.name },
        ]}
        actions={
          <>
            <a href={storefront} target="_blank" rel="noopener noreferrer" className={adminButton({ variant: "secondary" })}>
              <ExternalLink aria-hidden />
              Abrir tienda
            </a>
            <form action={setTenantActiveAction}>
              <input type="hidden" name="tenantId" value={tenant.id} />
              <input type="hidden" name="active" value={tenant.active ? "0" : "1"} />
              <input type="hidden" name="returnTo" value={returnTo} />
              <button type="submit" className={adminButton({ variant: tenant.active ? "danger" : "primary" })}>
                {tenant.active ? "Suspender" : "Activar"}
              </button>
            </form>
          </>
        }
      />

      {ok ? (
        <p role="status" className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-800">
          {ok === "1" ? "Cambios guardados." : ok}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="space-y-6">
        <KpiGrid>
          <KpiCard label="Productos" value={tenant._count.products} icon={<Package />} tone="brand" />
          <KpiCard label="Pedidos" value={tenant._count.orders} icon={<ClipboardList />} tone="navy" />
          <KpiCard
            label="WebPay"
            value={
              tenant.webpayCredential?.active
                ? tenant.webpayCredential.environment === "production"
                  ? "Producción"
                  : "Sandbox"
                : "—"
            }
            icon={<Wallet />}
            tone="warning"
          />
          <KpiCard label="Administradores" value={tenant.adminUsers.length} icon={<ShieldCheck />} tone="success" />
        </KpiGrid>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          <Panel title="Datos de la empresa" description="Nombre, subdominio, colores y textos base de la tienda.">
            <form action={updateCompanyAction} className="space-y-4">
              <input type="hidden" name="tenantId" value={tenant.id} />
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Nombre</Label>
                  <Input id="name" name="name" required defaultValue={tenant.name} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="slug">Slug</Label>
                  <Input id="slug" name="slug" required defaultValue={tenant.slug} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="primaryColor">Color principal</Label>
                  <Input id="primaryColor" name="primaryColor" defaultValue={tenant.primaryColor} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="secondaryColor">Color secundario</Label>
                  <Input id="secondaryColor" name="secondaryColor" defaultValue={tenant.secondaryColor} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tagline">Tagline</Label>
                <Input id="tagline" name="tagline" defaultValue={tenant.tagline ?? ""} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="about">Quiénes somos</Label>
                <Textarea id="about" name="about" rows={3} defaultValue={tenant.about ?? ""} />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="active"
                  defaultChecked={tenant.active}
                  className="size-4 accent-[var(--brand)]"
                />
                Empresa activa (desmarcar = suspender tienda)
              </label>
              <div className="flex justify-end border-t border-[#e8f0f5] pt-4">
                <button type="submit" className={adminButton()}>
                  Guardar empresa
                </button>
              </div>
            </form>
          </Panel>

          <div className="space-y-6">
            <Panel title="Administradores" description="Dueños con acceso al panel de esta empresa." flush>
              <ul className="divide-y divide-[#eef3f7]">
                {tenant.adminUsers.map((u) => (
                  <li key={u.id} className="space-y-3 px-5 py-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-[#12233d]">{u.name}</p>
                        <p className="truncate text-sm text-[#5a6578]">{u.email}</p>
                      </div>
                      <StatusBadge tone="navy" dot={false}>
                        {u.role}
                      </StatusBadge>
                    </div>
                    <form action={resetAdminPasswordAction} className="flex gap-2">
                      <input type="hidden" name="adminId" value={u.id} />
                      <input type="hidden" name="tenantId" value={tenant.id} />
                      <label htmlFor={`pw-${u.id}`} className="sr-only">
                        Nueva clave para {u.email}
                      </label>
                      <Input
                        id={`pw-${u.id}`}
                        name="password"
                        type="password"
                        placeholder="Nueva clave (12+)"
                        required
                        minLength={12}
                        className="flex-1"
                        autoComplete="new-password"
                      />
                      <button type="submit" className={adminButton({ variant: "secondary", size: "sm", className: "h-8" })}>
                        Reset clave
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            </Panel>

            <Panel title="Agregar administrador">
              <form action={createCompanyAdminAction} className="grid gap-3">
                <input type="hidden" name="tenantId" value={tenant.id} />
                <Label htmlFor="new-admin-name" className="sr-only">Nombre</Label>
                <Input id="new-admin-name" name="name" placeholder="Nombre" required />
                <Label htmlFor="new-admin-email" className="sr-only">Email</Label>
                <Input id="new-admin-email" name="email" type="email" placeholder="Email" required />
                <Label htmlFor="new-admin-pw" className="sr-only">Contraseña temporal</Label>
                <Input
                  id="new-admin-pw"
                  name="password"
                  type="password"
                  placeholder="Contraseña temporal (mín. 12)"
                  required
                  minLength={12}
                  autoComplete="new-password"
                />
                <button type="submit" className={adminButton()}>
                  Crear admin
                </button>
              </form>
            </Panel>
          </div>
        </div>
      </div>
    </>
  );
}
