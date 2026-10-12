import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import {
  couponAmount,
  discountBadge,
  findLiveCoupon,
  getLiveDiscounts,
  priceProduct,
} from "@/lib/discounts";
import { formatClp } from "@/lib/utils";

export const CART_COOKIE = "aguas_cart";

export type CartLine = {
  productId: string;
  quantity: number;
};

export type CartCookie = {
  tenantId: string;
  items: CartLine[];
  /** Coupon code entered by the buyer; re-validated on every read. */
  coupon?: string;
};

export type ResolvedCartLine = CartLine & {
  name: string;
  slug: string;
  imageUrl: string | null;
  /** Unit price after automatic discounts. */
  unitPriceClp: number;
  /** Catalog price before discounts. */
  listUnitPriceClp: number;
  /** e.g. "-10%" when an automatic discount applies. */
  discountBadge: string | null;
  lineTotalClp: number;
  active: boolean;
};

export type ResolvedCoupon = {
  code: string;
  name: string;
  badge: string;
  discountClp: number;
};

export type ResolvedCart = {
  tenantId: string;
  items: ResolvedCartLine[];
  /** Sum of lines, already including automatic discounts. */
  subtotalClp: number;
  itemCount: number;
  /** What automatic discounts saved vs. catalog prices (informational). */
  savingsClp: number;
  coupon: ResolvedCoupon | null;
  /** Code stored in the cart that is no longer valid (expired, deleted, paused). */
  invalidCoupon: string | null;
  /** Coupon amount to subtract from subtotalClp. */
  discountClp: number;
  /** subtotalClp - discountClp (shipping not included). */
  totalClp: number;
  /** Snapshot stored on the order. */
  discountLabel: string | null;
};

function parseCart(raw: string | undefined): CartCookie | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as CartCookie;
    if (!data.tenantId || !Array.isArray(data.items)) return null;
    return {
      tenantId: data.tenantId,
      coupon: typeof data.coupon === "string" && data.coupon ? data.coupon.slice(0, 40) : undefined,
      items: data.items
        .filter(
          (i) =>
            typeof i.productId === "string" &&
            typeof i.quantity === "number" &&
            i.quantity > 0,
        )
        .map((i) => ({
          productId: i.productId,
          quantity: Math.min(99, Math.floor(i.quantity)),
        })),
    };
  } catch {
    return null;
  }
}

export async function readCartCookie(): Promise<CartCookie | null> {
  const jar = await cookies();
  return parseCart(jar.get(CART_COOKIE)?.value);
}

export async function writeCartCookie(cart: CartCookie) {
  const jar = await cookies();
  if (cart.items.length === 0 && !cart.coupon) {
    jar.delete(CART_COOKIE);
    return;
  }
  jar.set(CART_COOKIE, JSON.stringify(cart), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
}

export async function clearCartCookie() {
  const jar = await cookies();
  jar.delete(CART_COOKIE);
}

function emptyCart(tenantId: string): ResolvedCart {
  return {
    tenantId,
    items: [],
    subtotalClp: 0,
    itemCount: 0,
    savingsClp: 0,
    coupon: null,
    invalidCoupon: null,
    discountClp: 0,
    totalClp: 0,
    discountLabel: null,
  };
}

/** Server-authoritative cart: prices, automatic discounts and coupon always come from the DB. */
export async function getResolvedCart(tenantId: string): Promise<ResolvedCart> {
  return resolveCart(tenantId, await readCartCookie());
}

export async function resolveCart(
  tenantId: string,
  cookie: CartCookie | null,
): Promise<ResolvedCart> {
  if (!cookie || cookie.tenantId !== tenantId || cookie.items.length === 0) {
    return emptyCart(tenantId);
  }

  const [products, discounts, coupon] = await Promise.all([
    prisma.product.findMany({
      where: {
        tenantId,
        id: { in: cookie.items.map((i) => i.productId) },
      },
    }),
    getLiveDiscounts(tenantId),
    cookie.coupon ? findLiveCoupon(tenantId, cookie.coupon) : Promise.resolve(null),
  ]);
  const byId = new Map(products.map((p) => [p.id, p]));

  const items: ResolvedCartLine[] = [];
  const autoApplied = new Map<string, string>();
  for (const line of cookie.items) {
    const product = byId.get(line.productId);
    if (!product || !product.active) continue;
    const price = priceProduct(product, discounts);
    if (price.discount) autoApplied.set(price.discount.id, `${price.discount.name} ${price.discount.badge}`);
    items.push({
      productId: product.id,
      quantity: line.quantity,
      name: product.name,
      slug: product.slug,
      imageUrl: product.imageUrl,
      unitPriceClp: price.priceClp,
      listUnitPriceClp: product.priceClp,
      discountBadge: price.discount?.badge ?? null,
      lineTotalClp: price.priceClp * line.quantity,
      active: product.active,
    });
  }
  if (items.length === 0) return emptyCart(tenantId);

  const subtotalClp = items.reduce((sum, i) => sum + i.lineTotalClp, 0);
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const savingsClp = items.reduce(
    (sum, i) => sum + (i.listUnitPriceClp - i.unitPriceClp) * i.quantity,
    0,
  );

  const couponOff = coupon ? couponAmount(coupon, items) : 0;
  const resolvedCoupon: ResolvedCoupon | null = coupon
    ? { code: coupon.couponCode!, name: coupon.name, badge: discountBadge(coupon), discountClp: couponOff }
    : null;

  const labels = [...autoApplied.values()];
  if (resolvedCoupon && couponOff > 0) {
    labels.push(`Cupón ${resolvedCoupon.code} -${formatClp(couponOff)}`);
  }

  return {
    tenantId,
    items,
    subtotalClp,
    itemCount,
    savingsClp,
    coupon: resolvedCoupon,
    invalidCoupon: cookie.coupon && !coupon ? cookie.coupon : null,
    discountClp: couponOff,
    totalClp: subtotalClp - couponOff,
    discountLabel: labels.length ? labels.join(" · ").slice(0, 300) : null,
  };
}

export function mergeCartLine(
  cart: CartCookie,
  productId: string,
  quantityDelta: number,
): CartCookie {
  const items = [...cart.items];
  const idx = items.findIndex((i) => i.productId === productId);
  if (idx === -1) {
    if (quantityDelta > 0) {
      items.push({ productId, quantity: Math.min(99, quantityDelta) });
    }
  } else {
    const next = items[idx].quantity + quantityDelta;
    if (next <= 0) items.splice(idx, 1);
    else items[idx] = { productId, quantity: Math.min(99, next) };
  }
  return { ...cart, items };
}

export function setCartLineQuantity(
  cart: CartCookie,
  productId: string,
  quantity: number,
): CartCookie {
  const items = cart.items.filter((i) => i.productId !== productId);
  const q = Math.floor(quantity);
  if (q > 0) items.push({ productId, quantity: Math.min(99, q) });
  return { ...cart, items };
}
