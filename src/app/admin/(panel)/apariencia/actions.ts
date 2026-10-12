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
import { saveAppearanceAsset, type AppearanceAssetKind } from "@/lib/uploads";

const PAGE = "/admin/apariencia";

const identitySchema = z.object({
  name: z.string().trim().min(2).max(120),
  tagline: z.string().trim().max(200),
  primaryColor: z.string().trim().regex(HEX_RE),
  secondaryColor: z.string().trim().regex(HEX_RE),
});

const IMAGE_KIND: Record<ImageKey, AppearanceAssetKind> = {
  faviconUrl: "favicon",
  logoDarkUrl: "logo",
  panelLogoUrl: "logo",
  loginBgUrl: "background",
  loginLogoUrl: "logo",
};

function fail(message: string): never {
  redirect(`${PAGE}?error=${encodeURIComponent(message)}`);
}

function revalidateAll() {
  revalidatePath("/", "layout");
  revalidatePath(PAGE);
}

export async function saveAppearanceAction(formData: FormData) {
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
  let logoUrl = admin.tenant.logoUrl;

  try {
    const logoFile = formData.get("logoFile");
    if (logoFile instanceof File && logoFile.size > 0) {
      logoUrl = await saveAppearanceAsset(slug, logoFile, "logo");
    } else if (str("clear_logoUrl") === "1") {
      logoUrl = null;
    }
    for (const key of IMAGE_KEYS) {
      const file = formData.get(`file_${key}`);
      if (file instanceof File && file.size > 0) {
        next[key] = await saveAppearanceAsset(slug, file, IMAGE_KIND[key]);
      } else if (str(`clear_${key}`) !== "1" && current[key]) {
        next[key] = current[key];
      }
    }
  } catch (e) {
    fail(e instanceof Error ? e.message : "No se pudo subir la imagen");
  }

  const base = baseColors(identity.data);
  const appearance = compactOverrides(base, next);

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

  revalidateAll();
  redirect(`${PAGE}?ok=1`);
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
