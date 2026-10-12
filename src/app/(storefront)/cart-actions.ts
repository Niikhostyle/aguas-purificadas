"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { z } from "zod";
import {
  clearCartCookie,
  getResolvedCart,
  mergeCartLine,
  readCartCookie,
  resolveCart,
  setCartLineQuantity,
  writeCartCookie,
  type ResolvedCart,
} from "@/lib/cart";
import { prisma } from "@/lib/db";
import { shippingFor } from "@/lib/delivery-zones";
import { findLiveCoupon, normalizeCouponCode } from "@/lib/discounts";
import { ensureDeliveryCustomer } from "@/lib/dispatch-server";
import { locateOrder } from "@/lib/geocode";
import { startPaymentForOrder } from "@/lib/payments";
import { requireTenant } from "@/lib/tenant";

function revalidateStorefront() {
  revalidatePath("/");
  revalidatePath("/productos");
  revalidatePath("/carrito");
  revalidatePath("/checkout");
}

export async function addToCartAction(formData: FormData) {
  const tenant = await requireTenant();
  const productId = String(formData.get("productId") || "");
  const quantity = Math.max(
    1,
    Math.min(99, Number(formData.get("quantity") || 1) || 1),
  );

  const product = await prisma.product.findFirst({
    where: { id: productId, tenantId: tenant.id, active: true },
  });
  if (!product) redirect("/productos");

  const existing = await readCartCookie();
  const base =
    existing && existing.tenantId === tenant.id
      ? existing
      : { tenantId: tenant.id, items: [] };

  await writeCartCookie(mergeCartLine(base, productId, quantity));
  revalidateStorefront();
  redirect("/carrito");
}

export async function updateCartQuantityAction(formData: FormData) {
  const tenant = await requireTenant();
  const productId = String(formData.get("productId") || "");
  const quantity = Number(formData.get("quantity") || 0);

  const existing = await readCartCookie();
  if (!existing || existing.tenantId !== tenant.id) {
    redirect("/carrito");
  }

  await writeCartCookie(setCartLineQuantity(existing, productId, quantity));
  revalidateStorefront();
  redirect("/carrito");
}

export async function removeFromCartAction(formData: FormData) {
  const tenant = await requireTenant();
  const productId = String(formData.get("productId") || "");
  const existing = await readCartCookie();
  if (!existing || existing.tenantId !== tenant.id) {
    redirect("/carrito");
  }
  await writeCartCookie(setCartLineQuantity(existing, productId, 0));
  revalidateStorefront();
  redirect("/carrito");
}

export async function applyCouponAction(formData: FormData) {
  const tenant = await requireTenant();
  const code = normalizeCouponCode(formData.get("coupon"));
  const existing = await readCartCookie();
  if (!existing || existing.tenantId !== tenant.id || existing.items.length === 0) {
    redirect("/carrito");
  }
  if (!code) redirect("/carrito?cupon=vacio");
  const coupon = await findLiveCoupon(tenant.id, code);
  if (!coupon) redirect(`/carrito?cupon=invalido&codigo=${encodeURIComponent(code)}`);

  await writeCartCookie({ ...existing, coupon: coupon.couponCode! });
  revalidateStorefront();
  redirect("/carrito?cupon=ok");
}

export async function removeCouponAction() {
  const tenant = await requireTenant();
  const existing = await readCartCookie();
  if (existing && existing.tenantId === tenant.id) {
    await writeCartCookie({ ...existing, coupon: undefined });
  }
  revalidateStorefront();
  redirect("/carrito");
}

export type CartSnapshot = Pick<ResolvedCart, "items" | "subtotalClp" | "itemCount">;

export type AddToCartState =
  | { ok: true; cart: CartSnapshot; productName: string; at: number }
  | { ok: false; error: string; at: number }
  | null;

function snapshot(cart: ResolvedCart): CartSnapshot {
  return { items: cart.items, subtotalClp: cart.subtotalClp, itemCount: cart.itemCount };
}

/**
 * Drawer variant of add-to-cart: returns the cart instead of redirecting, so the
 * shopper stays on the page (and on the tenant host).
 */
