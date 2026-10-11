import Link from "next/link";
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
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--brand)]">Landing mibidon.cl</p>
          <h1 className="mt-1 font-[family-name:var(--font-display)] text-2xl text-[var(--brand-deep)] md:text-3xl">
            Configuración de la landing
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-[#5a6578]">
            Activa o desactiva cada bloque de la página de ventas. Los cambios se publican al instante; una
            sección desactivada no se muestra y sus enlaces del menú desaparecen.
          </p>
        </div>
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-semibold text-[var(--brand)] hover:underline"
        >
          Ver landing ↗
        </a>
      </header>

      {dbError ? (
        <p className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
          No se pudo leer la base de datos. Se muestran los valores por defecto; los cambios no se guardarán
          hasta que la conexión vuelva.
        </p>
      ) : null}

      {groups.map((g) => (
        <section key={g.label} className="overflow-hidden rounded-2xl border border-[#d5e3ec] bg-white shadow-sm">
          <h2 className="border-b border-[#e3ebf1] bg-[#f7fbfd] px-5 py-2.5 text-xs font-bold uppercase tracking-[0.14em] text-[#5a6578]">
            {g.label}
          </h2>
          <ul className="divide-y divide-[#e3ebf1]">
            {g.items.map((s) => {
              const at = updated.get(s.key);
              return (
                <li key={s.key} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
                  <div className="min-w-0">
                    <Link
                      href={`/admin/plataforma/landing/${s.slug}`}
                      className="font-semibold text-[var(--brand-deep)] hover:text-[var(--brand)] hover:underline"
                    >
                      {s.title}
                    </Link>
                    <p className="text-xs text-[#5a6578]">{s.description}</p>
                    {at ? (
                      <p className="text-[11px] text-[#8a96a6]">Editado {at.toLocaleString("es-CL")}</p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-4">
                    <SectionToggle sectionKey={s.key} title={s.title} initial={content[s.key].enabled} />
                    <Link
                      href={`/admin/plataforma/landing/${s.slug}`}
                      className="text-sm font-semibold text-[var(--brand)] hover:underline"
                    >
                      Editar
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
