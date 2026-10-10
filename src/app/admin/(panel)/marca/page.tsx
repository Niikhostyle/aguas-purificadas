import { redirect } from "next/navigation";
import { updateBrandingAction } from "@/app/admin/(panel)/marca/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { requireAdmin } from "@/lib/auth";

export default async function BrandingAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin/login");
  if (admin.role === "super_admin" && admin.tenant.slug === "plataforma") {
    redirect("/admin/plataforma");
  }

  const tenant = admin.tenant;
  const { ok, error } = await searchParams;

  return (
    <div className="max-w-2xl">
      <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--brand-deep)]">
        Marca y contenido
      </h1>
      <p className="mt-2 text-sm text-[#4a655f]">
        Estos datos alimentan la tienda pública (colores, contacto y textos).
      </p>

      {ok ? (
        <p className="mt-4 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          Cambios guardados. Revisá la tienda para verlos.
        </p>
      ) : null}
      {error ? (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <form action={updateBrandingAction} className="mt-8 space-y-5">
        <div className="space-y-2">
          <Label htmlFor="name">Nombre de la empresa</Label>
          <Input id="name" name="name" required defaultValue={tenant.name} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tagline">Frase de la home</Label>
          <Input
            id="tagline"
            name="tagline"
            defaultValue={tenant.tagline ?? ""}
            placeholder="Agua purificada a domicilio"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="about">Quiénes somos</Label>
          <Textarea
            id="about"
            name="about"
            rows={5}
            defaultValue={tenant.about ?? ""}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="primaryColor">Color principal (#RRGGBB)</Label>
            <Input
              id="primaryColor"
              name="primaryColor"
              defaultValue={tenant.primaryColor}
              pattern="^#[0-9A-Fa-f]{6}$"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="secondaryColor">Color secundario (#RRGGBB)</Label>
            <Input
              id="secondaryColor"
              name="secondaryColor"
              defaultValue={tenant.secondaryColor}
              pattern="^#[0-9A-Fa-f]{6}$"
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="logoUrl">URL del logo</Label>
          <Input
            id="logoUrl"
            name="logoUrl"
            type="url"
            defaultValue={tenant.logoUrl ?? ""}
            placeholder="https://…"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="phone">Teléfono</Label>
            <Input id="phone" name="phone" defaultValue={tenant.phone ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="whatsapp">WhatsApp</Label>
            <Input
              id="whatsapp"
              name="whatsapp"
              defaultValue={tenant.whatsapp ?? ""}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="email">Correo de contacto</Label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={tenant.email ?? ""}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="address">Dirección</Label>
            <Input
              id="address"
              name="address"
              defaultValue={tenant.address ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">Ciudad</Label>
            <Input id="city" name="city" defaultValue={tenant.city ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="region">Región</Label>
            <Input
              id="region"
              name="region"
              defaultValue={tenant.region ?? ""}
            />
          </div>
        </div>
        <Button type="submit">Guardar marca</Button>
      </form>
    </div>
  );
}
