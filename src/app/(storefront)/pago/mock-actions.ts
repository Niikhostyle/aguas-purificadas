"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { finalizeMockPayment } from "@/lib/payments";
import { requireTenant } from "@/lib/tenant";

export async function mockPayAction(formData: FormData) {
  const tenant = await requireTenant();
  const orderId = String(formData.get("orderId") || "");
  const outcome = String(formData.get("outcome") || "");
  if (
    !orderId ||
    (outcome !== "paid" && outcome !== "failed" && outcome !== "cancelled")
  ) {
    redirect("/carrito");
  }

  const order = await finalizeMockPayment({
    orderId,
    tenantId: tenant.id,
    outcome,
  });
  if (!order) redirect("/carrito");

  revalidatePath("/admin/pedidos");
  revalidatePath(`/admin/pedidos/${order.id}`);
  revalidatePath(`/pedido/${order.id}`);
  redirect(`/pedido/${order.id}`);
}
