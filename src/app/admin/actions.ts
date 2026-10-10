"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { loginAdmin, logoutAdmin, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

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
  const tenantSlug = String(formData.get("tenantSlug") || "rio-claro").trim();

  const result = await loginAdmin(tenantSlug, email, password);
  if (!result.ok) {
    redirect(`/admin/login?error=${encodeURIComponent(result.error)}`);
  }
  redirect("/admin");
}

export async function logoutAction() {
  await logoutAdmin();
  redirect("/admin/login");
}

const productSchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().max(2000).optional(),
  priceClp: z.coerce.number().int().min(0).max(10_000_000),
  active: z.coerce.boolean().optional(),
  slug: z.string().max(80).optional(),
});

export async function createProductAction(formData: FormData) {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin/login");

  const parsed = productSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    priceClp: formData.get("priceClp"),
    active: formData.get("active") === "on",
    slug: formData.get("slug") || undefined,
  });
  if (!parsed.success) {
    redirect("/admin/productos/nuevo?error=Datos%20inválidos");
  }

  const slug = parsed.data.slug?.trim() || slugify(parsed.data.name);

  await prisma.product.create({
    data: {
      tenantId: admin.tenantId,
      name: parsed.data.name,
      slug,
      description: parsed.data.description,
      priceClp: parsed.data.priceClp,
      active: parsed.data.active ?? true,
      sortOrder: 99,
    },
  });

  revalidatePath("/admin/productos");
  revalidatePath("/productos");
  revalidatePath("/");
  redirect("/admin/productos");
}

export async function updateProductAction(formData: FormData) {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin/login");

  const id = String(formData.get("id") || "");
  const parsed = productSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    priceClp: formData.get("priceClp"),
    active: formData.get("active") === "on",
    slug: formData.get("slug") || undefined,
  });
  if (!parsed.success || !id) {
    redirect(`/admin/productos/${id}?error=Datos%20inválidos`);
  }

  const existing = await prisma.product.findFirst({
    where: { id, tenantId: admin.tenantId },
  });
  if (!existing) redirect("/admin/productos");

  const slug = parsed.data.slug?.trim() || existing.slug;

  await prisma.product.update({
    where: { id },
    data: {
      name: parsed.data.name,
      slug,
      description: parsed.data.description,
      priceClp: parsed.data.priceClp,
      active: parsed.data.active ?? false,
    },
  });

  revalidatePath("/admin/productos");
  revalidatePath(`/admin/productos/${id}`);
  revalidatePath("/productos");
  revalidatePath(`/productos/${slug}`);
  revalidatePath("/");
  redirect("/admin/productos");
}

export async function deleteProductAction(formData: FormData) {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin/login");

  const id = String(formData.get("id") || "");
  const existing = await prisma.product.findFirst({
    where: { id, tenantId: admin.tenantId },
  });
  if (existing) {
    await prisma.product.delete({ where: { id } });
  }

  revalidatePath("/admin/productos");
  revalidatePath("/productos");
  revalidatePath("/");
  redirect("/admin/productos");
}
