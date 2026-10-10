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
      <h1 className="rc-display text-3xl uppercase text-[var(--brand-deep)]">
        Marca y contenido
      </h1>
      <p className="mt-2 text-sm text-[#5a6578]">
        Barras superiores, hero, colores, contacto y textos de la tienda.
      </p>

      {ok ? (
        <p className="mt-4 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          Cambios guardados.
        </p>
      ) : null}
      {error ? (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <form action={updateBrandingAction} className="mt-8 space-y-5">
        <div className="space-y-2">
          <Label htmlFor="name">Nombre</Label>
          <Input id="name" name="name" required defaultValue={tenant.name} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tagline">Tagline</Label>
          <Input id="tagline" name="tagline" defaultValue={tenant.tagline ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="about">Quiénes somos</Label>
          <Textarea id="about" name="about" rows={4} defaultValue={tenant.about ?? ""} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="primaryColor">Color principal</Label>
            <Input id="primaryColor" name="primaryColor" required defaultValue={tenant.primaryColor} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="secondaryColor">Color secundario</Label>
            <Input id="secondaryColor" name="secondaryColor" required defaultValue={tenant.secondaryColor} />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="logoUrl">Logo (ruta o URL)</Label>
          <Input id="logoUrl" name="logoUrl" defaultValue={tenant.logoUrl ?? ""} placeholder="/brand/… o https://" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="deliveryBanner">Barra despacho</Label>
          <Textarea id="deliveryBanner" name="deliveryBanner" rows={2} defaultValue={tenant.deliveryBanner ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="hoursBanner">Barra horarios</Label>
          <Textarea id="hoursBanner" name="hoursBanner" rows={2} defaultValue={tenant.hoursBanner ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="heroImageUrl">Hero imagen</Label>
          <Input id="heroImageUrl" name="heroImageUrl" defaultValue={tenant.heroImageUrl ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="heroHeadline">Hero titular</Label>
          <Input id="heroHeadline" name="heroHeadline" defaultValue={tenant.heroHeadline ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="heroBody">Hero texto</Label>
          <Textarea id="heroBody" name="heroBody" rows={3} defaultValue={tenant.heroBody ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="coverageText">Cobertura (footer)</Label>
          <Textarea id="coverageText" name="coverageText" rows={3} defaultValue={tenant.coverageText ?? ""} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="phone">Teléfono</Label>
            <Input id="phone" name="phone" defaultValue={tenant.phone ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phoneSecondary">Teléfono 2</Label>
            <Input id="phoneSecondary" name="phoneSecondary" defaultValue={tenant.phoneSecondary ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="whatsapp">WhatsApp</Label>
            <Input id="whatsapp" name="whatsapp" defaultValue={tenant.whatsapp ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" defaultValue={tenant.email ?? ""} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="address">Dirección</Label>
            <Input id="address" name="address" defaultValue={tenant.address ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">Ciudad</Label>
            <Input id="city" name="city" defaultValue={tenant.city ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="region">Región</Label>
            <Input id="region" name="region" defaultValue={tenant.region ?? ""} />
          </div>
        </div>
        <Button type="submit">Guardar marca</Button>
      </form>
    </div>
  );
}
