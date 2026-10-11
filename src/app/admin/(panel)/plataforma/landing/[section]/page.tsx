import { notFound, redirect } from "next/navigation";
import { SectionEditor } from "@/components/admin/landing/section-editor";
import { requireSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sectionBySlug } from "@/lib/landing/admin-fields";
import { readLandingContent } from "@/lib/landing/content";
import { LANDING_DEFAULTS } from "@/lib/landing/defaults";

export const dynamic = "force-dynamic";

export default async function LandingSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const admin = await requireSuperAdmin();
  if (!admin) redirect("/admin/login?tenant=plataforma");

  const { section } = await params;
  const meta = sectionBySlug(section);
  if (!meta) notFound();

  let current = LANDING_DEFAULTS[meta.key];
  let row: { updatedAt: Date; updatedBy: string | null } | null = null;
  let dbError = false;
  try {
    current = (await readLandingContent())[meta.key];
    row = await prisma.platformLandingSection.findUnique({
      where: { key: meta.key },
      select: { updatedAt: true, updatedBy: true },
    });
  } catch {
    dbError = true;
  }

  return (
    <div className="space-y-4">
      {dbError ? (
        <p className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
          No se pudo leer la base de datos; se muestran los valores por defecto.
        </p>
      ) : null}
      <SectionEditor
        key={meta.key}
        sectionKey={meta.key}
        initialEnabled={current.enabled}
        initialContent={current.content as Record<string, unknown>}
        updatedAt={row?.updatedAt.toISOString() ?? null}
        updatedBy={row?.updatedBy ?? null}
      />
    </div>
  );
}
