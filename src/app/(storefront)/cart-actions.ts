"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  clearCartCookie,
  getResolvedCart,
  mergeCartLine,
  readCartCookie,
  setCartLineQuantity,
  writeCartCookie,
} from "@/lib/cart";
import { prisma } from "@/lib/db";
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

const checkoutSchema = z.object({
  customerName: z.string().trim().min(2).max(120),
  customerPhone: z.string().trim().min(8).max(40),
  customerAddress: z.string().trim().min(5).max(240),
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

  const shippingClp = zone.costClp;
  const subtotalClp = cart.subtotalClp;
  const totalClp = subtotalClp + shippingClp;

  const order = await prisma.order.create({
    data: {
      tenantId: tenant.id,
      deliveryZoneId: zone.id,
      status: "pending",
      customerName: parsed.data.customerName,
      customerPhone: parsed.data.customerPhone,
      customerAddress: parsed.data.customerAddress,
      customerNotes: parsed.data.customerNotes,
      deliveryZoneName: zone.name,
      subtotalClp,
      shippingClp,
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

  await clearCartCookie();
  revalidatePath("/admin/pedidos");
  revalidatePath("/admin");
  revalidateStorefront();
  redirect(`/pedido/${order.id}`);
}
