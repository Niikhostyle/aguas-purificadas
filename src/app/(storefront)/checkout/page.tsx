import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { placeOrderAction } from "@/app/(storefront)/cart-actions";
import { CheckoutZoneTotal } from "@/components/storefront/checkout-zone-total";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getResolvedCart } from "@/lib/cart";
import { getTenantDeliveryZones, requireTenant } from "@/lib/tenant";
import { formatClp } from "@/lib/utils";

export const metadata: Metadata = { title: "Checkout" };

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const tenant = await requireTenant();
  const cart = await getResolvedCart(tenant.id);
  if (cart.items.length === 0) redirect("/carrito");

  const zones = await getTenantDeliveryZones(tenant.id);
  const { error } = await searchParams;

  return (
    <div className="bg-[linear-gradient(180deg,#e8f4f1_0%,#f3f7f6_40%)]">
      <div className="mx-auto max-w-5xl px-5 pb-20 pt-12 md:px-8">
        <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--brand-deep)]">
          Checkout
        </h1>
        <p className="mt-2 max-w-xl text-[#4a655f]">
          Completá tus datos y la zona de despacho. Al confirmar te llevamos a
          WebPay (sandbox o mock) para pagar.
        </p>

        <div className="mt-10 grid gap-12 lg:grid-cols-[1.2fr_0.8fr]">
          <form action={placeOrderAction} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="customerName">Nombre completo</Label>
              <Input
                id="customerName"
                name="customerName"
                required
                minLength={2}
                placeholder="María González"
                className="bg-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerPhone">Teléfono / WhatsApp</Label>
              <Input
                id="customerPhone"
                name="customerPhone"
                required
                minLength={8}
                placeholder="+56 9 1234 5678"
                className="bg-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerAddress">Dirección de entrega</Label>
              <Input
                id="customerAddress"
                name="customerAddress"
                required
                minLength={5}
                placeholder="Calle, número, referencia"
                className="bg-white"
              />
            </div>
            <fieldset className="space-y-3">
              <legend className="text-sm font-medium text-[var(--brand-deep)]">
                Zona de despacho
              </legend>
              {zones.length === 0 ? (
                <p className="text-sm text-red-700">
                  No hay zonas activas. Contactá a la empresa.
                </p>
              ) : (
                <ul className="space-y-3">
                  {zones.map((zone, index) => (
                    <li key={zone.id}>
                      <label className="flex cursor-pointer gap-3 border border-[#c5d8d2] bg-white/80 px-4 py-3 transition hover:border-[var(--brand)]">
                        <input
                          type="radio"
                          name="deliveryZoneId"
                          value={zone.id}
                          required
                          defaultChecked={index === 0}
                          className="mt-1 accent-[var(--brand)]"
                        />
                        <span>
                          <span className="block font-medium text-[var(--brand-deep)]">
                            {zone.name}
                          </span>
                          <span className="block text-sm text-[#4a655f]">
                            {zone.communes}
                          </span>
                          <span className="mt-1 block text-sm text-[var(--brand)]">
                            {zone.costClp === 0
                              ? "Despacho gratis"
                              : `Despacho ${formatClp(zone.costClp)}`}
                          </span>
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </fieldset>
            <div className="space-y-2">
              <Label htmlFor="customerNotes">Notas (opcional)</Label>
              <Textarea
                id="customerNotes"
                name="customerNotes"
                rows={3}
                placeholder="Horario preferido, dejar en conserjería…"
                className="bg-white"
              />
            </div>
            {error ? (
              <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-3">
              <Button type="submit" disabled={zones.length === 0}>
                Pagar con WebPay
              </Button>
              <Link
                href="/carrito"
                className="inline-flex h-8 items-center px-3 text-sm text-[#4a655f] hover:underline"
              >
                Volver al carrito
              </Link>
            </div>
          </form>

          <aside className="h-fit border border-[#c5d8d2] bg-white/70 p-6">
            <h2 className="font-[family-name:var(--font-display)] text-xl text-[var(--brand-deep)]">
              Resumen
            </h2>
            <ul className="mt-4 space-y-3 text-sm">
              {cart.items.map((item) => (
                <li key={item.productId} className="flex justify-between gap-4">
                  <span className="text-[#2f4a44]">
                    {item.name} × {item.quantity}
                  </span>
                  <span className="text-[var(--brand-deep)]">
                    {formatClp(item.lineTotalClp)}
                  </span>
                </li>
              ))}
            </ul>
            <CheckoutZoneTotal
              subtotalClp={cart.subtotalClp}
              zones={zones.map((z) => ({ id: z.id, costClp: z.costClp }))}
            />
          </aside>
        </div>
      </div>
    </div>
  );
}
