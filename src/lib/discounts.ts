import { cache } from "react";
import type { Discount } from "@prisma/client";
import type { PromoCard } from "@/components/storefront/offers-carousel";
import { prisma } from "@/lib/db";
import { formatClp } from "@/lib/utils";

export type DiscountType = "percent" | "fixed";
export type DiscountScope = "all" | "products";

export type PricingDiscount = Pick<
  Discount,
  "id" | "name" | "type" | "value" | "scope" | "productIds" | "couponCode"
>;

export type ProductPrice = {
  listPriceClp: number;
  priceClp: number;
  /** Automatic discount applied to this product (the one that saves the most). */
  discount: { id: string; name: string; badge: string } | null;
};

export function normalizeCouponCode(raw: unknown): string {
  return String(raw ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "")
    .slice(0, 40);
}

export function isDiscountLive(
  d: Pick<Discount, "active" | "startsAt" | "endsAt">,
  now = new Date(),
): boolean {
  if (!d.active) return false;
  if (d.startsAt && d.startsAt > now) return false;
  if (d.endsAt && d.endsAt <= now) return false;
  return true;
}

/** Active discounts within their date window, newest first. Always scoped to one tenant; deduped per request. */
export const getLiveDiscounts = cache(async (tenantId: string): Promise<Discount[]> => {
  const now = new Date();
  return prisma.discount.findMany({
    where: {
      tenantId,
      active: true,
      AND: [
        { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
        { OR: [{ endsAt: null }, { endsAt: { gt: now } }] },
      ],
    },
    orderBy: { createdAt: "desc" },
  });
});

export async function findLiveCoupon(tenantId: string, code: string): Promise<Discount | null> {
  const couponCode = normalizeCouponCode(code);
  if (!couponCode) return null;
  const d = await prisma.discount.findUnique({
    where: { tenantId_couponCode: { tenantId, couponCode } },
  });
  return d && isDiscountLive(d) ? d : null;
}

/** Whether the cart should offer a coupon field at all. */
export async function hasLiveCoupons(tenantId: string): Promise<boolean> {
  const list = await getLiveDiscounts(tenantId);
  return list.some((d) => d.couponCode);
}

export function appliesToProduct(d: Pick<Discount, "scope" | "productIds">, productId: string) {
  return d.scope !== "products" || d.productIds.includes(productId);
}

export function discountBadge(d: Pick<Discount, "type" | "value">): string {
  return d.type === "fixed" ? `-${formatClp(d.value)}` : `-${d.value}%`;
}

function amountOff(d: Pick<Discount, "type" | "value">, base: number): number {
  if (base <= 0) return 0;
  const off = d.type === "fixed" ? d.value : Math.round((base * d.value) / 100);
  return Math.max(0, Math.min(base, off));
}

/** Unit price after the best automatic (no coupon) discount for the product. */
export function priceProduct(
  product: { id: string; priceClp: number },
  discounts: PricingDiscount[],
): ProductPrice {
  let best: PricingDiscount | null = null;
  let bestOff = 0;
  for (const d of discounts) {
    if (d.couponCode || !appliesToProduct(d, product.id)) continue;
    const off = amountOff(d, product.priceClp);
    if (off > bestOff) {
      best = d;
      bestOff = off;
    }
  }
  return {
    listPriceClp: product.priceClp,
    priceClp: product.priceClp - bestOff,
    discount: best ? { id: best.id, name: best.name, badge: discountBadge(best) } : null,
  };
}

export function priceProducts(
  products: { id: string; priceClp: number }[],
  discounts: PricingDiscount[],
): Record<string, ProductPrice> {
  return Object.fromEntries(products.map((p) => [p.id, priceProduct(p, discounts)]));
}

/** Coupon amount over the lines it applies to (percent of them, or a fixed amount once per order). */
export function couponAmount(
  coupon: PricingDiscount,
  lines: { productId: string; lineTotalClp: number }[],
): number {
  const eligible = lines
    .filter((l) => appliesToProduct(coupon, l.productId))
    .reduce((sum, l) => sum + l.lineTotalClp, 0);
  return amountOff(coupon, eligible);
}

/** Storefront promo cards: only discounts where the admin added banner text or an image. */
export function promoCards(list: Discount[]): PromoCard[] {
  return list
    .filter((d) => Boolean(d.bannerText?.trim() || d.imageUrl))
    .map((d) => ({
      id: d.id,
      title: d.name,
      subtitle: d.bannerText,
      badge: discountBadge(d),
      imageUrl: d.imageUrl,
      couponCode: d.couponCode,
      href: "/productos",
    }));
}
