"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireTenantModule } from "@/lib/tenant-admin";

const movementSchema = z.object({
  customerId: z.string().min(1).max(40),
  direction: z.enum(["in", "out"]),
  quantity: z.coerce.number().int().min(1).max(500),
  reason: z.enum(["devolucion", "entrega", "ajuste"]),
  note: z.string().trim().max(300).optional(),
});

export async function addBottleMovementAction(formData: FormData) {
  const { admin, tenantId, enabled } = await requireTenantModule("envases");
  if (!enabled) redirect("/admin/envases");
  const parsed = movementSchema.safeParse({
    customerId: formData.get("customerId"),
    direction: formData.get("direction"),
    quantity: formData.get("quantity"),
    reason: formData.get("reason") || "ajuste",
    note: String(formData.get("note") || "").trim() || undefined,
  });
  if (!parsed.success) {
    redirect(`/admin/envases?error=${encodeURIComponent("Revisa cliente y cantidad")}`);
  }
  const customer = await prisma.deliveryCustomer.findFirst({
    where: { id: parsed.data.customerId, tenantId },
    select: { id: true },
  });
  if (!customer) redirect(`/admin/envases?error=${encodeURIComponent("Cliente no encontrado")}`);
  await prisma.bottleMovement.create({
    data: { tenantId, actorEmail: admin.email, ...parsed.data },
  });
  revalidatePath("/admin/envases");
  revalidatePath("/admin");
  redirect(`/admin/envases?ok=${encodeURIComponent("Movimiento registrado")}`);
}
