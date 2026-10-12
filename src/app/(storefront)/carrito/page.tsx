import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Droplets, ShoppingBag, Trash2 } from "lucide-react";
import {
  removeFromCartAction,
  updateCartQuantityAction,
} from "@/app/(storefront)/cart-actions";
import { SubmitButton } from "@/components/storefront/submit-button";
import { Input } from "@/components/ui/input";
import { getResolvedCart } from "@/lib/cart";
import { requireTenant } from "@/lib/tenant";
import { formatClp } from "@/lib/utils";

export const metadata: Metadata = { title: "Carrito" };

export default async function CartPage() {
  const tenant = await requireTenant();
  const cart = await getResolvedCart(tenant.id);

  return (
    <div className="bg-[linear-gradient(180deg,var(--mist)_0%,#fff_420px)]">
      <div className="mx-auto max-w-3xl px-4 pb-20 pt-12 md:px-8">
        <div className="sf-rise-stagger">
          <h1 className="sf-title sf-title-start rc-display text-4xl uppercase text-[var(--brand-deep)] md:text-5xl">
            Carrito
          </h1>
          <p className="mt-4 text-[#5a6578]">
            Revisá cantidades y seguí al checkout para elegir zona de despacho.
          </p>
        </div>

        {cart.items.length === 0 ? (
          <div className="sf-enter sf-card mt-10 flex flex-col items-center px-6 py-14 text-center">
            <span className="flex size-16 items-center justify-center rounded-full bg-[var(--mist)] text-[var(--brand)] ring-8 ring-[color-mix(in_srgb,var(--mist)_50%,transparent)]">
              <ShoppingBag className="size-7" aria-hidden />
            </span>
            <p className="mt-5 text-[#5a6578]">Tu carrito está vacío.</p>
            <Link
              href="/productos"
              className="rc-btn-primary group mt-6 inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold uppercase tracking-wide"
            >
              Ver productos
              <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden />
            </Link>
          </div>
        ) : (
          <div className="mt-10">
            <ul className="space-y-3">
              {cart.items.map((item, index) => (
                <li
                  key={item.productId}
                  className="sf-enter sf-card flex flex-col gap-4 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4"
                  style={{ animationDelay: `${Math.min(index, 6) * 60}ms` }}
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <Link
                      href={`/productos/${item.slug}`}
                      className="size-16 shrink-0 overflow-hidden rounded-xl bg-[radial-gradient(120%_90%_at_50%_15%,#fff_0%,var(--mist)_100%)] ring-1 ring-[var(--sf-line)]"
                      tabIndex={-1}
                      aria-hidden
                    >
                      {item.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.imageUrl} alt="" className="h-full w-full object-contain p-1.5 mix-blend-multiply" />
                      ) : (
                        <span className="flex h-full items-center justify-center text-[var(--brand)]">
                          <Droplets className="size-6 opacity-50" />
                        </span>
                      )}
                    </Link>
                    <div className="min-w-0">
                      <Link
                        href={`/productos/${item.slug}`}
                        className="rc-display block truncate text-xl uppercase text-[var(--brand-deep)] transition-colors hover:text-[var(--brand)]"
                      >
                        {item.name}
                      </Link>
                      <p className="mt-0.5 text-sm text-[#5a6578]">
                        {formatClp(item.unitPriceClp)} c/u
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 border-t border-[var(--sf-line)] pt-3 sm:border-0 sm:pt-0">
                    <form
                      action={updateCartQuantityAction}
                      className="flex items-center gap-1.5"
                    >
                      <input
                        type="hidden"
                        name="productId"
                        value={item.productId}
                      />
                      <Input
                        name="quantity"
                        type="number"
                        min={1}
                        max={99}
                        defaultValue={item.quantity}
                        className="h-9 w-16 rounded-full bg-white text-center font-semibold"
                        aria-label={`Cantidad de ${item.name}`}
                      />
                      <SubmitButton variant="outline" size="sm" className="h-9 px-3">
                        Actualizar
                      </SubmitButton>
                    </form>
                    <form action={removeFromCartAction}>
                      <input
                        type="hidden"
                        name="productId"
                        value={item.productId}
                      />
                      <SubmitButton
                        variant="ghost"
                        size="sm"
                        className="h-9 px-3 text-[#5a6578] hover:bg-red-50 hover:text-red-700"
                        icon={<Trash2 className="size-3.5" aria-hidden />}
                      >
                        Quitar
                      </SubmitButton>
                    </form>
                    <p className="ml-auto min-w-24 text-right text-lg font-bold text-[var(--brand)]">
                      {formatClp(item.lineTotalClp)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="sf-enter sf-card mt-6 flex flex-col gap-5 p-6 [animation-delay:200ms] sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm text-[#5a6578]">Subtotal productos</p>
                <p className="rc-display text-4xl text-[var(--brand-deep)]">
                  {formatClp(cart.subtotalClp)}
                </p>
                <p className="mt-1 text-xs text-[#5a6578]">
                  El costo de despacho se calcula al elegir la zona.
                </p>
              </div>
              <Link
                href="/checkout"
                className="rc-btn-primary group inline-flex items-center justify-center gap-2 px-7 py-3 text-sm font-bold uppercase tracking-wide"
              >
                Ir al checkout
                <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
