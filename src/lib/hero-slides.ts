import type { HeroSlide } from "@/components/hero-carousel";

export type TenantHeroSlide = {
  id: string;
  imageUrl: string;
  title?: string;
  subtitle?: string;
  ctaLabel?: string;
  ctaHref?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
};

export function parseHeroSlides(raw: unknown): TenantHeroSlide[] {
  if (!Array.isArray(raw)) return [];
  const out: TenantHeroSlide[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const imageUrl = typeof o.imageUrl === "string" ? o.imageUrl.trim() : "";
    if (!imageUrl) continue;
    const id =
      typeof o.id === "string" && o.id.trim()
        ? o.id.trim()
        : `slide-${out.length + 1}`;
    out.push({
      id,
      imageUrl,
      title: strOpt(o.title),
      subtitle: strOpt(o.subtitle),
      ctaLabel: strOpt(o.ctaLabel),
      ctaHref: strOpt(o.ctaHref),
      secondaryLabel: strOpt(o.secondaryLabel),
      secondaryHref: strOpt(o.secondaryHref),
    });
  }
  return out;
}

function strOpt(v: unknown): string | undefined {
  if (typeof v !== "string") return undefined;
  const t = v.trim();
  return t || undefined;
}

/** Defaults when tenant has no configured carousel slides. */
export function defaultStorefrontSlides(opts: {
  brandName: string;
  headline: string;
  body: string;
  legacyHeroImage?: string | null;
}): HeroSlide[] {
  const img =
    opts.legacyHeroImage &&
    !opts.legacyHeroImage.includes("hero.jpg") &&
    !opts.legacyHeroImage.includes("hero-2.jpg")
      ? opts.legacyHeroImage
      : "/brand/rio-claro/destacado-01.jpg";

  return [
    {
      image: img,
      eyebrow: opts.brandName,
      title: opts.headline,
      body: opts.body,
      primaryHref: "/productos",
      primaryLabel: "Nuestros productos",
      secondaryHref: "/#contacto",
      secondaryLabel: "Contacto",
    },
    {
      image: "/brand/rio-claro/destacado-02.jpg",
      eyebrow: opts.brandName,
      title: "Agua purificada a tu puerta",
      body: "Pedí online, elegí zona de despacho y pagá con WebPay en minutos.",
      primaryHref: "/productos",
      primaryLabel: "Ver catálogo",
    },
    {
      image: "/brand/rio-claro/destacado-03.jpg",
      eyebrow: opts.brandName,
      title: "Bidones, dispensadores y más",
      body: "Todo lo que necesitás para hogar u oficina, con tu misma calidad de siempre.",
      primaryHref: "/productos",
      primaryLabel: "Ver productos",
    },
  ];
}

export function tenantSlidesToCarousel(
  slides: TenantHeroSlide[],
  brandName: string,
): HeroSlide[] {
  return slides.map((s) => ({
    image: s.imageUrl,
    eyebrow: brandName,
    title: s.title,
    body: s.subtitle,
    primaryHref: s.ctaHref || (s.ctaLabel ? "/productos" : undefined),
    primaryLabel: s.ctaLabel,
    secondaryHref: s.secondaryHref,
    secondaryLabel: s.secondaryLabel,
  }));
}
