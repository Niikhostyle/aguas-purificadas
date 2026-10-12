"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireTenantAdmin } from "@/lib/tenant-admin";

function back(key: "ok" | "error", msg: string): never {
  redirect(`/admin/alertas?${key}=${encodeURIComponent(msg)}`);
}

/** Records a cash/transfer payment collected for a delivered order that was still unpaid. */
export async function markOrderCollectedAction(formData: FormData) {
  const { admin, tenantId } = await requireTenantAdmin();
  const id = z.string().min(1).max(40).safeParse(formData.get("orderId"));
  if (!id.success) back("error", "Pedido inválido");

  const order = await prisma.order.findFirst({
    where: { id: id.data, tenantId, status: "pending" },
    select: { id: true, fulfillmentStatus: true },
  });
  if (!order) back("error", "El pedido no existe o ya estaba pagado");

  await prisma.$transaction([
    prisma.order.update({
      where: { id: order.id },
      data: { status: "paid", paidAt: new Date(), paymentProvider: "manual" },
    }),
    prisma.orderEvent.create({
      data: {
        tenantId,
        orderId: order.id,
        type: "nota",
        fromStatus: order.fulfillmentStatus,
        toStatus: order.fulfillmentStatus,
        note: "Pago registrado manualmente (cobrado al entregar)",
        actorEmail: admin.email,
      },
    }),
  ]);
  revalidatePath("/admin", "layout");
  back("ok", "Pago registrado");
}
