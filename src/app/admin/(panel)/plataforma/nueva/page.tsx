import { redirect } from "next/navigation";
import { createTenantAction } from "@/app/admin/(panel)/plataforma/actions";
import { PageHeader, Panel } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { requireSuperAdmin } from "@/lib/auth";

export default async function NewTenantPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const admin = await requireSuperAdmin();
  if (!admin) redirect("/admin/login?tenant=plataforma");
  const { error } = await searchParams;

  return (
    <>
      <PageHeader
        title="Nueva empresa"
        description="Crea tenant, admin de empresa, catálogo demo, zonas y credenciales WebPay sandbox."
        homeHref="/admin/plataforma"
        breadcrumbs={[
          { label: "Plataforma", href: "/admin/plataforma" },
          { label: "Empresas", href: "/admin/plataforma/empresas" },
          { label: "Nueva" },
        ]}
      />
      <Panel title="Datos de alta" description="La tienda quedará disponible en slug.mibidon.cl." className="max-w-3xl">
      <form action={createTenantAction} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre comercial</Label>
            <Input
              id="name"
              name="name"
              required
              placeholder="Aguas del Sur"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">Slug (subdominio / ?tenant=)</Label>
            <Input
              id="slug"
              name="slug"
              required
              placeholder="aguas-del-sur"
              pattern="[a-z0-9-]+"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="tagline">Frase home</Label>
          <Input
            id="tagline"
            name="tagline"
            placeholder="Agua pura a tu puerta"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="about">Quiénes somos</Label>
          <Textarea id="about" name="about" rows={3} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="primaryColor">Color principal</Label>
            <Input
              id="primaryColor"
              name="primaryColor"
              defaultValue="#00B1E2"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="secondaryColor">Color secundario</Label>
            <Input
              id="secondaryColor"
              name="secondaryColor"
              defaultValue="#12326E"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">Ciudad</Label>
            <Input id="city" name="city" placeholder="Concepción" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="region">Región</Label>
            <Input id="region" name="region" placeholder="Biobío" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Teléfono</Label>
            <Input id="phone" name="phone" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email contacto</Label>
            <Input id="email" name="email" type="email" />
          </div>
        </div>

        <fieldset className="space-y-3 border-t border-[#d5e3ec] pt-5">
          <legend className="text-sm font-medium text-[var(--brand-deep)]">
            Admin de la empresa
          </legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="adminName">Nombre</Label>
              <Input id="adminName" name="adminName" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="adminEmail">Correo login</Label>
              <Input
                id="adminEmail"
                name="adminEmail"
                type="email"
                required
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="adminPassword">Contraseña temporal (mín. 12)</Label>
              <Input
                id="adminPassword"
                name="adminPassword"
                type="password"
                required
                minLength={12}
                autoComplete="new-password"
              />
            </div>
          </div>
        </fieldset>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="withSampleCatalog"
            defaultChecked
            className="size-4 accent-[var(--brand)]"
          />
          Incluir productos y zonas de ejemplo
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="withSandboxWebpay"
            defaultChecked
            className="size-4 accent-[var(--brand)]"
          />
          Adjuntar credenciales WebPay sandbox (Integration)
        </label>

        {error ? (
          <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <div className="flex justify-end border-t border-[#e8f0f5] pt-4">
          <Button type="submit">Crear empresa</Button>
        </div>
      </form>
      </Panel>
    </>
  );
}
