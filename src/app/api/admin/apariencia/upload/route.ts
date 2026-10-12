import { isSuperAdmin, requireAdmin } from "@/lib/auth";
import { APPEARANCE_FIELD_KIND, isAppearanceField, saveAppearanceAsset } from "@/lib/uploads";

// One image per request so a full Apariencia save never ships several files at once.
const MAX_REQUEST_BYTES = 6 * 1024 * 1024;

function json(body: { url: string } | { error: string }, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  const host = (request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "").split(",")[0].trim();
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return json({ error: "Solicitud no permitida" }, 403);

  const admin = await requireAdmin();
  if (!admin || isSuperAdmin(admin)) {
    return json({ error: "Tu sesión expiró. Vuelve a iniciar sesión para subir imágenes." }, 401);
  }

  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > MAX_REQUEST_BYTES) {
    return json({ error: "La imagen es demasiado grande (máx. 5 MB)." }, 413);
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json({ error: "No se pudo leer la imagen enviada. Inténtalo de nuevo." }, 400);
  }

  const field = form.get("field");
  const file = form.get("file");
  if (!isAppearanceField(field) || !(file instanceof File) || file.size === 0) {
    return json({ error: "Selecciona una imagen válida." }, 400);
  }

  try {
    const url = await saveAppearanceAsset(admin.tenant.slug, file, APPEARANCE_FIELD_KIND[field]);
    return json({ url });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "No se pudo guardar la imagen." }, 400);
  }
}
