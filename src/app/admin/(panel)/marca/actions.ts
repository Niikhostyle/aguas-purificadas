"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { isValidHexColor } from "@/lib/branding";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

const schema = z.object({
  name: z.string().trim().min(2).max(120),
  tagline: z.string().trim().max(200).optional(),
  about: z.string().trim().max(4000).optional(),
  primaryColor: z.string().trim(),
  secondaryColor: z.string().trim(),
  logoUrl: z.string().trim().url().optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional(),
  email: z.string().trim().email().optional().or(z.literal("")),
  whatsapp: z.string().trim().max(40).optional(),
  address: z.string().trim().max(200).optional(),
  city: z.string().trim().max(80).optional(),
  region: z.string().trim().max(80).optional(),
});

export async function updateBrandingAction(formData: FormData) {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin/login");
  if (admin.role === "super_admin" && admin.tenant.slug === "plataforma") {
    redirect("/admin/plataforma");
  }

  const parsed = schema.safeParse({
    name: formData.get("name"),
    tagline: String(formData.get("tagline") || "").trim() || undefined,
    about: String(formData.get("about") || "").trim() || undefined,
    primaryColor: formData.get("primaryColor"),
    secondaryColor: formData.get("secondaryColor"),
    logoUrl: String(formData.get("logoUrl") || "").trim(),
    phone: String(formData.get("phone") || "").trim() || undefined,
    email: String(formData.get("email") || "").trim(),
    whatsapp: String(formData.get("whatsapp") || "").trim() || undefined,
    address: String(formData.get("address") || "").trim() || undefined,
    city: String(formData.get("city") || "").trim() || undefined,
    region: String(formData.get("region") || "").trim() || undefined,
  });

  if (!parsed.success) {
    redirect(
      "/admin/marca?error=" + encodeURIComponent("Revisá los campos del formulario"),
    );
  }

  if (
    !isValidHexColor(parsed.data.primaryColor) ||
    !isValidHexColor(parsed.data.secondaryColor)
  ) {
    redirect(
      "/admin/marca?error=" +
        encodeURIComponent("Los colores deben ser hex #RRGGBB"),
    );
  }

  await prisma.tenant.update({
    where: { id: admin.tenantId },
    data: {
      name: parsed.data.name,
      tagline: parsed.data.tagline ?? null,
      about: parsed.data.about ?? null,
      primaryColor: parsed.data.primaryColor,
      secondaryColor: parsed.data.secondaryColor,
      logoUrl: parsed.data.logoUrl || null,
      phone: parsed.data.phone ?? null,
      email: parsed.data.email || null,
      whatsapp: parsed.data.whatsapp ?? null,
      address: parsed.data.address ?? null,
      city: parsed.data.city ?? null,
      region: parsed.data.region ?? null,
    },
  });

  revalidatePath("/");
  revalidatePath("/productos");
  revalidatePath("/admin/marca");
  revalidatePath("/admin");
  redirect("/admin/marca?ok=1");
}
