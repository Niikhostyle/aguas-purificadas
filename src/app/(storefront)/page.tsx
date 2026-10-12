import type { Metadata } from "next";
import { headers } from "next/headers";
import { MessageCircle, Phone } from "lucide-react";
import { BenefitsSection } from "@/components/storefront/benefits";
import { BrandMark } from "@/components/storefront/brand-mark";
import { NeutralHero } from "@/components/storefront/neutral-hero";
import { ProductGrid } from "@/components/storefront/product-grid";
import { SetupChecklist, type SetupStep } from "@/components/storefront/setup-checklist";
import {
  AudienceHeroBand,
  CertificacionesSection,
  DescuentosSection,
  KitsSection,
  PlanesSection,
  RedesSection,
} from "@/components/storefront/module-sections";
import { Reveal } from "@/components/storefront/reveal";
import { HeroCarousel, type HeroSlide } from "@/components/hero-carousel";
import { getAdminSession } from "@/lib/auth";
import { STOREFRONT_PRIMARY, STOREFRONT_SECONDARY } from "@/lib/branding";
import { prisma } from "@/lib/db";
import { zonesNeedSetup } from "@/lib/delivery-zones";
import { getLiveDiscounts, priceProducts, promoCards } from "@/lib/discounts";
import { parseHeroSlides, tenantSlidesToCarousel } from "@/lib/hero-slides";
import { DEFAULT_MODULE_FLAGS, parseModuleFlags, type Audience } from "@/lib/modules";
import { parseAppearance } from "@/lib/appearance";
import {
  isTemplateAsset,
  storefrontModulesContent,
  usesTemplateShowcase,
} from "@/lib/storefront-defaults";
import { getTenantProducts, requireTenant } from "@/lib/tenant";
import { tenantWhatsappHref } from "@/lib/whatsapp";
import type { Tenant } from "@prisma/client";

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await requireTenant();
  const h = await headers();
  const host = (h.get("host") || "").split(":")[0].toLowerCase();
  const isDemo = host.startsWith("demo.") || tenant.slug === "demo";
  const name = isDemo ? "Demo" : tenant.name;
  return {
    title: `${name} | Agua purificada para hogar y empresa`,
    description:
      tenant.tagline ??
      tenant.about ??
      `${name}: agua purificada a domicilio para hogar y empresa.`,
  };
}

