import type { ProductPrice } from "@/lib/discounts";
import { formatClp } from "@/lib/utils";

/** Product price with strike-through list price and badge when an automatic discount applies. */
export function PriceTag({
  priceClp,
  price,
  size = "md",
}: {
  priceClp: number;
  price?: ProductPrice;
  size?: "md" | "lg";
}) {
  const main = `inline-flex w-fit rounded-full bg-[color-mix(in_srgb,var(--brand)_10%,#fff)] font-bold text-[var(--brand)] ${
    size === "lg"
      ? "px-4 py-1 text-3xl ring-1 ring-[color-mix(in_srgb,var(--brand)_20%,transparent)]"
      : "px-3 py-0.5 text-lg"
  }`;
  if (!price?.discount) {
    return <span className={main}>{formatClp(priceClp)}</span>;
  }
  return (
    <span className={`inline-flex flex-wrap items-center gap-x-2 gap-y-1 ${size === "lg" ? "justify-start" : "justify-center"}`}>
      <span className={main}>{formatClp(price.priceClp)}</span>
      <s className={`${size === "lg" ? "text-lg" : "text-sm"} text-[#8a96a8]`}>
        {formatClp(price.listPriceClp)}
      </s>
      {size === "lg" ? (
        <span className="rounded-full bg-[var(--brand-deep)] px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-white">
          {price.discount.badge} · {price.discount.name}
        </span>
      ) : null}
    </span>
  );
}

export function DiscountRibbon({ price }: { price?: ProductPrice }) {
  if (!price?.discount) return null;
  return (
    <span className="absolute left-3 top-3 z-[1] rounded-full bg-[var(--brand-deep)] px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-white shadow-md">
      {price.discount.badge}
    </span>
  );
}
