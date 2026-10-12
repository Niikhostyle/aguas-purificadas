import type { Metadata } from "next";
import { headers } from "next/headers";
import { BenefitsSection } from "@/components/storefront/benefits";
import { BrandMark } from "@/components/storefront/brand-mark";
import { NeutralBenefits } from "@/components/storefront/neutral-benefits";
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
import {
  defaultStorefrontSlides,
  parseHeroSlides,
  tenantSlidesToCarousel,
} from "@/lib/hero-slides";
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
  return [
    { label: "Logo", href: "/admin/apariencia", done: Boolean(tenant.logoUrl) },
    { label: "Colores en Apariencia", href: "/admin/apariencia", done: customColors },
    { label: "Productos", href: "/admin/productos", done: productCount > 0 },
    { label: "WhatsApp", href: "/admin/marca", done: Boolean(tenant.whatsapp) },
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
    (s) => showcase || !isTemplateAsset(s.imageUrl),
  );

  let hero: React.ReactNode;
  if (showcase) {
    const headline =
      tenant.heroHeadline ||
      (audience === "empresa"
        ? "Agua purificada para tu empresa"
        : "Agua purificada para tu hogar");
    const body =
      tenant.heroBody ||
      tenant.about ||
      "Purificación multietapas, libre de sodio. Pedí online, elegí tu ciudad y recibí en ruta.";
    const slides =
      configured.length > 0
        ? tenantSlidesToCarousel(configured, brandName).map((s) => ({
            ...s,
            title: s.title || headline,
            body: s.body || body,
          }))
        : defaultStorefrontSlides({
            brandName,
            headline,
            body,
            legacyHeroImage: tenant.heroImageUrl,
          });
    hero = <HeroCarousel slides={slides} />;
  } else {
    const title = tenant.heroHeadline || "Agua purificada a domicilio";
    const body =
      tenant.heroBody ||
      tenant.tagline ||
      `Pide en línea bidones de agua purificada y recíbelos en tu hogar u oficina${
        tenant.city ? ` en ${tenant.city}` : ""
      }.`;
    const legacyImage =
      tenant.heroImageUrl && !isTemplateAsset(tenant.heroImageUrl) ? tenant.heroImageUrl : null;
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
    hero = slides.length ? (
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
  }

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

      <DescuentosSection flags={flags} content={content} audience={audience} />

      <Reveal>
        <section id="productos" className="mx-auto max-w-6xl px-4 py-16 md:px-6">
          <h2 className="rc-display text-center text-4xl uppercase text-[var(--brand-deep)] md:text-5xl">
            nuestros productos
          </h2>
          {products.length > 0 ? (
            <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-[#5a6578]">
              {showcase
                ? "Precios en pesos chilenos. Agregá al carrito y pagá con WebPay."
                : "Precios en pesos chilenos. Agrega tus productos al carrito y coordina tu despacho."}
            </p>
          ) : null}
          <div className="mt-10">
            <ProductGrid products={products} whatsappHref={whatsappContact} />
          </div>
        </section>
      </Reveal>

      <PlanesSection flags={flags} content={content} audience={audience} />
      <KitsSection flags={flags} content={content} audience={audience} />

      {showcase ? <BenefitsSection /> : <NeutralBenefits />}

      <RedesSection flags={flags} content={content} />
      <CertificacionesSection flags={flags} content={content} />

      <section id="nosotros" className="border-t border-[#e4eef4] bg-white py-16">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 md:grid-cols-2 md:items-center md:px-6">
          {showcase ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src="/brand/rio-claro/destacado-04.jpg"
              alt=""
              className="aspect-[4/3] w-full object-cover"
            />
          ) : (
            <div className="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-2xl bg-[linear-gradient(135deg,var(--brand)_0%,var(--brand-deep)_100%)] p-8">
              <div aria-hidden className="absolute -right-16 -top-16 size-64 rounded-full bg-white/10" />
              <div aria-hidden className="absolute -bottom-20 -left-10 size-72 rounded-full bg-white/10" />
              <div className="relative rounded-2xl bg-white/95 px-6 py-5 shadow-xl">
                <BrandMark name={tenant.name} logoUrl={tenant.logoUrl} subtitle="Agua purificada" />
              </div>
            </div>
          )}
          <div>
            <h2 className="rc-display text-4xl uppercase text-[var(--brand-deep)]">
              Quiénes somos
            </h2>
            <p className="mt-4 text-base leading-relaxed text-[#5a6578]">{about}</p>
            {(tenant.phone || tenant.phoneSecondary) && (
              <p id="contacto" className="mt-6 text-lg font-bold text-[var(--brand)]">
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
                className="mt-4 inline-flex items-center rounded-full bg-[#25D366] px-5 py-2 text-sm font-bold uppercase text-white hover:bg-[#1ebe5b]"
              >
                Escríbenos por WhatsApp
              </a>
            ) : null}
          </div>
        </div>
      </section>
    </>
  );
}
