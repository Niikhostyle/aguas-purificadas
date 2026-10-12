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
    <div className="bg-[#f7fbfd]">
      <div className="bg-[var(--brand)] px-4 py-10 text-center text-white md:px-6">
        <h1 className="rc-display text-4xl uppercase md:text-5xl">
          nuestros productos
        </h1>
        <p className="mt-2 text-sm text-white/90">
          Catálogo de {tenant.name}
        </p>
      </div>
      <div className="mx-auto max-w-6xl px-4 py-12 md:px-6">
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