async function setupStepsFor(tenant: Tenant, productCount: number): Promise<SetupStep[] | null> {
  const admin = await getAdminSession();
  if (!admin || admin.role === "super_admin" || admin.tenantId !== tenant.id) return null;
  const content = storefrontModulesContent(tenant, false);
  const customColors =
    Object.keys(parseAppearance(tenant.appearance)).length > 0 ||
    tenant.primaryColor.toLowerCase() !== STOREFRONT_PRIMARY.toLowerCase() ||
    tenant.secondaryColor.toLowerCase() !== STOREFRONT_SECONDARY.toLowerCase();
  const zones = await prisma.deliveryZone.findMany({
    where: { tenantId: tenant.id },
    select: { active: true, createdAt: true, updatedAt: true },
  });
  return [
    { label: "Logo", href: "/admin/apariencia", done: Boolean(tenant.logoUrl) },
    { label: "Colores en Apariencia", href: "/admin/apariencia", done: customColors },
    { label: "Productos", href: "/admin/productos", done: productCount > 0 },
    { label: "WhatsApp", href: "/admin/marca", done: Boolean(tenant.whatsapp) },
    { label: "Zonas de despacho", href: "/admin/zonas", done: !zonesNeedSetup(zones) },
    {
      label: "Cobertura",
      href: "/admin/marca",
      done: Boolean(tenant.coverageText?.trim()) || content.regions.length > 0,
    },
  ];
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ audience?: string }>;
}) {
  const tenant = await requireTenant();
  const products = await getTenantProducts(tenant.id);
  const h = await headers();
  const host = (h.get("host") || "").split(":")[0].toLowerCase();
  const isDemo = host.startsWith("demo.") || tenant.slug === "demo";
  const brandName = isDemo ? "Demo" : tenant.name;
  const showcase = usesTemplateShowcase(tenant);
  const whatsappContact = tenantWhatsappHref(
    tenant.whatsapp,
    `Hola ${tenant.name}, quiero hacer un pedido.`,
  );

  const sp = await searchParams;
  const audience: Audience = sp.audience === "empresa" ? "empresa" : "hogar";

  const flags = parseModuleFlags(tenant.modulesEnabled ?? DEFAULT_MODULE_FLAGS);
  const content = storefrontModulesContent(tenant, isDemo);
  const setupSteps = showcase ? null : await setupStepsFor(tenant, products.length);

  const configured = parseHeroSlides(tenant.heroSlides).filter(
    (s) => !isTemplateAsset(s.imageUrl),
  );
  const discounts = await getLiveDiscounts(tenant.id);

  const title =
    tenant.heroHeadline ||
    (showcase
      ? audience === "empresa"
        ? "Agua purificada para tu empresa"
        : "Agua purificada para tu hogar"
      : "Agua purificada a domicilio");
  const body =
    tenant.heroBody ||
    (showcase ? tenant.about : tenant.tagline) ||
    `Pide en línea bidones de agua purificada y recíbelos en tu hogar u oficina${
      tenant.city ? ` en ${tenant.city}` : ""
    }.`;
  const legacyImage =
    tenant.heroImageUrl && !isTemplateAsset(tenant.heroImageUrl) ? tenant.heroImageUrl : null;
  // Only banners the tenant uploaded itself; without them the hero is a text + brand-color cover.
  const slides: HeroSlide[] =
    configured.length > 0
      ? tenantSlidesToCarousel(configured, brandName).map((s) => ({
          ...s,
          title: s.title || title,
          body: s.body || body,
        }))
      : legacyImage
        ? [
            {
              image: legacyImage,
              eyebrow: brandName,
              title,
              body,
              primaryHref: "/productos",
              primaryLabel: "Ver productos",
            },
          ]
        : [];
  const hero = slides.length ? (
    <HeroCarousel slides={slides} />
  ) : (
    <NeutralHero
      brandName={brandName}
      title={title}
      body={body}
      whatsappHref={whatsappContact}
      highlights={[
        tenant.city ? `Despacho en ${tenant.city}` : "Despacho a domicilio",
        "Hogar y oficina",
        ...(whatsappContact ? ["Pedidos por WhatsApp"] : []),
      ]}
    />
  );

  const about =
    tenant.about ||
    (showcase
      ? "Somos Demo MiBidón: una tienda de ejemplo de la plataforma multi-empresa para agua purificada en Chile."
      : `En ${tenant.name} llevamos agua purificada a hogares y empresas${
          tenant.city ? ` de ${tenant.city}` : ""
        }. Escríbenos para coordinar tu pedido o resolver cualquier duda.`);

  return (
    <>
      {setupSteps ? <SetupChecklist steps={setupSteps} /> : null}

      {hero}

      {flags.hogarEmpresa ? (
        <AudienceHeroBand audience={audience} content={content} />
      ) : null}

      <DescuentosSection flags={flags} offers={promoCards(discounts)} />

      <Reveal>
        <section id="productos" className="mx-auto max-w-6xl px-4 py-16 md:px-6">
          <h2 className="sf-title rc-display text-center text-4xl uppercase text-[var(--brand-deep)] md:text-5xl">
            nuestros productos
          </h2>
          {products.length > 0 ? (
            <p className="mx-auto mt-4 max-w-2xl text-center text-sm text-[#5a6578]">
              {showcase
                ? "Precios en pesos chilenos. Agrega al carrito y paga con WebPay."
                : "Precios en pesos chilenos. Agrega tus productos al carrito y coordina tu despacho."}
            </p>
          ) : null}
          <div className="mt-10">
            <ProductGrid
              products={products}
              prices={priceProducts(products, discounts)}
              whatsappHref={whatsappContact}
            />
          </div>
        </section>
      </Reveal>

      <PlanesSection flags={flags} content={content} audience={audience} />
      <KitsSection flags={flags} content={content} audience={audience} />

      <BenefitsSection title={content.beneficiosTitle} items={content.beneficios} />

      <RedesSection flags={flags} content={content} />
      <CertificacionesSection flags={flags} content={content} />

      <section id="nosotros" className="border-t border-[var(--sf-line)] bg-white py-16 md:py-20">
        <Reveal className="mx-auto grid max-w-6xl gap-10 px-4 md:grid-cols-2 md:items-center md:gap-14 md:px-6">
          {showcase ? (
            <div className="relative">
              <div
                aria-hidden
                className="absolute -inset-3 -z-0 rotate-[-2deg] rounded-[calc(var(--radius)*3)] bg-[linear-gradient(135deg,var(--mist)_0%,color-mix(in_srgb,var(--brand)_18%,#fff)_100%)]"
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/rio-claro/destacado-04.jpg"
                alt=""
                loading="lazy"
                className="relative aspect-[4/3] w-full rounded-[calc(var(--radius)*2.4)] object-cover shadow-[var(--sf-shadow-lg)] ring-1 ring-black/5"
              />
            </div>
          ) : (
            <div className="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-[calc(var(--radius)*2.4)] bg-[linear-gradient(135deg,var(--brand)_0%,var(--brand-deep)_100%)] p-8 shadow-[var(--sf-shadow-lg)]">
              <div aria-hidden className="absolute -right-16 -top-16 size-64 rounded-full bg-white/10" />
              <div aria-hidden className="absolute -bottom-20 -left-10 size-72 rounded-full bg-white/10" />
              <div className="relative rounded-2xl bg-white/95 px-6 py-5 shadow-xl ring-1 ring-white/60">
                <BrandMark name={tenant.name} logoUrl={tenant.logoUrl} subtitle="Agua purificada" />
              </div>
            </div>
          )}
          <div>
            <span className="sf-eyebrow">Nosotros</span>
            <h2 className="sf-title sf-title-start rc-display mt-3 text-4xl uppercase text-[var(--brand-deep)] md:text-5xl">
              Quiénes somos
            </h2>
            <p className="mt-5 text-base leading-relaxed text-[#5a6578]">{about}</p>
            {(tenant.phone || tenant.phoneSecondary) && (
              <p id="contacto" className="mt-6 flex flex-wrap items-center gap-2 text-lg font-bold text-[var(--brand)]">
                <Phone className="size-5" aria-hidden />
                Llámanos al{" "}
                {[tenant.phone, tenant.phoneSecondary]
                  .filter(Boolean)
                  .join(" | ")}
              </p>
            )}
            {whatsappContact ? (
              <a
                href={whatsappContact}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#25D366] px-5 py-2.5 text-sm font-bold uppercase text-white shadow-[0_10px_24px_-10px_rgba(37,211,102,0.8)] transition duration-300 hover:-translate-y-0.5 hover:bg-[#1ebe5b] active:translate-y-0 active:scale-[0.98]"
              >
                <MessageCircle className="size-4" aria-hidden />
                Escríbenos por WhatsApp
              </a>
            ) : null}
          </div>
        </Reveal>
      </section>
    </>
  );
}
