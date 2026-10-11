import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";

const ALLOWED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const MAGIC = {
  jpg: [0xff, 0xd8, 0xff],
  png: [0x89, 0x50, 0x4e, 0x47],
  gif: [0x47, 0x49, 0x46],
  webp: [0x52, 0x49, 0x46, 0x46],
} as const;

function safeSlug(slug: string): string {
  const s = slug.toLowerCase().replace(/[^a-z0-9_-]/g, "");
  if (!s || s.includes("..") || s.length > 40) {
    throw new Error("Tenant inválido para carga");
  }
  return s;
}

function safeSubdir(subdir?: string): string | undefined {
  if (!subdir) return undefined;
  const s = subdir.toLowerCase().replace(/[^a-z0-9_-]/g, "");
  if (!s || s.includes("..")) throw new Error("Ruta de carga inválida");
  return s;
}

function matchesMagic(buf: Buffer, kind: keyof typeof MAGIC): boolean {
  const sig = MAGIC[kind];
  if (buf.length < sig.length) return false;
  return sig.every((b, i) => buf[i] === b);
}

async function saveImageFile(
  tenantSlug: string,
  file: File,
  subdir?: string,
): Promise<string> {
  const slug = safeSlug(tenantSlug);
  const sub = safeSubdir(subdir);

  if (!ALLOWED.has(file.type)) {
    throw new Error("Formato no permitido (JPG, PNG, WEBP o GIF)");
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("La imagen no puede superar 5 MB");
  }

  const buf = Buffer.from(await file.arrayBuffer());
  let ext: "jpg" | "png" | "webp" | "gif";
  if (file.type === "image/png" && matchesMagic(buf, "png")) ext = "png";
  else if (file.type === "image/webp" && matchesMagic(buf, "webp")) ext = "webp";
  else if (file.type === "image/gif" && matchesMagic(buf, "gif")) ext = "gif";
  else if (
    (file.type === "image/jpeg" || file.type === "image/jpg") &&
    matchesMagic(buf, "jpg")
  )
    ext = "jpg";
  else throw new Error("El archivo no coincide con un formato de imagen válido");

  const uploadsRoot = path.resolve(process.cwd(), "public", "uploads");
  const parts = [uploadsRoot, slug];
  if (sub) parts.push(sub);
  const dir = path.resolve(...parts);
  if (!dir.startsWith(uploadsRoot + path.sep) && dir !== uploadsRoot) {
    throw new Error("Ruta de carga inválida");
  }
  await mkdir(dir, { recursive: true });
  const name = `${Date.now()}-${randomBytes(4).toString("hex")}.${ext}`;
  const dest = path.join(dir, name);
  await writeFile(dest, buf, { mode: 0o644 });
  const urlParts = ["/uploads", slug];
  if (sub) urlParts.push(sub);
  urlParts.push(name);
  return urlParts.join("/");
}

export async function saveProductImage(
  tenantSlug: string,
  file: File,
): Promise<string> {
  return saveImageFile(tenantSlug, file);
}

export async function saveBannerImage(
  tenantSlug: string,
  file: File,
): Promise<string> {
  return saveImageFile(tenantSlug, file, "banners");
}

export async function saveLogoImage(
  tenantSlug: string,
  file: File,
): Promise<string> {
  return saveImageFile(tenantSlug, file, "logo");
}
