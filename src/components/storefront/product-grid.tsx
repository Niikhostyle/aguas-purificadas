import Link from "next/link";
import { Droplets, MessageCircle, PackageOpen } from "lucide-react";
import type { Product } from "@prisma/client";
import { formatClp } from "@/lib/utils";

export function ProductGrid({
  products,
  whatsappHref,
}: {
  products: Product[];
  /** Shown as the call to action while the catalog is empty. */
  whatsappHref?: string | null;
}) {
  if (products.length === 0) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center rounded-2xl border border-dashed border-[#c9dbe6] bg-white px-6 py-12 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-[var(--mist)] text-[var(--brand)]">
          <PackageOpen className="size-7" aria-hidden />
        </span>
        <h3 className="rc-display mt-4 text-2xl uppercase text-[var(--brand-deep)]">
          Pronto publicaremos nuestros productos
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-[#5a6578]">
          Estamos preparando el catálogo en línea.
          {whatsappHref
            ? " Mientras tanto, escríbenos y te ayudamos con tu pedido."
            : " Vuelve pronto o contáctanos con los datos al final de la página."}
        </p>
        {whatsappHref ? (
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#25D366] px-5 py-2.5 text-sm font-bold uppercase text-white hover:bg-[#1ebe5b]"
          >
            <MessageCircle className="size-4" aria-hidden />
            Pedir por WhatsApp
          </a>
        ) : null}
      </div>
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
                <div className="flex h-full items-center justify-center bg-[var(--mist)] text-[var(--brand)]">
                  <Droplets className="size-16 opacity-40" aria-label="Sin imagen" />
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
              <span className="mt-4 rc-btn-primary inline-flex items-center justify-center px-3 py-2 text-xs font-bold uppercase tracking-wide">
                Ver detalle
              </span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
