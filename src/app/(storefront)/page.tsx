import Link from "next/link";
import type { Metadata } from "next";
import { ProductGrid } from "@/components/storefront/product-grid";
import {
  getTenantDeliveryZones,
  getTenantProducts,
  requireTenant,
} from "@/lib/tenant";

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await requireTenant();
  return {
    title: tenant.name,
    description: tenant.tagline ?? undefined,
  };
}

export default async function HomePage() {
  const tenant = await requireTenant();
  const [products, zones] = await Promise.all([
    getTenantProducts(tenant.id),
    getTenantDeliveryZones(tenant.id),
  ]);
  const featured = products.slice(0, 3);

  return (
    <>
      <section className="relative min-h-[100svh] overflow-hidden">
        {/* Full-bleed hero visual — mountain water / clear stream */}
        <div
          className="animate-mist absolute inset-0 scale-105 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=2000&q=80')",
          }}
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-[linear-gradient(120deg,rgba(6,40,36,0.82)_0%,rgba(10,70,62,0.55)_45%,rgba(15,50,70,0.45)_100%)]"
          aria-hidden
        />

        <div className="relative mx-auto flex min-h-[100svh] max-w-6xl flex-col justify-end px-5 pb-16 pt-28 md:px-8 md:pb-24">
          <p className="animate-hero-rise font-[family-name:var(--font-display)] text-4xl leading-none tracking-tight text-white md:text-6xl lg:text-7xl">
            {tenant.name}
          </p>
          <h1 className="animate-hero-rise-delay mt-5 max-w-xl text-xl font-normal text-white/95 md:text-2xl">
            {tenant.tagline ?? "Agua purificada a domicilio"}
          </h1>
          <p className="animate-hero-rise-delay-2 mt-4 max-w-md text-base text-white/80">
            Pedí bidones, packs y dispensadores con despacho en tu comuna.
          </p>
          <div className="animate-hero-rise-delay-2 mt-8 flex flex-wrap gap-3">
            <Link
              href="/productos"
              className="inline-flex items-center justify-center rounded-md bg-white px-5 py-2.5 text-sm font-semibold text-[var(--brand-deep)] transition hover:bg-[#e8f4f1]"
            >
              Ver productos
            </Link>
            {tenant.whatsapp ? (
              <a
                href={`https://wa.me/${tenant.whatsapp.replace(/\D/g, "")}`}
                className="inline-flex items-center justify-center rounded-md border border-white/40 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-white/10"
                target="_blank"
                rel="noreferrer"
              >
                Pedir por WhatsApp
              </a>
            ) : null}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-20 md:px-8">
        <div className="max-w-2xl">
          <h2 className="font-[family-name:var(--font-display)] text-3xl text-[var(--brand-deep)] md:text-4xl">
            Catálogo
          </h2>
          <p className="mt-3 text-[#4a655f]">
            Precios en pesos chilenos. El carrito y WebPay llegan en la siguiente
            fase; por ahora podés revisar el listado completo.
          </p>
        </div>
        <div className="mt-10">
          <ProductGrid products={featured} />
        </div>
        {products.length > featured.length ? (
          <div className="mt-10">
            <Link
              href="/productos"
              className="text-sm font-semibold text-[var(--brand)] underline-offset-4 hover:underline"
            >
              Ver todo el catálogo
            </Link>
          </div>
        ) : null}
      </section>

      <section
        id="nosotros"
        className="border-y border-[#c5d8d2] bg-[linear-gradient(180deg,#eef6f3_0%,#f3f7f6_100%)]"
      >
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-20 md:grid-cols-2 md:px-8">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-3xl text-[var(--brand-deep)] md:text-4xl">
              Quiénes somos
            </h2>
            <p className="mt-4 max-w-prose text-base leading-relaxed text-[#2f4a44]">
              {tenant.about}
            </p>
          </div>
          <div>
            <h3 className="font-[family-name:var(--font-display)] text-2xl text-[var(--brand-deep)]">
              Zonas de despacho
            </h3>
            <p className="mt-2 text-sm text-[#4a655f]">
              Cobertura demo (stub para carrito en Fase 2).
            </p>
            <ul className="mt-6 space-y-4">
              {zones.map((zone) => (
                <li key={zone.id} className="border-b border-[#c5d8d2] pb-4">
                  <p className="font-medium text-[var(--brand-deep)]">
                    {zone.name}
                  </p>
                  <p className="text-sm text-[#4a655f]">{zone.communes}</p>
                  <p className="mt-1 text-sm text-[var(--brand)]">
                    {zone.costClp === 0
                      ? "Despacho gratis"
                      : `Despacho $${zone.costClp.toLocaleString("es-CL")}`}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}
