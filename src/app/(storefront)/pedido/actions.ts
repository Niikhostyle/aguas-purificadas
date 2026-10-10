"use server";

import { redirect } from "next/navigation";
import { startPaymentForOrder } from "@/lib/payments";
import { requireTenant } from "@/lib/tenant";

export async function retryPaymentAction(formData: FormData) {
  const tenant = await requireTenant();
  const orderId = String(formData.get("orderId") || "");
  if (!orderId) redirect("/productos");
  const payment = await startPaymentForOrder(orderId, tenant.id);
  redirect(payment.redirectTo);
}
