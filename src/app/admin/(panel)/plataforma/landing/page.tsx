import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { PageHeader, Panel, StatusBadge, adminButton } from "@/components/admin/ui";
import { redirect } from "next/navigation";
import { SectionToggle } from "@/components/admin/landing/section-switch";
import { requireSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { SECTION_META } from "@/lib/landing/admin-fields";
import { readLandingContent } from "@/lib/landing/content";
import { LANDING_DEFAULTS } from "@/lib/landing/defaults";

export const dynamic = "force-dynamic";

export default async function LandingGlobalPage() {
  const admin = await requireSuperAdmin();
  if (!admin) redirect("/admin/login?tenant=plataforma");

  let content = LANDING_DEFAULTS;
  let updated = new Map<string, Date>();
  let dbError = false;
  try {
    content = await readLandingContent();
    const rows = await prisma.platformLandingSection.findMany({ select: { key: true, updatedAt: true } });
    updated = new Map(rows.map((r) => [r.key, r.updatedAt]));
  } catch {
    dbError = true;
  }

  const groups = [
    { label: "Contenido", items: SECTION_META.filter((s) => s.primary) },
    { label: "Otros bloques", items: SECTION_META.filter((s) => !s.primary) },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Landing CMS"
        description="Activa o desactiva cada bloque de la página de ventas. Los cambios se publican al instante; una sección desactivada no se muestra y sus enlaces del menú desaparecen."
        homeHref="/admin/plataforma"
        breadcrumbs={[{ label: "Plataforma", href: "/admin/plataforma" }, { label: "Landing CMS" }]}
        actions={
          <a href="/" target="_blank" rel="noopener noreferrer" className={adminButton({ variant: "secondary" })}>
            <ExternalLink aria-hidden />
            Ver landing
          </a>
        }
      />

      {dbError ? (
        <p role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
          No se pudo leer la base de datos. Se muestran los valores por defecto; los cambios no se guardarán
          hasta que la conexión vuelva.
        </p>
      ) : null}

      {groups.map((g) => (
        <Panel key={g.label} title={g.label} description={`${g.items.length} bloques`} flush>
          <ul className="divide-y divide-[#eef3f7]">
            {g.items.map((s) => {
              const at = updated.get(s.key);
              return (
                <li key={s.key} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 hover:bg-[#f7fbfd]">
                  <div className="min-w-0">
                    <Link
                      href={`/admin/plataforma/landing/${s.slug}`}
                      className="font-semibold text-[var(--brand-deep)] hover:text-[var(--brand)] hover:underline"
                    >
                      {s.title}
                    </Link>
                    <p className="text-xs text-[#5a6578]">{s.description}</p>
                    <p className="mt-0.5">
                      {at ? (
                        <StatusBadge tone="info">Editado {at.toLocaleString("es-CL")}</StatusBadge>
                      ) : (
                        <StatusBadge tone="neutral">Contenido por defecto</StatusBadge>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <SectionToggle sectionKey={s.key} title={s.title} initial={content[s.key].enabled} />
                    <Link
                      href={`/admin/plataforma/landing/${s.slug}`}
                      className={adminButton({ variant: "secondary", size: "sm" })}
                    >
                      Editar
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        </Panel>
      ))}
    </div>
  );
}
