"use server";

import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import { requireSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { LANDING_CACHE_TAG } from "@/lib/landing/content";
import { LANDING_DEFAULTS } from "@/lib/landing/defaults";
import { isLandingSectionKey, landingSchemas, type LandingSectionKey } from "@/lib/landing/schema";

export type LandingActionResult =
  | { ok: true; savedAt: string }
  | { ok: false; error: string; issues?: { path: string; message: string }[] };

const MAX_PAYLOAD_BYTES = 64 * 1024;
const DENIED: LandingActionResult = { ok: false, error: "Sesión de super-admin requerida" };

function invalidate() {
  updateTag(LANDING_CACHE_TAG);
  revalidatePath("/mibidon");
  revalidatePath("/");
  revalidatePath("/admin/plataforma/landing", "layout");
}

async function persist(
  key: LandingSectionKey,
  enabled: boolean,
  content: unknown,
  updatedBy: string,
): Promise<LandingActionResult> {
  const data = { enabled, content: content as object, updatedBy };
  await prisma.platformLandingSection.upsert({
    where: { key },
    create: { key, ...data },
    update: data,
  });
  invalidate();
  return { ok: true, savedAt: new Date().toISOString() };
}

export async function saveLandingSectionAction(
  key: string,
  enabled: unknown,
  content: unknown,
): Promise<LandingActionResult> {
  const admin = await requireSuperAdmin();
  if (!admin) return DENIED;
  if (!isLandingSectionKey(key)) return { ok: false, error: "Sección desconocida" };
  if (typeof enabled !== "boolean") return { ok: false, error: "Estado inválido" };
  if (JSON.stringify(content ?? null).length > MAX_PAYLOAD_BYTES) {
    return { ok: false, error: "Contenido demasiado grande" };
  }

  const parsed = landingSchemas[key].safeParse(content);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Revisa los campos marcados",
      issues: parsed.error.issues.slice(0, 20).map((i) => ({
        path: i.path.join("."),
        message: i.message,
      })),
    };
  }
  return persist(key, enabled, parsed.data, admin.email);
}

const toggleInput = z.object({ key: z.string().max(40), enabled: z.boolean() });

export async function setLandingSectionEnabledAction(
  key: string,
  enabled: boolean,
): Promise<LandingActionResult> {
  const admin = await requireSuperAdmin();
  if (!admin) return DENIED;
  const input = toggleInput.safeParse({ key, enabled });
  if (!input.success || !isLandingSectionKey(input.data.key)) {
    return { ok: false, error: "Sección desconocida" };
  }
  const k = input.data.key;
  const existing = await prisma.platformLandingSection.findUnique({ where: { key: k } });
  const current = existing ? landingSchemas[k].safeParse(existing.content) : null;
  const content = current?.success ? current.data : LANDING_DEFAULTS[k].content;
  return persist(k, input.data.enabled, content, admin.email);
}

export async function resetLandingSectionAction(key: string): Promise<LandingActionResult> {
  const admin = await requireSuperAdmin();
  if (!admin) return DENIED;
  if (!isLandingSectionKey(key)) return { ok: false, error: "Sección desconocida" };
  const def = LANDING_DEFAULTS[key];
  return persist(key, def.enabled, def.content, admin.email);
}
