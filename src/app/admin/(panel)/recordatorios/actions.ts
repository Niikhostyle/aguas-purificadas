"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import {
  FREQUENCIES,
  addFrequency,
  dateFromStr,
  normalizePhone,
  todayCl,
} from "@/lib/dispatch";
import { requireTenantModule } from "@/lib/tenant-admin";

async function guard() {
  const ctx = await requireTenantModule("recordatorios");
  if (!ctx.enabled) redirect("/admin/recordatorios");
  return ctx;
}

const back = (msg: string, key: "ok" | "error" = "ok") =>
  `/admin/recordatorios?${key}=${encodeURIComponent(msg)}`;

const recurrenceSchema = z.object({
  customerId: z.string().min(1).max(40),
  recurring: z.boolean(),
  frequency: z.enum(FREQUENCIES).optional(),
  nextDeliveryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  notes: z.string().trim().max(300).optional(),
});

export async function updateRecurrenceAction(formData: FormData) {
  const { tenantId } = await guard();
  const parsed = recurrenceSchema.safeParse({
    customerId: formData.get("customerId"),
    recurring: formData.get("recurring") === "on",
    frequency: String(formData.get("frequency") || "") || undefined,
    nextDeliveryDate: String(formData.get("nextDeliveryDate") || "") || undefined,
    notes: String(formData.get("notes") || "").trim() || undefined,
  });
  if (!parsed.success) redirect(back("Datos inválidos", "error"));
  const d = parsed.data;
  if (d.recurring && !d.frequency) redirect(back("Elige una frecuencia", "error"));
  const next =
    d.recurring
      ? (d.nextDeliveryDate ?? addFrequency(todayCl(), d.frequency))
      : null;
  const res = await prisma.deliveryCustomer.updateMany({
    where: { id: d.customerId, tenantId },
    data: {
      recurring: d.recurring,
      frequency: d.recurring ? d.frequency : null,
      nextDeliveryDate: next ? dateFromStr(next) : null,
      notes: d.notes ?? null,
    },
  });
  if (res.count === 0) redirect(back("Cliente no encontrado", "error"));
  revalidatePath("/admin/recordatorios");
  revalidatePath("/admin");
  redirect(back("Suscripción guardada"));
}

const newCustomerSchema = z.object({
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(8).max(40),
  address: z.string().trim().max(240).optional(),
  commune: z.string().trim().max(80).optional(),
  frequency: z.enum(FREQUENCIES),
  nextDeliveryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export async function createRecurringCustomerAction(formData: FormData) {
  const { tenantId } = await guard();
  const parsed = newCustomerSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    address: String(formData.get("address") || "").trim() || undefined,
    commune: String(formData.get("commune") || "").trim() || undefined,
    frequency: formData.get("frequency"),
    nextDeliveryDate: String(formData.get("nextDeliveryDate") || "") || undefined,
  });
  if (!parsed.success) redirect(back("Revisa nombre, teléfono y frecuencia", "error"));
  const d = parsed.data;
  const phone = normalizePhone(d.phone);
  const next = dateFromStr(d.nextDeliveryDate ?? addFrequency(todayCl(), d.frequency));
  await prisma.deliveryCustomer.upsert({
    where: { tenantId_phone: { tenantId, phone } },
    update: { name: d.name, address: d.address, commune: d.commune, recurring: true, frequency: d.frequency, nextDeliveryDate: next },
    create: { tenantId, phone, name: d.name, address: d.address, commune: d.commune, recurring: true, frequency: d.frequency, nextDeliveryDate: next },
  });
  revalidatePath("/admin/recordatorios");
  redirect(back("Cliente recurrente agregado"));
}

export async function recordReminderAction(customerId: string) {
  const { tenantId } = await guard();
  const parsed = z.string().min(1).max(40).safeParse(customerId);
  if (!parsed.success) return;
  await prisma.deliveryCustomer.updateMany({
    where: { id: parsed.data, tenantId },
    data: { lastReminderAt: new Date() },
  });
  revalidatePath("/admin/recordatorios");
}
