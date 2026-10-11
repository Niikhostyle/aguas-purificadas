import type { Metadata } from "next";
import { headers } from "next/headers";
import { BenefitsSection } from "@/components/storefront/benefits";
import { ProductGrid } from "@/components/storefront/product-grid";
import {
  AudienceHeroBand,
  CertificacionesSection,
  DescuentosSection,
  KitsSection,
  PlanesSection,
  RedesSection,
} from "@/components/storefront/module-sections";
import { Reveal } from "@/components/storefront/reveal";
import { HeroCarousel } from "@/components/hero-carousel";
import {
  defaultStorefrontSlides,
  parseHeroSlides,
  tenantSlidesToCarousel,
} from "@/lib/hero-slides";
import {
  DEFAULT_MODULE_FLAGS,
  defaultDemoModulesContent,
  parseModuleFlags,
  parseModulesContent,
  type Audience,
} from "@/lib/modules";
import { getTenantProducts, requireTenant } from "@/lib/tenant";
import { tenantWhatsappHref } from "@/lib/whatsapp";

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await requireTenant();
  const h = await headers();
  const host = (h.get("host") || "").split(":")[0].toLowerCase();
  const isDemo = host.startsWith("demo.") || tenant.slug === "demo";
  const name = isDemo ? "Demo" : tenant.name;
  return {
    title: `${name} | Agua purificada para hogar y empresa`,
    description: tenant.tagline ?? tenant.about ?? undefined,
  };
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
  const whatsappContact = tenantWhatsappHref(
    tenant.whatsapp,
    `Hola ${tenant.name}, quiero hacer un pedido.`,
  );

  const sp = await searchParams;
  const audience: Audience = sp.audience === "empresa" ? "empresa" : "hogar";

  const flags = parseModuleFlags(tenant.modulesEnabled ?? DEFAULT_MODULE_FLAGS);
  let content = parseModulesContent(tenant.modulesContent);
  if (
    isDemo &&
    !content.descuentos.length &&
    !content.planes.length &&
    !content.kits.length
  ) {
    content = defaultDemoModulesContent();
  }

  const headline =
    tenant.heroHeadline ||
    (audience === "empresa"
      ? "Agua purificada para tu empresa"
      : "Agua purificada para tu hogar");
  const body =
    tenant.heroBody ||
    tenant.about ||
    "Purificación multietapas, libre de sodio. Pedí online, elegí tu ciudad y recibí en ruta.";

  const configured = parseHeroSlides(tenant.heroSlides);
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

  return (
    <>
      <HeroCarousel slides={slides} />

      {flags.hogarEmpresa ? (
        <AudienceHeroBand audience={audience} content={content} />
      ) : null}

      <DescuentosSection flags={flags} content={content} audience={audience} />

      <Reveal>
        <section className="mx-auto max-w-6xl px-4 py-16 md:px-6">
          <h2 className="rc-display text-center text-4xl uppercase text-[var(--brand-deep)] md:text-5xl">
            nuestros productos
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-[#5a6578]">
            Precios en pesos chilenos. Agregá al carrito y pagá con WebPay.
          </p>
          <div className="mt-10">
            <ProductGrid products={products} />
          </div>
        </section>
      </Reveal>

      <PlanesSection flags={flags} content={content} audience={audience} />
      <KitsSection flags={flags} content={content} audience={audience} />

      <BenefitsSection />

      <RedesSection flags={flags} content={content} />
      <CertificacionesSection flags={flags} content={content} />

      <section id="nosotros" className="border-t border-[#e4eef4] bg-white py-16">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 md:grid-cols-2 md:items-center md:px-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/rio-claro/destacado-04.jpg"
            alt=""
            className="aspect-[4/3] w-full object-cover"
          />
          <div>
            <h2 className="rc-display text-4xl uppercase text-[var(--brand-deep)]">
              Quiénes somos
            </h2>
            <p className="mt-4 text-base leading-relaxed text-[#5a6578]">
              {tenant.about ||
                "Somos Demo MiBidón: una tienda de ejemplo de la plataforma multi-empresa para agua purificada en Chile."}
            </p>
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
