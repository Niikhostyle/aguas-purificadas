import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

export const CART_COOKIE = "aguas_cart";

export type CartLine = {
  productId: string;
  quantity: number;
};

export type CartCookie = {
  tenantId: string;
  items: CartLine[];
};

export type ResolvedCartLine = CartLine & {
  name: string;
  slug: string;
  unitPriceClp: number;
  lineTotalClp: number;
  active: boolean;
};

export type ResolvedCart = {
  tenantId: string;
  items: ResolvedCartLine[];
  subtotalClp: number;
  itemCount: number;
};

function parseCart(raw: string | undefined): CartCookie | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as CartCookie;
    if (!data.tenantId || !Array.isArray(data.items)) return null;
    return {
      tenantId: data.tenantId,
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
  if (cart.items.length === 0) {
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

export async function getResolvedCart(tenantId: string): Promise<ResolvedCart> {
  const cookie = await readCartCookie();
  if (!cookie || cookie.tenantId !== tenantId || cookie.items.length === 0) {
    return { tenantId, items: [], subtotalClp: 0, itemCount: 0 };
  }

  const products = await prisma.product.findMany({
    where: {
      tenantId,
      id: { in: cookie.items.map((i) => i.productId) },
    },
  });
  const byId = new Map(products.map((p) => [p.id, p]));

  const items: ResolvedCartLine[] = [];
  for (const line of cookie.items) {
    const product = byId.get(line.productId);
    if (!product || !product.active) continue;
    items.push({
      productId: product.id,
      quantity: line.quantity,
      name: product.name,
      slug: product.slug,
      unitPriceClp: product.priceClp,
      lineTotalClp: product.priceClp * line.quantity,
      active: product.active,
    });
  }

  const subtotalClp = items.reduce((sum, i) => sum + i.lineTotalClp, 0);
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return { tenantId, items, subtotalClp, itemCount };
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
