"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { loginAdmin, logoutAdmin, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { saveProductImage } from "@/lib/uploads";

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const loginMode = String(formData.get("loginMode") || "").trim();
  const tenantSlug =
    loginMode === "platform"
      ? "plataforma"
      : String(formData.get("tenantSlug") || "demo").trim().toLowerCase();

  // Public demo never asks for credentials
  if (tenantSlug === "demo") {
    redirect("/admin/demo-access");
  }

  const { headers } = await import("next/headers");
  const { rateLimit } = await import("@/lib/rate-limit");
  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "unknown";
  const limited = rateLimit(`admin-login:${ip}:${tenantSlug}`, 8, 60_000);
  if (!limited.ok) {
    redirect(
      `/admin/login?tenant=${encodeURIComponent(tenantSlug)}&error=${encodeURIComponent("Demasiados intentos. Prueba en un minuto.")}`,
    );
  }

  // A tenant host only issues sessions for itself (see getAdminSession).
  const hostSlug = h.get("x-tenant-slug");
  const result =
    hostSlug && hostSlug !== tenantSlug
      ? { ok: false as const, error: "Credenciales inválidas" }
      : await loginAdmin(tenantSlug, email, password);
  if (!result.ok) {
    redirect(
      `/admin/login?tenant=${encodeURIComponent(tenantSlug)}&error=${encodeURIComponent(result.error)}`,
    );
  }

  const admin = await requireAdmin();
  if (admin?.role === "super_admin") {
    redirect("/admin/plataforma");
  }
  redirect("/admin");
}

export async function logoutAction() {
  const admin = await requireAdmin();
  const wasDemo = admin?.tenant.slug === "demo";
  await logoutAdmin();
  // Demo is open: leave the storefront, don't bounce back into the panel
  redirect(wasDemo ? "/" : "/admin/login");
}

const productSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres.")
    .max(120, "Máximo 120 caracteres."),
  description: z.string().max(2000, "Máximo 2000 caracteres.").optional(),
  priceClp: z.coerce
    .number({ error: "Ingresa un precio válido." })
    .int("El precio debe ser un número entero.")
    .min(0, "El precio no puede ser negativo.")
    .max(10_000_000, "El precio es demasiado alto."),
  active: z.coerce.boolean().optional(),
  slug: z
    .string()
    .trim()
    .max(80, "Máximo 80 caracteres.")
    .regex(/^[a-z0-9-]*$/, "Usa solo minúsculas, números y guiones.")
    .optional(),
});

export type ProductFormState = {
  error?: string;
  fieldErrors?: Partial<Record<"name" | "slug" | "priceClp" | "description" | "image", string>>;
};

function parseProduct(formData: FormData) {
  return productSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    priceClp: formData.get("priceClp"),
    active: formData.get("active") === "on",
    slug: formData.get("slug") || undefined,
  });
}

function invalid(error: z.ZodError): ProductFormState {
  const fieldErrors: ProductFormState["fieldErrors"] = {};
  for (const issue of error.issues) {
    const key = issue.path[0] as keyof NonNullable<ProductFormState["fieldErrors"]>;
    fieldErrors[key] ??= issue.message;
  }
  return { error: "Revisa los campos marcados.", fieldErrors };
}

export async function createProductAction(
  _prev: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin/login");

  const parsed = parseProduct(formData);
  if (!parsed.success) return invalid(parsed.error);

  const slug = parsed.data.slug?.trim() || slugify(parsed.data.name);
  let imageUrl: string | undefined;
  const file = formData.get("image");
  if (file instanceof File && file.size > 0) {
    try {
      imageUrl = await saveProductImage(admin.tenant.slug, file);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Error de imagen";
      return { error: message, fieldErrors: { image: message } };
    }
  }

  await prisma.product.create({
    data: {
      tenantId: admin.tenantId,
      name: parsed.data.name,
      slug,
      description: parsed.data.description,
      priceClp: parsed.data.priceClp,
      imageUrl,
      active: parsed.data.active ?? true,
      sortOrder: 99,
    },
  });

  revalidatePath("/admin/productos");
  revalidatePath("/productos");
  revalidatePath("/");
  redirect(`/admin/productos?ok=${encodeURIComponent(`Producto «${parsed.data.name}» creado.`)}`);
}

export async function updateProductAction(
  _prev: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin/login");

  const id = String(formData.get("id") || "");
  if (!id) return { error: "Producto no encontrado." };
  const parsed = parseProduct(formData);
  if (!parsed.success) return invalid(parsed.error);

  const existing = await prisma.product.findFirst({
    where: { id, tenantId: admin.tenantId },
  });
  if (!existing) redirect("/admin/productos?error=Producto%20no%20encontrado");

  const slug = parsed.data.slug?.trim() || existing.slug;
  let imageUrl = existing.imageUrl;
  const file = formData.get("image");
  if (file instanceof File && file.size > 0) {
    try {
      imageUrl = await saveProductImage(admin.tenant.slug, file);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Error de imagen";
      return { error: message, fieldErrors: { image: message } };
    }
  }

  await prisma.product.update({
    where: { id },
    data: {
      name: parsed.data.name,
      slug,
      description: parsed.data.description,
      priceClp: parsed.data.priceClp,
      imageUrl,
      active: parsed.data.active ?? false,
    },
  });

  revalidatePath("/admin/productos");
  revalidatePath(`/admin/productos/${id}`);
  revalidatePath("/productos");
  revalidatePath(`/productos/${slug}`);
  revalidatePath("/");
  redirect(`/admin/productos?ok=${encodeURIComponent(`Producto «${parsed.data.name}» actualizado.`)}`);
}

export async function deleteProductAction(formData: FormData) {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin/login");

  const id = String(formData.get("id") || "");
  const existing = await prisma.product.findFirst({
    where: { id, tenantId: admin.tenantId },
  });
  if (!existing) redirect("/admin/productos?error=Producto%20no%20encontrado");
  await prisma.product.delete({ where: { id } });

  revalidatePath("/admin/productos");
  revalidatePath("/productos");
  revalidatePath("/");
  const back = String(formData.get("returnTo") || "");
  const url = new URL(back.startsWith("/admin/productos") ? back : "/admin/productos", "http://x");
  url.searchParams.set("ok", `Producto «${existing.name}» eliminado.`);
  redirect(`${url.pathname}${url.search}`);
}
