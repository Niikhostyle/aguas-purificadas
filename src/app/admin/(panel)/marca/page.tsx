import { redirect } from "next/navigation";
import { updateBrandingAction } from "@/app/admin/(panel)/marca/actions";
import { BannerSlidesEditor } from "@/components/admin/banner-slides-editor";
import { PageHeader } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { requireAdmin } from "@/lib/auth";
import { parseHeroSlides } from "@/lib/hero-slides";

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
  const slides = parseHeroSlides(tenant.heroSlides);

  return (
    <div className="max-w-4xl">
      <PageHeader
        title="Marca y contenido"
        description="Personaliza toda tu tienda: logo, colores, barras, banners del inicio y textos de contacto."
        breadcrumbs={[{ label: "Configuración" }, { label: "Marca" }]}
      />

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

      <form
        action={updateBrandingAction}
        encType="multipart/form-data"
        className="space-y-6"
      >
        <section className="space-y-5 rounded-xl border border-[#dde7ee] bg-white p-5 shadow-[0_1px_2px_rgba(16,40,70,0.04)]">
          <h2 className="-mx-5 -mt-5 mb-5 border-b border-[#e8f0f5] px-5 py-3.5 text-[15px] font-semibold text-[#12233d]">
            Identidad
          </h2>
          <div className="space-y-2">
            <Label htmlFor="name">Nombre de la tienda</Label>
            <Input id="name" name="name" required defaultValue={tenant.name} />
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
              rows={4}
              defaultValue={tenant.about ?? ""}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="primaryColor">Color principal</Label>
              <Input
                id="primaryColor"
                name="primaryColor"
                required
                defaultValue={tenant.primaryColor}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="secondaryColor">Color secundario</Label>
              <Input
                id="secondaryColor"
                name="secondaryColor"
                required
                defaultValue={tenant.secondaryColor}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="logoFile">Logo (subir archivo)</Label>
            <Input
              id="logoFile"
              name="logoFile"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
            />
            <p className="text-xs text-[#5a6578]">
              Se guarda en <code>public/uploads/{tenant.slug}/logo/</code>. Máx.
              5 MB.
            </p>
            {tenant.logoUrl ? (
              <div className="flex items-center gap-3 pt-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={tenant.logoUrl}
                  alt=""
                  className="h-12 w-auto object-contain"
                />
                <span className="truncate text-xs text-[#5a6578]">
                  {tenant.logoUrl}
                </span>
              </div>
            ) : null}
            <input type="hidden" name="logoUrl" value={tenant.logoUrl ?? ""} />
          </div>
        </section>

        <section className="space-y-5 rounded-xl border border-[#dde7ee] bg-white p-5 shadow-[0_1px_2px_rgba(16,40,70,0.04)]">
          <h2 className="-mx-5 -mt-5 mb-5 border-b border-[#e8f0f5] px-5 py-3.5 text-[15px] font-semibold text-[#12233d]">
            Barras superiores
          </h2>
          <div className="space-y-2">
            <Label htmlFor="deliveryBanner">Barra despacho</Label>
            <Textarea
              id="deliveryBanner"
              name="deliveryBanner"
              rows={2}
              defaultValue={tenant.deliveryBanner ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hoursBanner">Barra horarios</Label>
            <Textarea
              id="hoursBanner"
              name="hoursBanner"
              rows={2}
              defaultValue={tenant.hoursBanner ?? ""}
            />
          </div>
        </section>

        <BannerSlidesEditor initialSlides={slides} />

        <section className="space-y-5 rounded-xl border border-[#dde7ee] bg-white p-5 shadow-[0_1px_2px_rgba(16,40,70,0.04)]">
          <h2 className="-mx-5 -mt-5 mb-5 border-b border-[#e8f0f5] px-5 py-3.5 text-[15px] font-semibold text-[#12233d]">
            Textos de respaldo del hero
          </h2>
          <p className="text-sm text-[#5a6578]">
            Se usan si un slide no tiene título/subtítulo, o si todavía no
            cargaste banners.
          </p>
          <div className="space-y-2">
            <Label htmlFor="heroHeadline">Titular por defecto</Label>
            <Input
              id="heroHeadline"
              name="heroHeadline"
              defaultValue={tenant.heroHeadline ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="heroBody">Texto por defecto</Label>
            <Textarea
              id="heroBody"
              name="heroBody"
              rows={3}
              defaultValue={tenant.heroBody ?? ""}
            />
          </div>
        </section>

        <section className="space-y-5 rounded-xl border border-[#dde7ee] bg-white p-5 shadow-[0_1px_2px_rgba(16,40,70,0.04)]">
          <h2 className="-mx-5 -mt-5 mb-5 border-b border-[#e8f0f5] px-5 py-3.5 text-[15px] font-semibold text-[#12233d]">
            Contacto y cobertura
          </h2>
          <div className="space-y-2">
            <Label htmlFor="coverageText">Cobertura (footer)</Label>
            <Textarea
              id="coverageText"
              name="coverageText"
              rows={3}
              defaultValue={tenant.coverageText ?? ""}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input id="phone" name="phone" defaultValue={tenant.phone ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phoneSecondary">Teléfono 2</Label>
              <Input
                id="phoneSecondary"
                name="phoneSecondary"
                defaultValue={tenant.phoneSecondary ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input
                id="whatsapp"
                name="whatsapp"
                defaultValue={tenant.whatsapp ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
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
        </section>

        <Button type="submit">Guardar marca</Button>
      </form>
    </div>
  );
}
