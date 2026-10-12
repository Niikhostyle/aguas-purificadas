import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight } from "lucide-react";
import {
  loadDefaultDemoContentAction,
  updateModulesAction,
} from "@/app/admin/(panel)/modulos/actions";
import { ConfirmSubmitButton, PageHeader, adminButton } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { requireAdmin } from "@/lib/auth";
import {
  DEFAULT_MODULE_FLAGS,
  MODULE_LABELS,
  parseModuleFlags,
  parseModulesContent,
  type ModuleFlags,
} from "@/lib/modules";

export default async function ModulesAdminPage() {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin/login");
  if (admin.role === "super_admin" && admin.tenant.slug === "plataforma") {
    redirect("/admin/plataforma");
  }

  const flags = parseModuleFlags(
    admin.tenant.modulesEnabled ?? DEFAULT_MODULE_FLAGS,
  );
  const content = parseModulesContent(admin.tenant.modulesContent);

  const regionsText = content.regions
    .map((r) => (r.zone ? `${r.name} | ${r.zone}` : r.name))
    .join("\n");

  const flagKeys = Object.keys(MODULE_LABELS) as (keyof ModuleFlags)[];

  return (
    <div className="max-w-4xl">
      <PageHeader
        title="Módulos de la tienda"
        description="Activa o desactiva secciones de la tienda y edita su contenido. Los cambios se ven de inmediato en la tienda."
        breadcrumbs={[{ label: "Configuración" }, { label: "Módulos" }]}
      />

      <section className="mt-4 rounded-xl border border-[#dde7ee] bg-white p-5 shadow-[0_1px_2px_rgba(16,40,70,0.04)]">
        <h2 className="text-[15px] font-semibold text-[#12233d]">Contenido de tu página</h2>
        <p className="mt-1 text-xs text-[#5a6578]">Cada sección tiene su propio editor, con formularios simples y fotos.</p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ["/admin/beneficios", "¿Por qué elegirnos?", `${content.beneficios.length || 4} beneficio(s)`],
            ["/admin/contenido/planes", "Planes", `${content.planes.length} plan(es)`],
            ["/admin/contenido/kits", "Kits", `${content.kits.length} kit(s)`],
            ["/admin/contenido/certificaciones", "Certificaciones", `${content.certificaciones.length} certificación(es)`],
            ["/admin/contenido/redes", "Redes y videos", `${content.redes.length} video(s)`],
            ["/admin/descuentos", "Descuentos", "Ofertas y cupones"],
          ].map(([href, label, hint]) => (
            <Link
              key={href}
              href={href}
              className="group flex items-center justify-between gap-3 rounded-lg border border-[#e8f0f5] px-3 py-2.5 transition hover:border-[var(--brand)] hover:bg-[color-mix(in_srgb,var(--brand)_5%,white)]"
            >
              <span>
                <span className="block text-sm font-semibold text-[#12233d]">{label}</span>
                <span className="block text-xs text-[#5a6578]">{hint}</span>
              </span>
              <ChevronRight className="size-4 text-[#9fb3c4] transition group-hover:translate-x-0.5 group-hover:text-[var(--brand)]" aria-hidden />
            </Link>
          ))}
        </div>
      </section>

      <form action={loadDefaultDemoContentAction} className="mt-4">
        <ConfirmSubmitButton
          tone="warning"
          confirmTitle="¿Cargar contenido demo?"
          confirmText="Se reemplazan los textos de Hogar/Empresa, planes, kits, certificaciones y beneficios por el contenido de ejemplo. Los descuentos se configuran en «Descuentos»."
          confirmLabel="Cargar demo"
          className={adminButton({ variant: "secondary", size: "sm" })}
        >
          Cargar contenido demo (Hogar/Empresa)
        </ConfirmSubmitButton>
      </form>

      <form action={updateModulesAction} className="mt-6 space-y-6">
        <section className="rounded-xl border border-[#dde7ee] bg-white p-5 shadow-[0_1px_2px_rgba(16,40,70,0.04)]">
          <h2 className="text-[15px] font-semibold text-[#12233d]">
            Activar módulos
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {flagKeys.map((key) => (
              <label
                key={key}
                className="flex items-center gap-2 rounded-lg border border-[#e8f0f5] px-3 py-2 text-sm"
              >
                <input
                  type="checkbox"
                  name={key}
                  defaultChecked={flags[key]}
                  className="size-4 accent-[var(--brand)]"
                />
                <span>{MODULE_LABELS[key]}</span>
              </label>
            ))}
          </div>
        </section>

        <section className="space-y-3 rounded-xl border border-[#dde7ee] bg-white p-5 shadow-[0_1px_2px_rgba(16,40,70,0.04)]">
          <h2 className="text-[15px] font-semibold text-[#12233d]">
            Ciudades / regiones
          </h2>
          <p className="text-xs text-[#5a6578]">
            Una por línea. Formato: <code>Ciudad | Región</code>
          </p>
          <Textarea
            name="regionsText"
            rows={6}
            defaultValue={regionsText}
            placeholder={"Santiago | Región Metropolitana\nTalca | Maule"}
          />
        </section>

        <section className="grid gap-4 rounded-xl border border-[#dde7ee] bg-white p-5 shadow-[0_1px_2px_rgba(16,40,70,0.04)] sm:grid-cols-2">
          <h2 className="sm:col-span-2 text-[15px] font-semibold text-[#12233d]">
            Copy Hogar / Empresa
          </h2>
          <div className="space-y-2">
            <Label htmlFor="hogarHeadline">Hogar · titular</Label>
            <Input
              id="hogarHeadline"
              name="hogarHeadline"
              defaultValue={content.hogar?.headline ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="empresaHeadline">Empresa · titular</Label>
            <Input
              id="empresaHeadline"
              name="empresaHeadline"
              defaultValue={content.empresa?.headline ?? ""}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="hogarBody">Hogar · texto</Label>
            <Textarea
              id="hogarBody"
              name="hogarBody"
              rows={2}
              defaultValue={content.hogar?.body ?? ""}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="empresaBody">Empresa · texto</Label>
            <Textarea
              id="empresaBody"
              name="empresaBody"
              rows={2}
              defaultValue={content.empresa?.body ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hogarCtaLabel">Hogar · CTA</Label>
            <Input
              id="hogarCtaLabel"
              name="hogarCtaLabel"
              defaultValue={content.hogar?.ctaLabel ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hogarCtaHref">Hogar · enlace CTA</Label>
            <Input
              id="hogarCtaHref"
              name="hogarCtaHref"
              defaultValue={content.hogar?.ctaHref ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="empresaCtaLabel">Empresa · CTA</Label>
            <Input
              id="empresaCtaLabel"
              name="empresaCtaLabel"
              defaultValue={content.empresa?.ctaLabel ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="empresaCtaHref">Empresa · enlace CTA</Label>
            <Input
              id="empresaCtaHref"
              name="empresaCtaHref"
              defaultValue={content.empresa?.ctaHref ?? ""}
            />
          </div>
        </section>

        <Button type="submit" className="bg-[var(--brand)] hover:bg-[var(--brand-deep)]">
          Guardar módulos
        </Button>
      </form>
    </div>
  );
}
