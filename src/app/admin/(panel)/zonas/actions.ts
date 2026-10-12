"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { splitCommunes } from "@/lib/delivery-zones";

const BASE = "/admin/zonas";
const MAX_ZONES = 30;

async function requireTenantAdmin() {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin/login");
  if (admin.role === "super_admin" && admin.tenant.slug === "plataforma") {
    redirect("/admin/plataforma");
  }
  return admin;
}

function done(kind: "ok" | "error", message: string): never {
  redirect(`${BASE}?${kind}=${encodeURIComponent(message)}`);
}

function revalidateZones() {
  revalidatePath(BASE);
  revalidatePath("/checkout");
  revalidatePath("/", "layout");
}

const money = z.preprocess(
  (v) => String(v ?? "").replace(/[$.\s]/g, ""),
  z.union([z.literal(""), z.coerce.number().int().min(0).max(10_000_000)]),
);

const zoneSchema = z.object({
  name: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres.").max(60, "Máximo 60 caracteres."),
  communes: z.string().max(600, "Demasiadas comunas en una zona."),
  costClp: money,
  freeOverClp: money,
  active: z.boolean(),
});

export async function saveZoneAction(formData: FormData) {
  const admin = await requireTenantAdmin();
  const id = String(formData.get("id") ?? "").trim();

  const parsed = zoneSchema.safeParse({
    name: formData.get("name"),
    communes: String(formData.get("communes") ?? ""),
    costClp: formData.get("costClp"),
    freeOverClp: formData.get("freeOverClp"),
    active: formData.get("active") === "on",
  });
  if (!parsed.success) done("error", parsed.error.issues[0]?.message ?? "Revisa los datos de la zona.");
  const d = parsed.data;

  const existing = id ? await prisma.deliveryZone.findFirst({ where: { id, tenantId: admin.tenantId } }) : null;
  if (id && !existing) done("error", "Esa zona ya no existe.");

  const data = {
    name: d.name,
    communes: splitCommunes(d.communes).join(", "),
    costClp: d.costClp === "" ? 0 : d.costClp,
    freeOverClp: d.freeOverClp === "" || d.freeOverClp === 0 ? null : d.freeOverClp,
    active: d.active,
  };

  if (existing) {
    await prisma.deliveryZone.update({ where: { id: existing.id }, data });
  } else {
    const count = await prisma.deliveryZone.count({ where: { tenantId: admin.tenantId } });
    if (count >= MAX_ZONES) done("error", `Puedes tener hasta ${MAX_ZONES} zonas.`);
    await prisma.deliveryZone.create({ data: { ...data, tenantId: admin.tenantId, sortOrder: count } });
  }

  revalidateZones();
  done("ok", existing ? `Zona «${d.name}» actualizada.` : `Zona «${d.name}» creada.`);
}

export async function moveZoneAction(formData: FormData) {
  const admin = await requireTenantAdmin();
  const id = String(formData.get("id") ?? "");
  const zones = await prisma.deliveryZone.findMany({
    where: { tenantId: admin.tenantId },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true },
  });
  const index = zones.findIndex((z) => z.id === id);
  const to = index + (formData.get("direction") === "up" ? -1 : 1);
  if (index < 0 || to < 0 || to >= zones.length) redirect(BASE);
  const [moved] = zones.splice(index, 1);
  zones.splice(to, 0, moved);
  await prisma.$transaction(
    zones.map((z, i) => prisma.deliveryZone.updateMany({ where: { id: z.id, tenantId: admin.tenantId }, data: { sortOrder: i } })),
  );
  revalidateZones();
  redirect(BASE);
}

export async function deleteZoneAction(formData: FormData) {
  const admin = await requireTenantAdmin();
  const id = String(formData.get("id") ?? "");
  const zone = await prisma.deliveryZone.findFirst({ where: { id, tenantId: admin.tenantId } });
  if (!zone) done("error", "Esa zona ya no existe.");
  await prisma.deliveryZone.delete({ where: { id: zone.id } });
  revalidateZones();
  done("ok", `Zona «${zone.name}» eliminada. Los pedidos anteriores conservan el nombre de la zona.`);
}
