"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  DEFAULT_MODULE_FLAGS,
  parseModulesContent,
  type ModuleFlags,
  type ModulesContent,
} from "@/lib/modules";

function flagFromForm(formData: FormData, key: keyof ModuleFlags): boolean {
  return formData.get(key) === "on";
}

export async function updateModulesAction(formData: FormData) {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin/login");
  if (admin.role === "super_admin" && admin.tenant.slug === "plataforma") {
    redirect("/admin/plataforma");
  }

  const modulesEnabled: ModuleFlags = {
    descuentos: flagFromForm(formData, "descuentos"),
    planes: flagFromForm(formData, "planes"),
    kits: flagFromForm(formData, "kits"),
    redes: flagFromForm(formData, "redes"),
    certificaciones: flagFromForm(formData, "certificaciones"),
    loginClientes: flagFromForm(formData, "loginClientes"),
    selectorRegion: flagFromForm(formData, "selectorRegion"),
    hogarEmpresa: flagFromForm(formData, "hogarEmpresa"),
    despacho: flagFromForm(formData, "despacho"),
    recordatorios: flagFromForm(formData, "recordatorios"),
    envases: flagFromForm(formData, "envases"),
  };

  // Preserve existing structured content; only overwrite text fields from form
  const prev = parseModulesContent(admin.tenant.modulesContent);
  const regionsRaw = String(formData.get("regionsText") || "");
  const regions = regionsRaw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, i) => {
      const [name, zone] = line.split("|").map((s) => s.trim());
      return {
        id: prev.regions[i]?.id || `r-${i + 1}`,
        name: name || line,
        zone: zone || undefined,
      };
    });

  const descuentosJson = String(formData.get("descuentosJson") || "").trim();
  const planesJson = String(formData.get("planesJson") || "").trim();
  const kitsJson = String(formData.get("kitsJson") || "").trim();
  const redesJson = String(formData.get("redesJson") || "").trim();
  const certsJson = String(formData.get("certificacionesJson") || "").trim();

  const safeParse = <T,>(raw: string, fallback: T): T => {
    if (!raw) return fallback;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  };

  const modulesContent: ModulesContent = {
    regions,
    descuentos: safeParse(descuentosJson, prev.descuentos),
    planes: safeParse(planesJson, prev.planes),
    kits: safeParse(kitsJson, prev.kits),
    redes: safeParse(redesJson, prev.redes),
    certificaciones: safeParse(certsJson, prev.certificaciones),
    hogar: {
      headline: String(formData.get("hogarHeadline") || "").trim() || undefined,
      body: String(formData.get("hogarBody") || "").trim() || undefined,
      ctaLabel: String(formData.get("hogarCtaLabel") || "").trim() || undefined,
      ctaHref: String(formData.get("hogarCtaHref") || "").trim() || undefined,
    },
    empresa: {
      headline: String(formData.get("empresaHeadline") || "").trim() || undefined,
      body: String(formData.get("empresaBody") || "").trim() || undefined,
      ctaLabel: String(formData.get("empresaCtaLabel") || "").trim() || undefined,
      ctaHref: String(formData.get("empresaCtaHref") || "").trim() || undefined,
    },
  };

  // Validate JSON blobs via parser (drops invalid items)
  const normalized = parseModulesContent(modulesContent);

  await prisma.tenant.update({
    where: { id: admin.tenantId },
    data: {
      modulesEnabled,
      modulesContent: normalized,
      youtubeUrl: String(formData.get("youtubeUrl") || "").trim() || null,
      instagramUrl: String(formData.get("instagramUrl") || "").trim() || null,
      facebookUrl: String(formData.get("facebookUrl") || "").trim() || null,
    },
  });

  revalidatePath("/");
  revalidatePath("/admin/modulos");
  redirect("/admin/modulos?ok=1");
}

export async function loadDefaultDemoContentAction() {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin/login");
  const { defaultDemoModulesContent } = await import("@/lib/modules");
  await prisma.tenant.update({
    where: { id: admin.tenantId },
    data: {
      modulesEnabled: DEFAULT_MODULE_FLAGS,
      modulesContent: defaultDemoModulesContent(),
    },
  });
  revalidatePath("/");
  revalidatePath("/admin/modulos");
  redirect("/admin/modulos?ok=1");
}
