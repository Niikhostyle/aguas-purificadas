"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { LIST_SPECS, isListKind, listItems, itemTitle, platformOf, type ListKind, type ListItem } from "@/lib/content-lists";
import { prisma } from "@/lib/db";
import { parseModuleFlags, parseModulesContent, type ModulesContent } from "@/lib/modules";
import { saveImageUpload } from "@/lib/uploads";

async function requireTenantAdmin() {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin/login");
  if (admin.role === "super_admin" && admin.tenant.slug === "plataforma") redirect("/admin/plataforma");
  return admin;
}

function kindFrom(formData: FormData): ListKind {
  const k = String(formData.get("kind") ?? "");
  if (!isListKind(k)) redirect("/admin/modulos");
  return k;
}

function done(kind: ListKind, key: "ok" | "error", message: string): never {
  redirect(`/admin/contenido/${kind}?${key}=${encodeURIComponent(message)}`);
}

function text(formData: FormData, key: string, max: number): string {
  return String(formData.get(key) ?? "").trim().slice(0, max);
}

async function saveContent(tenantId: string, kind: ListKind, content: ModulesContent) {
  await prisma.tenant.update({ where: { id: tenantId }, data: { modulesContent: parseModulesContent(content) } });
  revalidatePath(`/admin/contenido/${kind}`);
  revalidatePath("/", "layout");
}

function setItems(content: ModulesContent, kind: ListKind, items: ListItem[]) {
  (content as unknown as Record<ListKind, ListItem[]>)[kind] = items;
}

export async function saveListItemAction(formData: FormData) {
  const admin = await requireTenantAdmin();
  const kind = kindFrom(formData);
  const spec = LIST_SPECS[kind];
  const content = parseModulesContent(admin.tenant.modulesContent);
  const items = [...listItems(content, kind)];
  const id = text(formData, "id", 40);
  const index = id ? items.findIndex((i) => i.id === id) : -1;
  if (id && index < 0) done(kind, "error", `${spec.the[0].toUpperCase()}${spec.the.slice(1)} ya no existe.`);
  if (!id && items.length >= spec.max) done(kind, "error", `Puedes tener hasta ${spec.max}.`);

  const current = index >= 0 ? items[index] : undefined;
  const item: ListItem = { id: current?.id ?? `${spec.idPrefix}-${randomBytes(4).toString("hex")}` };
  for (const f of spec.fields) {
    if (f.type === "checkbox") {
      item[f.name] = formData.get(f.name) === "on";
    } else if (f.type === "lines") {
      item[f.name] = text(formData, f.name, f.max)
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
        .slice(0, 12);
    } else if (f.type === "audience") {
      const v = text(formData, f.name, f.max);
      item[f.name] = v === "hogar" || v === "empresa" ? v : "ambos";
    } else {
      const v = text(formData, f.name, f.max);
      if (f.required && !v) done(kind, "error", `Falta completar «${f.label}».`);
      item[f.name] = v || undefined;
    }
  }
  if (kind === "redes") {
    const url = String(item.url ?? "");
    if (!/^https?:\/\//i.test(url)) done(kind, "error", "El link debe empezar con https://");
    item.platform = platformOf(url);
  }

  if (spec.image) {
    let imageUrl = current?.[spec.image.field] as string | undefined;
    if (formData.get("removeImage") === "on") imageUrl = undefined;
    const file = formData.get("image");
    if (file instanceof File && file.size > 0) {
      try {
        imageUrl = await saveImageUpload(admin.tenant.slug, file, kind);
      } catch (e) {
        done(kind, "error", e instanceof Error ? e.message : "No se pudo guardar la imagen.");
      }
    }
    item[spec.image.field] = imageUrl;
  }

  if (index >= 0) items[index] = item;
  else items.push(item);
  setItems(content, kind, items);
  await saveContent(admin.tenantId, kind, content);
  done(kind, "ok", current ? `«${itemTitle(spec, item)}» actualizado.` : `«${itemTitle(spec, item)}» agregado.`);
}

export async function moveListItemAction(formData: FormData) {
  const admin = await requireTenantAdmin();
  const kind = kindFrom(formData);
  const content = parseModulesContent(admin.tenant.modulesContent);
  const items = [...listItems(content, kind)];
  const index = items.findIndex((i) => i.id === text(formData, "id", 40));
  const to = index + (formData.get("direction") === "up" ? -1 : 1);
  if (index < 0 || to < 0 || to >= items.length) redirect(`/admin/contenido/${kind}`);
  const [item] = items.splice(index, 1);
  items.splice(to, 0, item);
  setItems(content, kind, items);
  await saveContent(admin.tenantId, kind, content);
  redirect(`/admin/contenido/${kind}`);
}

export async function deleteListItemAction(formData: FormData) {
  const admin = await requireTenantAdmin();
  const kind = kindFrom(formData);
  const spec = LIST_SPECS[kind];
  const content = parseModulesContent(admin.tenant.modulesContent);
  const items = listItems(content, kind);
  const id = text(formData, "id", 40);
  const item = items.find((i) => i.id === id);
  if (!item) done(kind, "error", "Ya no existe.");
  setItems(
    content,
    kind,
    items.filter((i) => i.id !== id),
  );
  await saveContent(admin.tenantId, kind, content);
  done(kind, "ok", `«${itemTitle(spec, item)}» eliminado.`);
}

/** Shows or hides the section on the storefront from its own editor page. */
export async function setSectionVisibleAction(formData: FormData) {
  const admin = await requireTenantAdmin();
  const kind = kindFrom(formData);
  const flags = parseModuleFlags(admin.tenant.modulesEnabled);
  const visible = formData.get("visible") === "1";
  flags[LIST_SPECS[kind].flag] = visible;
  await prisma.tenant.update({ where: { id: admin.tenantId }, data: { modulesEnabled: flags } });
  revalidatePath(`/admin/contenido/${kind}`);
  revalidatePath("/admin/modulos");
  revalidatePath("/", "layout");
  done(kind, "ok", visible ? "La sección ya se muestra en tu tienda." : "La sección quedó oculta en tu tienda.");
}

function socialUrl(formData: FormData, key: string, host: RegExp): string | null | false {
  const v = text(formData, key, 300);
  if (!v) return null;
  const withProtocol = /^https?:\/\//i.test(v) ? v : `https://${v}`;
  try {
    const u = new URL(withProtocol);
    return host.test(u.hostname) ? u.toString() : false;
  } catch {
    return false;
  }
}

export async function saveSocialLinksAction(formData: FormData) {
  const admin = await requireTenantAdmin();
  const youtubeUrl = socialUrl(formData, "youtubeUrl", /(^|\.)youtube\.com$|(^|\.)youtu\.be$/i);
  const instagramUrl = socialUrl(formData, "instagramUrl", /(^|\.)instagram\.com$/i);
  const facebookUrl = socialUrl(formData, "facebookUrl", /(^|\.)facebook\.com$|(^|\.)fb\.com$/i);
  if (youtubeUrl === false) done("redes", "error", "El link de YouTube no parece de youtube.com.");
  if (instagramUrl === false) done("redes", "error", "El link de Instagram no parece de instagram.com.");
  if (facebookUrl === false) done("redes", "error", "El link de Facebook no parece de facebook.com.");
  await prisma.tenant.update({
    where: { id: admin.tenantId },
    data: { youtubeUrl, instagramUrl, facebookUrl },
  });
  revalidatePath("/admin/contenido/redes");
  revalidatePath("/", "layout");
  done("redes", "ok", "Redes sociales guardadas.");
}
