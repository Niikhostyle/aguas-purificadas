import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { placeOrderAction } from "@/app/(storefront)/cart-actions";
import { ArrowLeft, Lock, ShoppingBag } from "lucide-react";
import { CheckoutZoneTotal } from "@/components/storefront/checkout-zone-total";
import { SubmitButton } from "@/components/storefront/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cookies } from "next/headers";
import { getResolvedCart } from "@/lib/cart";
import { zoneForPlace } from "@/lib/delivery-zones";
import { parseModulesContent } from "@/lib/modules";
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
  const regionId = (await cookies()).get("mibidon_region")?.value;
  const region = regionId
    ? parseModulesContent(tenant.modulesContent).regions.find((r) => r.id === regionId)
    : undefined;
  const defaultZoneId = (region ? zoneForPlace(zones, region.name) : undefined)?.id ?? zones[0]?.id;

  return (
    <div className="bg-[linear-gradient(180deg,var(--mist)_0%,#fff_420px)]">
      <div className="mx-auto max-w-5xl px-4 pb-20 pt-12 md:px-8">
        <h1 className="sf-title sf-title-start rc-display text-4xl uppercase text-[var(--brand-deep)] md:text-5xl">
          Checkout
        </h1>
        <p className="mt-4 max-w-xl text-[#5a6578]">
          Completá tus datos y la zona de despacho. Al confirmar te llevamos a
          WebPay (sandbox o mock) para pagar.
        </p>

        <div className="mt-10 grid items-start gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:gap-10">
          <form action={placeOrderAction} className="sf-enter sf-card space-y-5 p-5 sm:p-7">
            <div className="space-y-2">
              <Label htmlFor="customerName">Nombre completo</Label>
              <Input
                id="customerName"
                name="customerName"
                required
                minLength={2}
                placeholder="María González"
                className="h-11 bg-white px-3.5"
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
                className="h-11 bg-white px-3.5"
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
                className="h-11 bg-white px-3.5"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deliveryCommune">Comuna</Label>
              <Input
                id="deliveryCommune"
                name="deliveryCommune"
                list="checkout-communes"
                maxLength={80}
                placeholder="Ej: Providencia"
                className="h-11 bg-white px-3.5"
              />
              <datalist id="checkout-communes">
                {Array.from(
                  new Set(
                    zones.flatMap((z) =>
                      z.communes.split(",").map((c) => c.trim()).filter(Boolean),
                    ),
                  ),
                ).map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
            <fieldset className="space-y-3">
              <legend className="mb-1 text-sm font-medium text-[var(--brand-deep)]">
                Zona de despacho
              </legend>
              {zones.length === 0 ? (
                <p className="text-sm text-red-700">
                  No hay zonas activas. Contactá a la empresa.
                </p>
              ) : (
                <ul className="space-y-3">
                  {zones.map((zone) => (
                    <li key={zone.id}>
                      <label className="flex cursor-pointer gap-3 rounded-xl border border-[var(--sf-line-strong)] bg-white px-4 py-3.5 transition duration-300 hover:border-[var(--brand)] hover:shadow-[var(--sf-shadow-md)] has-[:checked]:border-[var(--brand)] has-[:checked]:bg-[var(--mist)] has-[:checked]:ring-1 has-[:checked]:ring-[var(--brand)] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[var(--brand)]">
                        <input
                          type="radio"
                          name="deliveryZoneId"
                          value={zone.id}
                          required
                          defaultChecked={zone.id === defaultZoneId}
                          className="mt-1 size-4 accent-[var(--brand)]"
                        />
                        <span>
                          <span className="block font-medium text-[var(--brand-deep)]">
                            {zone.name}
                          </span>
                          <span className="block text-sm text-[#5a6578]">
                            {zone.communes}
                          </span>
                          <span className="mt-1.5 flex flex-wrap gap-1.5">
                            <span className="inline-flex rounded-full bg-[color-mix(in_srgb,var(--brand)_12%,#fff)] px-2.5 py-0.5 text-xs font-semibold text-[var(--brand)]">
                              {zone.costClp === 0
                                ? "Despacho gratis"
                                : `Despacho ${formatClp(zone.costClp)}`}
                            </span>
                            {zone.costClp > 0 && zone.freeOverClp ? (
                              <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                                Gratis sobre {formatClp(zone.freeOverClp)}
                              </span>
                            ) : null}
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
                className="rounded-xl bg-white px-3.5 py-2.5"
              />
            </div>
            {error ? (
              <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </p>
            ) : null}
            <div className="flex flex-wrap items-center gap-3 border-t border-[var(--sf-line)] pt-5">
              <SubmitButton
                disabled={zones.length === 0}
                className="h-11 gap-2 px-6 text-sm font-bold uppercase tracking-wide"
                icon={<Lock className="size-4" aria-hidden />}
              >
                Pagar con WebPay
              </SubmitButton>
              <Link
                href="/carrito"
                className="group inline-flex h-11 items-center gap-1.5 rounded-full px-4 text-sm text-[#5a6578] transition hover:bg-[var(--mist)] hover:text-[var(--brand-deep)]"
              >
                <ArrowLeft className="size-4 transition-transform duration-300 group-hover:-translate-x-0.5" aria-hidden />
                Volver al carrito
              </Link>
            </div>
          </form>

          <aside className="sf-enter sf-card h-fit p-6 [animation-delay:120ms] lg:sticky lg:top-32">
            <h2 className="rc-display flex items-center gap-2 text-2xl uppercase text-[var(--brand-deep)]">
              <ShoppingBag className="size-5 text-[var(--brand)]" aria-hidden />
              Resumen
            </h2>
            <ul className="mt-4 space-y-3 text-sm">
              {cart.items.map((item) => (
                <li key={item.productId} className="flex justify-between gap-4">
                  <span className="text-[#3d4a5c]">
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
              discountClp={cart.discountClp}
              couponCode={cart.coupon?.code}
              zones={zones.map((z) => ({ id: z.id, costClp: z.costClp, freeOverClp: z.freeOverClp }))}
              defaultZoneId={defaultZoneId}
            />
          </aside>
        </div>
      </div>
    </div>
  );
}
