import Link from "next/link";
import type { Metadata } from "next";
import {
  removeFromCartAction,
  updateCartQuantityAction,
} from "@/app/(storefront)/cart-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getResolvedCart } from "@/lib/cart";
import { requireTenant } from "@/lib/tenant";
import { formatClp } from "@/lib/utils";

export const metadata: Metadata = { title: "Carrito" };

export default async function CartPage() {
  const tenant = await requireTenant();
  const cart = await getResolvedCart(tenant.id);

  return (
    <div className="bg-[linear-gradient(180deg,#e8f4f1_0%,#f3f7f6_35%)]">
      <div className="mx-auto max-w-3xl px-5 pb-20 pt-12 md:px-8">
        <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--brand-deep)]">
          Carrito
        </h1>
        <p className="mt-2 text-[#4a655f]">
          Revisá cantidades y seguí al checkout para elegir zona de despacho.
        </p>

        {cart.items.length === 0 ? (
          <div className="mt-12 border-t border-[#c5d8d2] pt-10 text-center">
            <p className="text-[#4a655f]">Tu carrito está vacío.</p>
            <Link
              href="/productos"
              className="mt-6 inline-flex rounded-md bg-[var(--brand)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[var(--brand-deep)]"
            >
              Ver productos
            </Link>
          </div>
        ) : (
          <div className="mt-10 space-y-0">
            <ul className="divide-y divide-[#c5d8d2] border-y border-[#c5d8d2]">
              {cart.items.map((item) => (
                <li
                  key={item.productId}
                  className="flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <Link
                      href={`/productos/${item.slug}`}
                      className="font-[family-name:var(--font-display)] text-xl text-[var(--brand-deep)] hover:underline"
                    >
                      {item.name}
                    </Link>
                    <p className="mt-1 text-sm text-[#4a655f]">
                      {formatClp(item.unitPriceClp)} c/u
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <form
                      action={updateCartQuantityAction}
                      className="flex items-center gap-2"
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
                        className="w-20 bg-white"
                        aria-label={`Cantidad de ${item.name}`}
                      />
                      <Button type="submit" variant="outline" size="sm">
                        Actualizar
                      </Button>
                    </form>
                    <form action={removeFromCartAction}>
                      <input
                        type="hidden"
                        name="productId"
                        value={item.productId}
                      />
                      <Button type="submit" variant="ghost" size="sm">
                        Quitar
                      </Button>
                    </form>
                    <p className="min-w-24 text-right font-medium text-[var(--brand)]">
                      {formatClp(item.lineTotalClp)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm text-[#4a655f]">Subtotal productos</p>
                <p className="font-[family-name:var(--font-display)] text-3xl text-[var(--brand-deep)]">
                  {formatClp(cart.subtotalClp)}
                </p>
                <p className="mt-1 text-xs text-[#4a655f]">
                  El costo de despacho se calcula al elegir la zona.
                </p>
              </div>
              <Link
                href="/checkout"
                className="inline-flex items-center justify-center rounded-md bg-[var(--brand)] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[var(--brand-deep)]"
              >
                Ir al checkout
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
