"use client";

import { useEffect, useState } from "react";
import { shippingFor, type ZonePricing } from "@/lib/delivery-zones";
import { formatClp } from "@/lib/utils";

type ZoneOption = ZonePricing & { id: string };

export function CheckoutZoneTotal({
  subtotalClp,
  discountClp = 0,
  couponCode,
  zones,
  defaultZoneId,
}: {
  subtotalClp: number;
  /** Coupon amount; already validated server-side. */
  discountClp?: number;
  couponCode?: string | null;
  zones: ZoneOption[];
  defaultZoneId?: string;
}) {
  const orderTotal = subtotalClp - discountClp;
  const initial = zones.find((z) => z.id === defaultZoneId) ?? zones[0];
  const [zone, setZone] = useState<ZoneOption | undefined>(initial);

  useEffect(() => {
    const sync = () => {
      const selected = document.querySelector<HTMLInputElement>(
        'input[name="deliveryZoneId"]:checked',
      );
      if (!selected) return;
      const next = zones.find((z) => z.id === selected.value);
      if (next) setZone(next);
    };
    sync();
    document.addEventListener("change", sync);
    return () => document.removeEventListener("change", sync);
  }, [zones]);

  const shippingClp = zone ? shippingFor(zone, orderTotal) : 0;
  const missingForFree =
    zone && zone.freeOverClp && zone.costClp > 0 && orderTotal < zone.freeOverClp
      ? zone.freeOverClp - orderTotal
      : 0;

  return (
    <div className="mt-6 space-y-2 border-t border-dashed border-[var(--sf-line-strong)] pt-4 text-sm">
      <div className="flex justify-between text-[#5a6578]">
        <span>Subtotal</span>
        <span>{formatClp(subtotalClp)}</span>
      </div>
      {discountClp > 0 ? (
        <div className="flex justify-between font-medium text-emerald-700">
          <span>Descuento{couponCode ? ` (${couponCode})` : ""}</span>
          <span>−{formatClp(discountClp)}</span>
        </div>
      ) : null}
      <div className="flex justify-between text-[#5a6578]">
        <span>Despacho</span>
        <span>
          {shippingClp === 0 ? "Gratis" : formatClp(shippingClp)}
        </span>
      </div>
      {missingForFree > 0 ? (
        <p className="rounded-lg bg-[var(--mist)] px-3 py-2 text-xs text-[var(--brand-deep)]">
          Te faltan {formatClp(missingForFree)} para despacho gratis.
        </p>
      ) : null}
      <div className="mt-2 flex items-baseline justify-between border-t border-[var(--sf-line)] pt-3 text-base font-semibold text-[var(--brand-deep)]">
        <span>Total</span>
        <span key={shippingClp} className="sf-pop rc-display inline-block text-3xl">{formatClp(orderTotal + shippingClp)}</span>
      </div>
    </div>
  );
}
