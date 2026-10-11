import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  createCompanyAdminAction,
  resetAdminPasswordAction,
  updateCompanyAction,
} from "@/app/admin/(panel)/plataforma/manage-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

  return (
    <div className="max-w-3xl space-y-10">
      <div>
        <Link
          href="/admin/plataforma"
          className="text-sm text-[var(--brand)] hover:underline"
        >
          ← Empresas
        </Link>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h1 className="rc-display text-3xl uppercase text-[var(--brand-deep)]">
            {tenant.name}
          </h1>
          <Badge variant={tenant.active ? "secondary" : "outline"}>
            {tenant.active ? "Activa" : "Suspendida"}
          </Badge>
        </div>
        <p className="mt-1 font-mono text-xs text-[#5a6578]">{tenant.slug}</p>
        <p className="mt-2 text-sm text-[#5a6578]">
          {tenant._count.products} productos · {tenant._count.orders} pedidos ·
          WebPay {tenant.webpayCredential?.environment ?? "—"}
        </p>
        <p className="mt-2">
          <Link
            href={`/?tenant=${tenant.slug}`}
            className="text-sm font-bold text-[var(--brand)] hover:underline"
          >
            Abrir tienda →
          </Link>
        </p>
      </div>

      {ok ? (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {ok === "1" ? "Cambios guardados." : ok}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <section>
        <h2 className="rc-display text-2xl uppercase text-[var(--brand-deep)]">
          Datos de la empresa
        </h2>
        <form action={updateCompanyAction} className="mt-4 space-y-4">
          <input type="hidden" name="tenantId" value={tenant.id} />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input id="name" name="name" required defaultValue={tenant.name} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input id="slug" name="slug" required defaultValue={tenant.slug} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="primaryColor">Color principal</Label>
              <Input
                id="primaryColor"
                name="primaryColor"
                defaultValue={tenant.primaryColor}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="secondaryColor">Color secundario</Label>
              <Input
                id="secondaryColor"
                name="secondaryColor"
                defaultValue={tenant.secondaryColor}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="tagline">Tagline</Label>
            <Input
              id="tagline"
              name="tagline"
              defaultValue={tenant.tagline ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="about">Quiénes somos</Label>
            <Textarea
              id="about"
              name="about"
              rows={3}
              defaultValue={tenant.about ?? ""}
            />
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
          <Button type="submit">Guardar empresa</Button>
        </form>
      </section>

      <section>
        <h2 className="rc-display text-2xl uppercase text-[var(--brand-deep)]">
          Admins dueños
        </h2>
        <ul className="mt-4 divide-y border border-[#d5e3ec] bg-white">
          {tenant.adminUsers.map((u) => (
            <li
              key={u.id}
              className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-end sm:justify-between"
            >
              <div>
                <p className="font-medium">{u.name}</p>
                <p className="text-sm text-[#5a6578]">{u.email}</p>
                <p className="text-xs text-[#5a6578]">rol: {u.role}</p>
              </div>
              <form action={resetAdminPasswordAction} className="flex gap-2">
                <input type="hidden" name="adminId" value={u.id} />
                <input type="hidden" name="tenantId" value={tenant.id} />
                <Input
                  name="password"
                  type="password"
                  placeholder="Nueva clave (12+)"
                  required
                  minLength={12}
                  className="w-44"
                  autoComplete="new-password"
                />
                <Button type="submit" variant="outline" size="sm">
                  Reset clave
                </Button>
              </form>
            </li>
          ))}
        </ul>

        <h3 className="mt-8 text-sm font-bold uppercase text-[var(--brand-deep)]">
          Agregar admin
        </h3>
        <form
          action={createCompanyAdminAction}
          className="mt-3 grid gap-3 sm:grid-cols-2"
        >
          <input type="hidden" name="tenantId" value={tenant.id} />
          <Input name="name" placeholder="Nombre" required />
          <Input name="email" type="email" placeholder="Email" required />
          <Input
            name="password"
            type="password"
            placeholder="Contraseña temporal (mín. 12)"
            required
            minLength={12}
            autoComplete="new-password"
          />
          <Button type="submit">Crear admin</Button>
        </form>
      </section>
    </div>
  );
}
