import Link from "next/link";
import type { Product } from "@prisma/client";
import { formatClp } from "@/lib/utils";

export function ProductGrid({ products }: { products: Product[] }) {
  if (products.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-[#b7cdc6] bg-white/60 px-6 py-12 text-center text-[#4a655f]">
        Aún no hay productos publicados. El administrador puede cargarlos desde
        el panel.
      </p>
    );
  }

  return (
    <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product, index) => (
        <li
          key={product.id}
          className="animate-fade-up group"
          style={{ animationDelay: `${index * 80}ms` }}
        >
          <Link href={`/productos/${product.slug}`} className="block">
            <div className="aspect-[4/3] overflow-hidden bg-[linear-gradient(145deg,#d7ebe6_0%,#b8d8d4_45%,#8ebfb8_100%)] transition duration-500 group-hover:brightness-105">
              <div className="flex h-full items-end p-5">
                <span className="font-[family-name:var(--font-display)] text-3xl text-[var(--brand-deep)]/25">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>
            </div>
            <div className="mt-4 space-y-1">
              <h3 className="font-[family-name:var(--font-display)] text-xl text-[var(--brand-deep)]">
                {product.name}
              </h3>
              {product.description ? (
                <p className="line-clamp-2 text-sm text-[#4a655f]">
                  {product.description}
                </p>
              ) : null}
              <p className="pt-1 text-base font-medium text-[var(--brand)]">
                {formatClp(product.priceClp)}
              </p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
