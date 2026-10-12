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

export async function saveDiscountImage(
  tenantSlug: string,
  file: File,
): Promise<string> {
  return saveImageFile(tenantSlug, file, "descuentos");
}

export async function saveBenefitImage(
  tenantSlug: string,
  file: File,
): Promise<string> {
  return saveImageFile(tenantSlug, file, "beneficios");
}

/** Storefront section images (kits, certificaciones, redes), one folder per section. */
export async function saveImageUpload(
  tenantSlug: string,
  file: File,
  section: "planes" | "kits" | "certificaciones" | "redes",
): Promise<string> {
  return saveImageFile(tenantSlug, file, section);
}

export async function saveLogoImage(
  tenantSlug: string,
  file: File,
): Promise<string> {
  return saveImageFile(tenantSlug, file, "logo");
}

type AssetExt = "png" | "jpg" | "webp" | "gif" | "svg" | "ico";

export type AppearanceAssetKind = "logo" | "favicon" | "background";

/** Apariencia image fields and the asset rules each one is validated with. */
export const APPEARANCE_FIELD_KIND = {
  logoUrl: "logo",
  logoDarkUrl: "logo",
  faviconUrl: "favicon",
  panelLogoUrl: "logo",
  loginBgUrl: "background",
  loginLogoUrl: "logo",
} as const satisfies Record<string, AppearanceAssetKind>;

export type AppearanceField = keyof typeof APPEARANCE_FIELD_KIND;

export function isAppearanceField(v: unknown): v is AppearanceField {
  return typeof v === "string" && Object.hasOwn(APPEARANCE_FIELD_KIND, v);
}

const ASSET_NAME_RE = /^(logo|favicon|background)-\d+-[0-9a-f]{8}\.(png|jpg|webp|gif|svg|ico)$/;

/** True for files written by `saveAppearanceAsset` for this tenant. */
export function isOwnAppearanceAsset(tenantSlug: string, url: string): boolean {
  const prefix = `/uploads/${safeSlug(tenantSlug)}/appearance/`;
  return url.startsWith(prefix) && ASSET_NAME_RE.test(url.slice(prefix.length));
}

const ASSET_RULES: Record<
  AppearanceAssetKind,
  { exts: AssetExt[]; maxBytes: number; square?: boolean; label: string }
> = {
  logo: { exts: ["png", "svg", "jpg", "webp"], maxBytes: 2 * 1024 * 1024, label: "PNG, SVG, JPG o WEBP" },
  favicon: { exts: ["png", "svg", "ico", "webp"], maxBytes: 1024 * 1024, square: true, label: "PNG, SVG, ICO o WEBP" },
  background: { exts: ["jpg", "png", "webp"], maxBytes: 5 * 1024 * 1024, label: "JPG, PNG o WEBP" },
};

const DECLARED_TYPES: Record<AssetExt, string[]> = {
  png: ["image/png"],
  jpg: ["image/jpeg", "image/jpg"],
  webp: ["image/webp"],
  gif: ["image/gif"],
  svg: ["image/svg+xml"],
  ico: ["image/x-icon", "image/vnd.microsoft.icon", "image/ico", "application/octet-stream", ""],
};

function sniffExt(buf: Buffer): AssetExt | null {
  if (matchesMagic(buf, "png")) return "png";
  if (matchesMagic(buf, "jpg")) return "jpg";
  if (matchesMagic(buf, "gif")) return "gif";
  if (matchesMagic(buf, "webp") && buf.subarray(8, 12).toString("ascii") === "WEBP") return "webp";
  if (buf.length > 6 && buf[0] === 0 && buf[1] === 0 && buf[2] === 1 && buf[3] === 0) return "ico";
  const head = buf.subarray(0, 512).toString("utf8").replace(/^\uFEFF/, "").trimStart();
  if (/^(<\?xml[^>]*>\s*)?(<!--[\s\S]*?-->\s*)*<svg[\s>]/i.test(head)) return "svg";
  return null;
}

/** SVGs are served from our origin, so anything scriptable or external is refused. */
function assertSafeSvg(buf: Buffer) {
  const text = buf.toString("utf8");
  if (
    /<script|<foreignObject|<!ENTITY|<!DOCTYPE|javascript:|\bon[a-z]+\s*=|<iframe|<embed|<object/i.test(text) ||
    /(?:href|src)\s*=\s*["']\s*(?!#|data:image\/)/i.test(text)
  ) {
    throw new Error("El SVG contiene scripts o referencias externas no permitidas");
  }
}

function imageSize(buf: Buffer, ext: AssetExt): { w: number; h: number } | null {
  try {
    if (ext === "png") return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
    if (ext === "ico") return { w: buf[6] || 256, h: buf[7] || 256 };
    if (ext === "webp") {
      const chunk = buf.subarray(12, 16).toString("ascii");
      if (chunk === "VP8X") return { w: 1 + buf.readUIntLE(24, 3), h: 1 + buf.readUIntLE(27, 3) };
      if (chunk === "VP8 ") return { w: buf.readUInt16LE(26) & 0x3fff, h: buf.readUInt16LE(28) & 0x3fff };
      if (chunk === "VP8L") {
        const bits = buf.readUInt32LE(21);
        return { w: (bits & 0x3fff) + 1, h: ((bits >> 14) & 0x3fff) + 1 };
      }
      return null;
    }
    if (ext === "svg") {
      const tag = buf.toString("utf8").match(/<svg[^>]*>/i)?.[0] ?? "";
      const vb = tag.match(/viewBox\s*=\s*["']\s*[-\d.]+[\s,]+[-\d.]+[\s,]+([\d.]+)[\s,]+([\d.]+)/i);
      if (vb) return { w: Number(vb[1]), h: Number(vb[2]) };
      const w = tag.match(/\swidth\s*=\s*["']([\d.]+)(px)?["']/i);
      const h = tag.match(/\sheight\s*=\s*["']([\d.]+)(px)?["']/i);
      if (w && h) return { w: Number(w[1]), h: Number(h[1]) };
    }
  } catch {
    return null;
  }
  return null;
}

export async function saveAppearanceAsset(
  tenantSlug: string,
  file: File,
  kind: AppearanceAssetKind,
): Promise<string> {
  const slug = safeSlug(tenantSlug);
  const rule = ASSET_RULES[kind];
  if (file.size > rule.maxBytes) {
    throw new Error(`El archivo no puede superar ${Math.round(rule.maxBytes / 1024 / 1024)} MB`);
  }
  const buf = Buffer.from(await file.arrayBuffer());
  const ext = sniffExt(buf);
  if (!ext || !rule.exts.includes(ext) || !DECLARED_TYPES[ext].includes(file.type)) {
    throw new Error(`Formato no permitido (${rule.label})`);
  }
  if (ext === "svg") assertSafeSvg(buf);
  if (rule.square) {
    const size = imageSize(buf, ext);
    if (!size || size.w < 16 || Math.abs(size.w - size.h) > 0.5) {
      throw new Error("El ícono debe ser cuadrado (por ejemplo 512×512 px)");
    }
  }

  const uploadsRoot = path.resolve(process.cwd(), "public", "uploads");
  const dir = path.resolve(uploadsRoot, slug, "appearance");
  if (!dir.startsWith(uploadsRoot + path.sep)) throw new Error("Ruta de carga inválida");
  await mkdir(dir, { recursive: true });
  const name = `${kind}-${Date.now()}-${randomBytes(4).toString("hex")}.${ext}`;
  await writeFile(path.join(dir, name), buf, { mode: 0o644 });
  return `/uploads/${slug}/appearance/${name}`;
}
