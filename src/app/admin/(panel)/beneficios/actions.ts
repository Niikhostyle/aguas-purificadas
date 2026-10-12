"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { GENERIC_BENEFITS, MAX_BENEFITS, parseModulesContent, type BenefitItem, type ModulesContent } from "@/lib/modules";
import { saveBenefitImage } from "@/lib/uploads";

const BASE = "/admin/beneficios";

async function requireTenantAdmin() {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin/login");
  if (admin.role === "super_admin" && admin.tenant.slug === "plataforma") {
    redirect("/admin/plataforma");
  }
  return admin;
}

function done(kind: "ok" | "error", message: string): never {
  redirect(`${BASE}?${kind}=${encodeURIComponent(message)}`);
}

function text(formData: FormData, key: string, max: number): string {
  return String(formData.get(key) ?? "").trim().slice(0, max);
}

/** The store shows GENERIC_BENEFITS until it has its own, so editing starts from that list. */
function editableContent(raw: unknown): ModulesContent {
  const content = parseModulesContent(raw);
  if (content.beneficios.length === 0) content.beneficios = GENERIC_BENEFITS.map((b) => ({ ...b }));
  return content;
}

async function saveContent(tenantId: string, content: ModulesContent) {
  await prisma.tenant.update({
    where: { id: tenantId },
    data: { modulesContent: parseModulesContent(content) },
  });
  revalidatePath(BASE);
  revalidatePath("/", "layout");
}

export async function saveBenefitsTitleAction(formData: FormData) {
  const admin = await requireTenantAdmin();
  const content = parseModulesContent(admin.tenant.modulesContent);
  content.beneficiosTitle = text(formData, "title", 80) || undefined;
  await saveContent(admin.tenantId, content);
  done("ok", "Título de la sección guardado.");
}

export async function saveBenefitAction(formData: FormData) {
  const admin = await requireTenantAdmin();
  const content = editableContent(admin.tenant.modulesContent);
  const id = text(formData, "id", 40);
  const title = text(formData, "title", 60);
  const body = text(formData, "body", 220);
  if (!title) done("error", "El beneficio necesita un título.");

  const index = id ? content.beneficios.findIndex((b) => b.id === id) : -1;
  if (id && index < 0) done("error", "Ese beneficio ya no existe.");
  if (!id && content.beneficios.length >= MAX_BENEFITS) {
    done("error", `Puedes tener hasta ${MAX_BENEFITS} beneficios.`);
  }

  const current = index >= 0 ? content.beneficios[index] : undefined;
  let imageUrl = current?.imageUrl;
  if (formData.get("removeImage") === "on") imageUrl = undefined;
  const file = formData.get("image");
  if (file instanceof File && file.size > 0) {
    try {
      imageUrl = await saveBenefitImage(admin.tenant.slug, file);
    } catch (e) {
      done("error", e instanceof Error ? e.message : "No se pudo guardar la imagen.");
    }
  }

  const item: BenefitItem = {
    id: current?.id ?? `b-${randomBytes(4).toString("hex")}`,
    title,
    body: body || undefined,
    imageUrl,
  };
  if (index >= 0) content.beneficios[index] = item;
  else content.beneficios.push(item);

  await saveContent(admin.tenantId, content);
  done("ok", current ? `«${title}» actualizado.` : `«${title}» agregado.`);
}

export async function moveBenefitAction(formData: FormData) {
  const admin = await requireTenantAdmin();
  const content = editableContent(admin.tenant.modulesContent);
  const index = content.beneficios.findIndex((b) => b.id === text(formData, "id", 40));
  const to = index + (formData.get("direction") === "up" ? -1 : 1);
  if (index < 0 || to < 0 || to >= content.beneficios.length) redirect(BASE);
  const [item] = content.beneficios.splice(index, 1);
  content.beneficios.splice(to, 0, item);
  await saveContent(admin.tenantId, content);
  redirect(BASE);
}

export async function deleteBenefitAction(formData: FormData) {
  const admin = await requireTenantAdmin();
  const content = editableContent(admin.tenant.modulesContent);
  const id = text(formData, "id", 40);
  const item = content.beneficios.find((b) => b.id === id);
  if (!item) done("error", "Ese beneficio ya no existe.");
  content.beneficios = content.beneficios.filter((b) => b.id !== id);
  await saveContent(admin.tenantId, content);
  done("ok", `«${item.title}» eliminado.`);
}
