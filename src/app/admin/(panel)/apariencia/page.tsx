import { AppearanceEditor } from "@/components/admin/appearance-editor";
import { Flash } from "@/components/admin/dispatch-ui";
import { PageHeader } from "@/components/admin/ui";
import { parseAppearance } from "@/lib/appearance";
import { parseHeroSlides } from "@/lib/hero-slides";
import { requireTenantAdmin } from "@/lib/tenant-admin";

export const metadata = { title: "Apariencia" };

export default async function AppearancePage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { admin } = await requireTenantAdmin();
  const tenant = admin.tenant;
  const { ok, error } = await searchParams;
  const overrides = parseAppearance(tenant.appearance);

  return (
    <div className="max-w-6xl">
      <PageHeader
        title="Apariencia"
        description="Logos, íconos y colores de tu tienda y de este panel. Los cambios se ven en la vista previa y se aplican al guardar."
        breadcrumbs={[{ label: "Configuración" }, { label: "Apariencia" }]}
      />
      <Flash
        ok={
          ok === "reset"
            ? "Se restauraron los valores originales."
            : ok
              ? "Cambios guardados."
              : undefined
        }
        error={error}
      />
      <AppearanceEditor
        key={tenant.updatedAt.toISOString()}
        initial={{
          name: tenant.name,
          tagline: tenant.tagline ?? "",
          primaryColor: tenant.primaryColor,
          secondaryColor: tenant.secondaryColor,
          logoUrl: tenant.logoUrl,
          overrides,
        }}
        heroImageUrl={parseHeroSlides(tenant.heroSlides)[0]?.imageUrl ?? tenant.heroImageUrl}
      />
    </div>
  );
}
