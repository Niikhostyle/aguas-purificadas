import Link from "next/link";
import type { Product } from "@prisma/client";
import { formatClp } from "@/lib/utils";

export function ProductGrid({ products }: { products: Product[] }) {
  if (products.length === 0) {
    return (
      <p className="border border-dashed border-[#d5e3ec] px-6 py-12 text-center text-[#5a6578]">
        Aún no hay productos publicados.
      </p>
    );
  }

  return (
    <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product, index) => (
        <li
          key={product.id}
          className="animate-fade-up group flex flex-col border border-[#e4eef4] bg-white"
          style={{ animationDelay: `${Math.min(index, 8) * 50}ms` }}
        >
          <Link href={`/productos/${product.slug}`} className="flex flex-1 flex-col">
            <div className="relative aspect-square overflow-hidden bg-[#f7fbfd]">
              {product.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="h-full w-full object-contain p-4 transition duration-300 group-hover:scale-[1.03]"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-[#b0c4d2]">
                  Sin imagen
                </div>
              )}
            </div>
            <div className="flex flex-1 flex-col px-4 pb-5 pt-3 text-center">
              <h3 className="rc-display text-xl uppercase leading-tight text-[var(--brand-deep)]">
                {product.name}
              </h3>
              <p className="mt-2 text-lg font-bold text-[var(--brand)]">
                {formatClp(product.priceClp)}
              </p>
              {product.description ? (
                <p className="mt-2 line-clamp-3 text-left text-xs leading-relaxed text-[#5a6578]">
                  {product.description}
                </p>
              ) : null}
              <span className="mt-4 inline-flex items-center justify-center bg-[var(--brand)] px-3 py-2 text-xs font-bold uppercase tracking-wide text-white transition group-hover:bg-[var(--brand-deep)]">
                Ver detalle
              </span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
