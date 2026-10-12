import Link from "next/link";
import { ArrowRight, Droplets, MessageCircle, PackageOpen } from "lucide-react";
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
    <ul className="grid gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product, index) => (
        <li
          key={product.id}
          className="sf-enter sf-card sf-card-hover group flex flex-col overflow-hidden"
          style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}
        >
          <Link href={`/productos/${product.slug}`} className="flex flex-1 flex-col focus-visible:outline-offset-[-2px]">
            <div className="relative m-2 mb-0 aspect-square overflow-hidden rounded-[calc(var(--radius)*1.4)] bg-[radial-gradient(120%_90%_at_50%_15%,#fff_0%,var(--mist)_100%)]">
              {product.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  loading="lazy"
                  className="h-full w-full object-contain p-5 mix-blend-multiply transition duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06]"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-[var(--brand)]">
                  <Droplets className="size-16 opacity-40" aria-label="Sin imagen" />
                </div>
              )}
            </div>
            <div className="flex flex-1 flex-col px-5 pb-5 pt-4 text-center">
              <h3 className="rc-display text-xl uppercase leading-tight text-[var(--brand-deep)]">
                {product.name}
              </h3>
              <p className="mx-auto mt-2 inline-flex rounded-full bg-[color-mix(in_srgb,var(--brand)_10%,#fff)] px-3 py-0.5 text-lg font-bold text-[var(--brand)]">
                {formatClp(product.priceClp)}
              </p>
              {product.description ? (
                <p className="mt-3 line-clamp-3 text-left text-xs leading-relaxed text-[#5a6578]">
                  {product.description}
                </p>
              ) : null}
              <div className="mt-auto pt-4">
                <span className="rc-btn-primary flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold uppercase tracking-wide">
                  Ver detalle
                  <ArrowRight
                    className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </span>
              </div>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
