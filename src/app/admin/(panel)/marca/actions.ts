"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { isValidHexColor } from "@/lib/branding";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  parseHeroSlides,
  type TenantHeroSlide,
} from "@/lib/hero-slides";
import { saveBannerImage, saveLogoImage } from "@/lib/uploads";
import { normalizeChileWhatsapp } from "@/lib/whatsapp";

const schema = z.object({
  name: z.string().trim().min(2).max(120),
  tagline: z.string().trim().max(200).optional(),
  about: z.string().trim().max(4000).optional(),
  primaryColor: z.string().trim(),
  secondaryColor: z.string().trim(),
  logoUrl: z.string().trim().max(500).optional(),
  phone: z.string().trim().max(40).optional(),
  phoneSecondary: z.string().trim().max(40).optional(),
  email: z.string().trim().email().optional().or(z.literal("")),
  whatsapp: z.string().trim().max(40).optional(),
  address: z.string().trim().max(200).optional(),
  city: z.string().trim().max(80).optional(),
  region: z.string().trim().max(80).optional(),
  deliveryBanner: z.string().trim().max(500).optional(),
  hoursBanner: z.string().trim().max(500).optional(),
  heroHeadline: z.string().trim().max(200).optional(),
  heroBody: z.string().trim().max(1000).optional(),
  coverageText: z.string().trim().max(1000).optional(),
});

export async function updateBrandingAction(formData: FormData) {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin/login");
  if (admin.role === "super_admin" && admin.tenant.slug === "plataforma") {
    redirect("/admin/plataforma");
  }

  const str = (key: string) => String(formData.get(key) || "").trim();

  const parsed = schema.safeParse({
    name: formData.get("name"),
    tagline: str("tagline") || undefined,
    about: str("about") || undefined,
    primaryColor: formData.get("primaryColor"),
    secondaryColor: formData.get("secondaryColor"),
    logoUrl: str("logoUrl") || undefined,
    phone: str("phone") || undefined,
    phoneSecondary: str("phoneSecondary") || undefined,
    email: str("email"),
    whatsapp: str("whatsapp") || undefined,
    address: str("address") || undefined,
    city: str("city") || undefined,
    region: str("region") || undefined,
    deliveryBanner: str("deliveryBanner") || undefined,
    hoursBanner: str("hoursBanner") || undefined,
    heroHeadline: str("heroHeadline") || undefined,
    heroBody: str("heroBody") || undefined,
    coverageText: str("coverageText") || undefined,
  });

  if (!parsed.success) {
    redirect(
      "/admin/marca?error=" +
        encodeURIComponent("Revisá los campos del formulario"),
    );
  }

  const whatsapp = parsed.data.whatsapp
    ? normalizeChileWhatsapp(parsed.data.whatsapp)
    : null;
  if (parsed.data.whatsapp && !whatsapp) {
    redirect(
      "/admin/marca?error=" +
        encodeURIComponent(
          "WhatsApp inválido: usa un número chileno, ej. +56 9 1234 5678",
        ),
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

  let logoUrl = parsed.data.logoUrl || null;
  const logoFile = formData.get("logoFile");
  if (logoFile instanceof File && logoFile.size > 0) {
    try {
      logoUrl = await saveLogoImage(admin.tenant.slug, logoFile);
    } catch (e) {
      redirect(
        "/admin/marca?error=" +
          encodeURIComponent(
            e instanceof Error ? e.message : "Error al subir el logo",
          ),
      );
    }
  }

  const heroSlides: TenantHeroSlide[] = [];
  try {
    const rawJson = str("heroSlidesJson") || "[]";
    const draft = parseHeroSlides(JSON.parse(rawJson));
    for (const slide of draft) {
      const file = formData.get(`bannerImage_${slide.id}`);
      let imageUrl =
        str(`bannerImageUrl_${slide.id}`) || slide.imageUrl || "";
      if (file instanceof File && file.size > 0) {
        imageUrl = await saveBannerImage(admin.tenant.slug, file);
      }
      if (!imageUrl) continue;
      heroSlides.push({
        id: slide.id,
        imageUrl,
        title: slide.title,
        subtitle: slide.subtitle,
        ctaLabel: slide.ctaLabel,
        ctaHref: slide.ctaHref,
      });
    }
  } catch (e) {
    redirect(
      "/admin/marca?error=" +
        encodeURIComponent(
          e instanceof Error
            ? e.message
            : "No se pudieron guardar los banners",
        ),
    );
  }

  const firstSlideImage = heroSlides[0]?.imageUrl ?? null;

  await prisma.tenant.update({
    where: { id: admin.tenantId },
    data: {
      name: parsed.data.name,
      tagline: parsed.data.tagline ?? null,
      about: parsed.data.about ?? null,
      primaryColor: parsed.data.primaryColor,
      secondaryColor: parsed.data.secondaryColor,
      logoUrl,
      phone: parsed.data.phone ?? null,
      phoneSecondary: parsed.data.phoneSecondary ?? null,
      email: parsed.data.email || null,
      whatsapp,
      address: parsed.data.address ?? null,
      city: parsed.data.city ?? null,
      region: parsed.data.region ?? null,
      deliveryBanner: parsed.data.deliveryBanner ?? null,
      hoursBanner: parsed.data.hoursBanner ?? null,
      heroImageUrl: firstSlideImage,
      heroHeadline: parsed.data.heroHeadline ?? null,
      heroBody: parsed.data.heroBody ?? null,
      coverageText: parsed.data.coverageText ?? null,
      heroSlides,
    },
  });

  revalidatePath("/");
  revalidatePath("/productos");
  revalidatePath("/admin/marca");
  revalidatePath("/admin");
  redirect("/admin/marca?ok=1");
}
