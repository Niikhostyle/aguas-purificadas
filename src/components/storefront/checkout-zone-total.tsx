"use client";

import { useEffect, useState } from "react";
import { formatClp } from "@/lib/utils";

type ZoneOption = { id: string; costClp: number };

export function CheckoutZoneTotal({
  subtotalClp,
  zones,
}: {
  subtotalClp: number;
  zones: ZoneOption[];
}) {
  const [shippingClp, setShippingClp] = useState(zones[0]?.costClp ?? 0);

  useEffect(() => {
    const sync = () => {
      const selected = document.querySelector<HTMLInputElement>(
        'input[name="deliveryZoneId"]:checked',
      );
      if (!selected) return;
      const zone = zones.find((z) => z.id === selected.value);
      if (zone) setShippingClp(zone.costClp);
    };
    sync();
    document.addEventListener("change", sync);
    return () => document.removeEventListener("change", sync);
  }, [zones]);

  return (
    <div className="mt-6 space-y-2 border-t border-dashed border-[var(--sf-line-strong)] pt-4 text-sm">
      <div className="flex justify-between text-[#5a6578]">
        <span>Subtotal</span>
        <span>{formatClp(subtotalClp)}</span>
      </div>
      <div className="flex justify-between text-[#5a6578]">
        <span>Despacho</span>
        <span>
          {shippingClp === 0 ? "Gratis" : formatClp(shippingClp)}
        </span>
      </div>
      <div className="mt-2 flex items-baseline justify-between border-t border-[var(--sf-line)] pt-3 text-base font-semibold text-[var(--brand-deep)]">
        <span>Total</span>
        <span key={shippingClp} className="sf-pop rc-display inline-block text-3xl">{formatClp(subtotalClp + shippingClp)}</span>
      </div>
    </div>
  );
}
