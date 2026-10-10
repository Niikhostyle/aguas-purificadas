import Link from "next/link";
import type { Metadata } from "next";
import { BenefitsSection } from "@/components/storefront/benefits";
import { ProductGrid } from "@/components/storefront/product-grid";
import { getTenantProducts, requireTenant } from "@/lib/tenant";

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await requireTenant();
  return {
    title: `${tenant.name} | Agua purificada libre de sodio y de alta pureza`,
    description: tenant.tagline ?? tenant.about ?? undefined,
  };
}

export default async function HomePage() {
  const tenant = await requireTenant();
  const products = await getTenantProducts(tenant.id);
  const heroImg =
    tenant.heroImageUrl || "/brand/rio-claro/hero.jpg";
  const headline =
    tenant.heroHeadline || "Soluciones integrales de agua purificada";
  const body =
    tenant.heroBody ||
    tenant.about ||
    "El proceso de purificación es por multietapas, comenzando por agua de red domiciliaria que luego de pasar por 5 etapas se obtiene Agua Purificada no mineral y libre de sodio.";

  return (
    <>
      {/* Hero — full-bleed like reference banner */}
      <section className="relative min-h-[420px] overflow-hidden md:min-h-[520px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={heroImg}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-[linear-gradient(105deg,rgba(18,50,110,0.82)_0%,rgba(0,177,226,0.35)_55%,rgba(0,0,0,0.15)_100%)]" />
        <div className="relative mx-auto flex min-h-[420px] max-w-6xl flex-col justify-center px-4 py-16 md:min-h-[520px] md:px-6">
          <p className="rc-display text-sm font-semibold uppercase tracking-[0.2em] text-white/90">
            {tenant.name}
          </p>
          <h1 className="rc-display mt-3 max-w-2xl text-4xl uppercase leading-none text-white md:text-6xl">
            {headline}
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-white/90 md:text-lg">
            {body}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/productos"
              className="bg-[var(--brand)] px-6 py-3 text-sm font-bold uppercase tracking-wide text-white hover:bg-white hover:text-[var(--brand-deep)]"
            >
              Nuestros productos
            </Link>
            <Link
              href="/#contacto"
              className="border border-white px-6 py-3 text-sm font-bold uppercase tracking-wide text-white hover:bg-white hover:text-[var(--brand-deep)]"
            >
              Contacto
            </Link>
          </div>
        </div>
      </section>

      {/* Productos */}
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

      <BenefitsSection />

      {/* Nosotros */}
      <section id="nosotros" className="border-t border-[#e4eef4] bg-white py-16">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 md:grid-cols-2 md:px-6 md:items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/rio-claro/hero-2.jpg"
            alt=""
            className="aspect-[4/3] w-full object-cover"
          />
          <div>
            <h2 className="rc-display text-4xl uppercase text-[var(--brand-deep)]">
              Quiénes somos
            </h2>
            <p className="mt-4 text-base leading-relaxed text-[#5a6578]">
              {tenant.about}
            </p>
            {(tenant.phone || tenant.phoneSecondary) && (
              <p className="mt-6 text-lg font-bold text-[var(--brand)]">
                Llámanos al{" "}
                {[tenant.phone, tenant.phoneSecondary]
                  .filter(Boolean)
                  .join(" | ")}
              </p>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