export async function addToCartInlineAction(formData: FormData): Promise<AddToCartState> {
  const tenant = await requireTenant();
  const productId = String(formData.get("productId") || "");
  const quantity = Math.max(1, Math.min(99, Number(formData.get("quantity") || 1) || 1));

  const product = await prisma.product.findFirst({
    where: { id: productId, tenantId: tenant.id, active: true },
  });
  if (!product) {
    return { ok: false, error: "Este producto ya no está disponible.", at: Date.now() };
  }

  const existing = await readCartCookie();
  const base =
    existing && existing.tenantId === tenant.id ? existing : { tenantId: tenant.id, items: [] };
  const next = mergeCartLine(base, productId, quantity);
  await writeCartCookie(next);
  return {
    ok: true,
    cart: snapshot(await resolveCart(tenant.id, next)),
    productName: product.name,
    at: Date.now(),
  };
}

/** Sets a line's quantity (0 removes it) and returns the updated cart. */
export async function setCartLineAction(productId: string, quantity: number): Promise<CartSnapshot> {
  const tenant = await requireTenant();
  const existing = await readCartCookie();
  if (!existing || existing.tenantId !== tenant.id) {
    return snapshot(await resolveCart(tenant.id, null));
  }
  const q = Math.max(0, Math.min(99, Math.floor(Number(quantity) || 0)));
  const next = setCartLineQuantity(existing, String(productId), q);
  await writeCartCookie(next);
  return snapshot(await resolveCart(tenant.id, next));
}

const checkoutSchema = z.object({
  customerName: z.string().trim().min(2).max(120),
  customerPhone: z.string().trim().min(8).max(40),
  customerAddress: z.string().trim().min(5).max(240),
  deliveryCommune: z.string().trim().max(80).optional(),
  customerNotes: z.string().trim().max(500).optional(),
  deliveryZoneId: z.string().min(1),
});

export async function placeOrderAction(formData: FormData) {
  const tenant = await requireTenant();
  const cart = await getResolvedCart(tenant.id);

  if (cart.items.length === 0) {
    redirect("/carrito");
  }

  const parsed = checkoutSchema.safeParse({
    customerName: formData.get("customerName"),
    customerPhone: formData.get("customerPhone"),
    customerAddress: formData.get("customerAddress"),
    deliveryCommune: String(formData.get("deliveryCommune") || "").trim() || undefined,
    customerNotes: String(formData.get("customerNotes") || "").trim() || undefined,
    deliveryZoneId: formData.get("deliveryZoneId"),
  });

  if (!parsed.success) {
    redirect("/checkout?error=" + encodeURIComponent("Revisá los datos del formulario"));
  }

  const zone = await prisma.deliveryZone.findFirst({
    where: {
      id: parsed.data.deliveryZoneId,
      tenantId: tenant.id,
      active: true,
    },
  });
  if (!zone) {
    redirect("/checkout?error=" + encodeURIComponent("Elegí una zona de despacho válida"));
  }

  const shippingClp = shippingFor(zone, cart.totalClp);
  const subtotalClp = cart.subtotalClp;
  const discountClp = cart.discountClp;
  const totalClp = cart.totalClp + shippingClp;

  const deliveryCustomer = await ensureDeliveryCustomer(prisma, tenant.id, {
    name: parsed.data.customerName,
    phone: parsed.data.customerPhone,
    address: parsed.data.customerAddress,
    commune: parsed.data.deliveryCommune,
  });

  const order = await prisma.order.create({
    data: {
      tenantId: tenant.id,
      deliveryZoneId: zone.id,
      deliveryCustomerId: deliveryCustomer.id,
      deliveryCommune: parsed.data.deliveryCommune,
      status: "pending",
      customerName: parsed.data.customerName,
      customerPhone: parsed.data.customerPhone,
      customerAddress: parsed.data.customerAddress,
      customerNotes: parsed.data.customerNotes,
      deliveryZoneName: zone.name,
      subtotalClp,
      shippingClp,
      discountClp,
      discountLabel: cart.discountLabel,
      couponCode: cart.coupon && discountClp > 0 ? cart.coupon.code : null,
      totalClp,
      items: {
        create: cart.items.map((item) => ({
          productId: item.productId,
          productName: item.name,
          productSlug: item.slug,
          unitPriceClp: item.unitPriceClp,
          quantity: item.quantity,
          lineTotalClp: item.lineTotalClp,
        })),
      },
    },
  });

  after(() =>
    locateOrder(tenant.id, order.id).catch((e) => console.error("[geocode] order", order.id, e)),
  );

  await clearCartCookie();
  revalidatePath("/admin/pedidos");
  revalidatePath("/admin");
  revalidateStorefront();

  const payment = await startPaymentForOrder(order.id, tenant.id);
  redirect(payment.redirectTo);
}
