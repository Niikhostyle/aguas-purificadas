"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  appearanceSchema,
  baseColors,
  compactOverrides,
  HEX_RE,
  IMAGE_KEYS,
  parseAppearance,
  type AppearanceOverrides,
  type ImageKey,
} from "@/lib/appearance";
import { prisma } from "@/lib/db";
import { requireTenantAdmin } from "@/lib/tenant-admin";
import { isOwnAppearanceAsset } from "@/lib/uploads";

const PAGE = "/admin/apariencia";

const identitySchema = z.object({
  name: z.string().trim().min(2).max(120),
  tagline: z.string().trim().max(200),
  primaryColor: z.string().trim().regex(HEX_RE),
  secondaryColor: z.string().trim().regex(HEX_RE),
});

export type SaveAppearanceState = { error: string | null; at: number };

class SaveError extends Error {}

function fail(message: string): never {
  throw new SaveError(message);
}

function revalidateAll() {
  revalidatePath("/", "layout");
  revalidatePath(PAGE);
}

/** Errors come back as state so the editor keeps every unsaved change on screen. */
export async function saveAppearanceAction(
  _prev: SaveAppearanceState,
  formData: FormData,
): Promise<SaveAppearanceState> {
  try {
    await saveAppearance(formData);
  } catch (e) {
    if (e instanceof SaveError) return { error: e.message, at: Date.now() };
    throw e;
  }
  revalidateAll();
  redirect(`${PAGE}?ok=1`);
}

async function saveAppearance(formData: FormData) {
  const { admin, tenantId } = await requireTenantAdmin();
  const slug = admin.tenant.slug;
  const str = (key: string) => String(formData.get(key) ?? "").trim();

  const identity = identitySchema.safeParse({
    name: str("name"),
    tagline: str("tagline"),
    primaryColor: str("primaryColor"),
    secondaryColor: str("secondaryColor"),
  });
  if (!identity.success) {
    const bad = identity.error.issues[0]?.path[0];
    fail(
      bad === "primaryColor" || bad === "secondaryColor"
        ? "Los colores deben ser hex #RRGGBB"
        : "Revisa el nombre (2 a 120 caracteres) y el tagline",
    );
  }

  let submitted: unknown;
  try {
    submitted = JSON.parse(str("appearanceJson") || "{}");
  } catch {
    fail("No se pudo leer la configuración enviada");
  }
  if (submitted && typeof submitted === "object") {
    for (const k of IMAGE_KEYS) delete (submitted as Record<string, unknown>)[k];
  }
  const parsed = appearanceSchema.safeParse(submitted);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    fail(
      issue?.code === "invalid_format"
        ? `Color inválido en "${String(issue.path[0])}": usa formato #RRGGBB`
        : "Revisa los valores de apariencia",
    );
  }

  const current = parseAppearance(admin.tenant.appearance);
  const next: AppearanceOverrides = { ...parsed.data };

  // Images are uploaded one by one beforehand; the save only carries their URLs.
  const imageUrl = (key: ImageKey | "logoUrl", saved: string | null | undefined): string | null => {
    const v = str(`img_${key}`);
    if (!v) return null;
    if (v === saved) return saved;
    if (!isOwnAppearanceAsset(slug, v)) {
      fail("Una de las imágenes no es válida. Vuelve a seleccionarla e inténtalo de nuevo.");
    }
    return v;
  };

  const logoUrl = imageUrl("logoUrl", admin.tenant.logoUrl);
  for (const key of IMAGE_KEYS) {
    const url = imageUrl(key, current[key]);
    if (url) next[key] = url;
  }

  const base = baseColors(identity.data);
  const appearance = compactOverrides(base, next);

  try {
    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        name: identity.data.name,
        tagline: identity.data.tagline || null,
        primaryColor: base.primary.toUpperCase(),
        secondaryColor: base.secondary.toUpperCase(),
        logoUrl,
        appearance: Object.keys(appearance).length ? appearance : Prisma.DbNull,
      },
    });
  } catch (e) {
    console.error("[apariencia] save failed", e);
    fail("No pudimos guardar los cambios. Inténtalo de nuevo en unos segundos.");
  }
}

export async function resetAppearanceAction() {
  const { tenantId } = await requireTenantAdmin();
  await prisma.tenant.update({
    where: { id: tenantId },
    data: { appearance: Prisma.DbNull },
  });
  revalidateAll();
  redirect(`${PAGE}?ok=reset`);
}
