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
    <div className="mt-6 space-y-2 border-t border-[#c5d8d2] pt-4 text-sm">
      <div className="flex justify-between text-[#4a655f]">
        <span>Subtotal</span>
        <span>{formatClp(subtotalClp)}</span>
      </div>
      <div className="flex justify-between text-[#4a655f]">
        <span>Despacho</span>
        <span>
          {shippingClp === 0 ? "Gratis" : formatClp(shippingClp)}
        </span>
      </div>
      <div className="flex justify-between pt-2 text-base font-medium text-[var(--brand-deep)]">
        <span>Total</span>
        <span>{formatClp(subtotalClp + shippingClp)}</span>
      </div>
    </div>
  );
}
