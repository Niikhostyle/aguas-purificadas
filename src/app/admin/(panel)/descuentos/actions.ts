"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { normalizeCouponCode } from "@/lib/discounts";
import { addDaysStr, startOfDayCl } from "@/lib/dispatch";
import { saveDiscountImage } from "@/lib/uploads";

export type DiscountFormState = {
  error?: string;
  fieldErrors?: Partial<
    Record<"name" | "value" | "couponCode" | "productIds" | "endsAt" | "bannerText" | "image", string>
  >;
};

const dateStr = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida.")
  .optional();

const discountSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "El nombre debe tener al menos 2 caracteres.")
      .max(80, "Máximo 80 caracteres."),
    type: z.enum(["percent", "fixed"]),
    value: z.coerce
      .number({ error: "Ingresa un valor válido." })
      .int("Usa un número entero.")
      .min(1, "El descuento debe ser mayor que 0."),
    scope: z.enum(["all", "products"]),
    productIds: z.array(z.string().min(1)).max(500),
    couponCode: z
      .string()
      .regex(/^[A-Z0-9_-]{3,40}$/, "Usa 3 a 40 letras, números, guiones o guion bajo, sin espacios.")
      .optional(),
    active: z.boolean(),
    startsAt: dateStr,
    endsAt: dateStr,
    bannerText: z.string().trim().max(160, "Máximo 160 caracteres.").optional(),
  })
  .superRefine((d, ctx) => {
    if (d.type === "percent" && d.value > 100) {
      ctx.addIssue({ code: "custom", path: ["value"], message: "Un porcentaje no puede superar 100%." });
    }
    if (d.type === "fixed" && d.value > 10_000_000) {
      ctx.addIssue({ code: "custom", path: ["value"], message: "El monto es demasiado alto." });
    }
    if (d.scope === "products" && d.productIds.length === 0) {
      ctx.addIssue({ code: "custom", path: ["productIds"], message: "Elige al menos un producto." });
    }
    if (d.startsAt && d.endsAt && d.endsAt < d.startsAt) {
      ctx.addIssue({ code: "custom", path: ["endsAt"], message: "La fecha de término es anterior al inicio." });
    }
  });

async function requireTenantAdmin() {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin/login");
  if (admin.role === "super_admin" && admin.tenant.slug === "plataforma") {
    redirect("/admin/plataforma");
  }
  return admin;
}

function revalidateDiscounts() {
  revalidatePath("/admin/descuentos");
  revalidatePath("/", "layout");
}

function optional(formData: FormData, key: string): string | undefined {
  const v = String(formData.get(key) ?? "").trim();
  return v || undefined;
}

export async function saveDiscountAction(
  _prev: DiscountFormState,
  formData: FormData,
): Promise<DiscountFormState> {
  const admin = await requireTenantAdmin();
  const id = optional(formData, "id");

  const parsed = discountSchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
    value: formData.get("value"),
    scope: formData.get("scope"),
    productIds: formData.getAll("productIds").map(String),
    couponCode: normalizeCouponCode(formData.get("couponCode")) || undefined,
    active: formData.get("active") === "on",
    startsAt: optional(formData, "startsAt"),
    endsAt: optional(formData, "endsAt"),
    bannerText: optional(formData, "bannerText"),
  });
  if (!parsed.success) {
    const fieldErrors: DiscountFormState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof NonNullable<DiscountFormState["fieldErrors"]>;
      fieldErrors[key] ??= issue.message;
    }
    return { error: "Revisa los campos marcados.", fieldErrors };
  }
  const d = parsed.data;

  const existing = id
    ? await prisma.discount.findFirst({ where: { id, tenantId: admin.tenantId } })
    : null;
  if (id && !existing) redirect("/admin/descuentos?error=Descuento%20no%20encontrado");

  // Only keep products that belong to this tenant.
  const productIds =
    d.scope === "products"
      ? (
          await prisma.product.findMany({
            where: { tenantId: admin.tenantId, id: { in: d.productIds } },
            select: { id: true },
          })
        ).map((p) => p.id)
      : [];
  if (d.scope === "products" && productIds.length === 0) {
    return { error: "Revisa los campos marcados.", fieldErrors: { productIds: "Elige al menos un producto." } };
  }

  let imageUrl = existing?.imageUrl ?? null;
  if (formData.get("removeImage") === "on") imageUrl = null;
  const file = formData.get("image");
  if (file instanceof File && file.size > 0) {
    try {
      imageUrl = await saveDiscountImage(admin.tenant.slug, file);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Error de imagen";
      return { error: message, fieldErrors: { image: message } };
    }
  }

  const data = {
    name: d.name,
    type: d.type,
    value: d.value,
    scope: d.scope,
    productIds,
    couponCode: d.couponCode ?? null,
    active: d.active,
    startsAt: d.startsAt ? startOfDayCl(d.startsAt) : null,
    endsAt: d.endsAt ? startOfDayCl(addDaysStr(d.endsAt, 1)) : null,
    bannerText: d.bannerText ?? null,
    imageUrl,
  };

  try {
    if (existing) {
      await prisma.discount.update({ where: { id: existing.id }, data });
    } else {
      await prisma.discount.create({ data: { ...data, tenantId: admin.tenantId } });
    }
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return {
        error: "Ese código de cupón ya existe.",
        fieldErrors: { couponCode: "Ya tienes otro descuento con este código." },
      };
    }
    throw e;
  }

  revalidateDiscounts();
  redirect(
    `/admin/descuentos?ok=${encodeURIComponent(
      existing ? `Descuento «${d.name}» actualizado.` : `Descuento «${d.name}» creado.`,
    )}`,
  );
}

export async function toggleDiscountAction(formData: FormData) {
  const admin = await requireTenantAdmin();
  const id = String(formData.get("id") || "");
  const existing = await prisma.discount.findFirst({ where: { id, tenantId: admin.tenantId } });
  if (!existing) redirect("/admin/descuentos?error=Descuento%20no%20encontrado");
  await prisma.discount.update({ where: { id: existing.id }, data: { active: !existing.active } });
  revalidateDiscounts();
  redirect(
    `/admin/descuentos?ok=${encodeURIComponent(
      existing.active ? `«${existing.name}» pausado.` : `«${existing.name}» activado.`,
    )}`,
  );
}

export async function deleteDiscountAction(formData: FormData) {
  const admin = await requireTenantAdmin();
  const id = String(formData.get("id") || "");
  const existing = await prisma.discount.findFirst({ where: { id, tenantId: admin.tenantId } });
  if (!existing) redirect("/admin/descuentos?error=Descuento%20no%20encontrado");
  await prisma.discount.delete({ where: { id: existing.id } });
  revalidateDiscounts();
  redirect(`/admin/descuentos?ok=${encodeURIComponent(`Descuento «${existing.name}» eliminado.`)}`);
}
