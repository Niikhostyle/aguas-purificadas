import type { Metadata } from "next";
import { ProductGrid } from "@/components/storefront/product-grid";
import { getTenantProducts, requireTenant } from "@/lib/tenant";
import { tenantWhatsappHref } from "@/lib/whatsapp";

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await requireTenant();
  return { title: `Productos · ${tenant.name}` };
}

export default async function ProductsPage() {
  const tenant = await requireTenant();
  const products = await getTenantProducts(tenant.id);

  return (
    <div className="bg-[linear-gradient(180deg,var(--mist)_0%,#fff_520px)]">
      <div className="relative overflow-hidden bg-[linear-gradient(120deg,var(--brand)_0%,color-mix(in_srgb,var(--brand)_55%,var(--brand-deep))_100%)] px-4 py-12 text-center text-white md:px-6 md:py-14">
        <div aria-hidden className="pointer-events-none absolute -left-20 -top-24 size-72 rounded-full bg-white/10 blur-2xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-28 right-[8%] size-80 rounded-full bg-white/10 blur-3xl" />
        <div className="relative sf-rise-stagger">
          <h1 className="rc-display text-4xl uppercase md:text-6xl">
            nuestros productos
          </h1>
          <p className="mt-3 text-sm text-white/90">
            Catálogo de {tenant.name}
          </p>
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-16">
        <ProductGrid
          products={products}
          whatsappHref={tenantWhatsappHref(
            tenant.whatsapp,
            `Hola ${tenant.name}, quiero hacer un pedido.`,
          )}
        />
      </div>
    </div>
  );
}
