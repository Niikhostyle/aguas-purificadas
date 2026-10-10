import type { Metadata } from "next";
import { ProductGrid } from "@/components/storefront/product-grid";
import { getTenantProducts, requireTenant } from "@/lib/tenant";

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await requireTenant();
  return { title: `Productos · ${tenant.name}` };
}

export default async function ProductsPage() {
  const tenant = await requireTenant();
  const products = await getTenantProducts(tenant.id);

  return (
    <div className="bg-[linear-gradient(180deg,#dceee9_0%,#f3f7f6_28%)]">
      <div className="mx-auto max-w-6xl px-5 pb-20 pt-28 md:px-8">
        <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--brand-deep)] md:text-5xl">
          Productos
        </h1>
        <p className="mt-3 max-w-xl text-[#4a655f]">
          Catálogo de {tenant.name}. Precios en CLP, listos para despacho en las
          comunas cubiertas.
        </p>
        <div className="mt-12">
          <ProductGrid products={products} />
        </div>
      </div>
    </div>
  );
}
