"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { SLOTS, todayCl } from "@/lib/dispatch";
import { assignOrders, autoGroupDay, markOrders } from "@/lib/dispatch-server";
import { requireTenantModule } from "@/lib/tenant-admin";

const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida");
const id = z.string().min(1).max(40);

function safeReturn(raw: FormDataEntryValue | null, fallback = "/admin/despacho"): string {
  const v = typeof raw === "string" ? raw : "";
  return v.startsWith("/admin/") && !v.startsWith("//") ? v : fallback;
}

function withFlash(path: string, key: "ok" | "error", msg: string): string {
  const url = new URL(path, "http://x");
  url.searchParams.delete("ok");
  url.searchParams.delete("error");
  url.searchParams.set(key, msg);
  return `${url.pathname}${url.search}`;
}

function revalidateDispatch() {
  revalidatePath("/admin");
  revalidatePath("/admin/despacho", "layout");
  revalidatePath("/admin/pedidos", "layout");
  revalidatePath("/admin/envases");
  revalidatePath("/admin/recordatorios");
}

async function guard() {
  const ctx = await requireTenantModule("despacho");
  if (!ctx.enabled) redirect("/admin/despacho");
  return ctx;
}

const assignSchema = z.object({
  orderIds: z.array(id).min(1, "Seleccioná al menos un pedido").max(500),
  date: dateStr,
  slot: z.enum(SLOTS).optional(),
  routeId: id.optional(),
  newRouteName: z.string().trim().min(2).max(80).optional(),
});

export async function assignOrdersAction(formData: FormData) {
  const { admin, tenantId } = await guard();
  const back = safeReturn(formData.get("returnTo"));
  const routeChoice = String(formData.get("routeId") || "");
  const parsed = assignSchema.safeParse({
    orderIds: formData.getAll("orderIds").map(String),
    date: String(formData.get("date") || todayCl()),
    slot: String(formData.get("slot") || "") || undefined,
    routeId: routeChoice && routeChoice !== "__new" ? routeChoice : undefined,
    newRouteName:
      routeChoice === "__new"
        ? String(formData.get("newRouteName") || "").trim() || undefined
        : undefined,
  });
  if (!parsed.success) {
    redirect(withFlash(back, "error", parsed.error.issues[0]?.message ?? "Datos inválidos"));
  }
  if (routeChoice === "__new" && !parsed.data.newRouteName) {
    redirect(withFlash(back, "error", "Ingresá un nombre para la nueva ruta"));
  }
  let n = 0;
  try {
    n = await assignOrders({ tenantId, actorEmail: admin.email, ...parsed.data });
  } catch (e) {
    redirect(withFlash(back, "error", e instanceof Error ? e.message : "No se pudo asignar"));
  }
  revalidateDispatch();
  redirect(withFlash(back, "ok", `${n} pedido(s) programados`));
}

const markSchema = z.object({
  orderIds: z.array(id).min(1, "Seleccioná al menos un pedido").max(500),
  status: z.enum(["en_ruta", "entregado", "no_entregado"]),
  note: z.string().trim().max(500).optional(),
  bottlesReturned: z.coerce.number().int().min(0).max(200).optional(),
});

export async function markOrdersAction(formData: FormData) {
  const { admin, tenantId } = await guard();
  const back = safeReturn(formData.get("returnTo"));
  const parsed = markSchema.safeParse({
    orderIds: formData.getAll("orderIds").map(String),
    status: formData.get("status"),
    note: String(formData.get("note") || "").trim() || undefined,
    bottlesReturned: String(formData.get("bottlesReturned") || "").trim() || undefined,
  });
  if (!parsed.success) {
    redirect(withFlash(back, "error", parsed.error.issues[0]?.message ?? "Datos inválidos"));
  }
  const n = await markOrders({ tenantId, actorEmail: admin.email, ...parsed.data });
  revalidateDispatch();
  const label =
    parsed.data.status === "en_ruta"
      ? "en ruta"
      : parsed.data.status === "entregado"
        ? "entregado(s)"
        : "no entregado(s)";
  redirect(withFlash(back, "ok", `${n} pedido(s) ${label}`));
}

export async function autoGroupAction(formData: FormData) {
  const { admin, tenantId } = await guard();
  const back = safeReturn(formData.get("returnTo"));
  const parsed = dateStr.safeParse(String(formData.get("date") || ""));
  if (!parsed.success) redirect(withFlash(back, "error", "Elegí un día para agrupar"));
  const res = await autoGroupDay({ tenantId, actorEmail: admin.email, date: parsed.data });
  revalidateDispatch();
  redirect(
    withFlash(
      back,
      "ok",
      res.orders === 0
        ? "No hay pedidos sin ruta para ese día"
        : `${res.orders} pedido(s) agrupados · ${res.routes} ruta(s) nueva(s)`,
    ),
  );
}

const routeSchema = z.object({
  routeId: id,
  driverName: z.string().trim().max(80).optional(),
  slot: z.enum(SLOTS).optional(),
});

export async function updateRouteAction(formData: FormData) {
  const { tenantId } = await guard();
  const back = safeReturn(formData.get("returnTo"));
  const parsed = routeSchema.safeParse({
    routeId: formData.get("routeId"),
    driverName: String(formData.get("driverName") || "").trim() || undefined,
    slot: String(formData.get("slot") || "") || undefined,
  });
  if (!parsed.success) redirect(withFlash(back, "error", "Datos de ruta inválidos"));
  const res = await prisma.deliveryRoute.updateMany({
    where: { id: parsed.data.routeId, tenantId },
    data: { driverName: parsed.data.driverName ?? null, slot: parsed.data.slot ?? null },
  });
  if (res.count === 0) redirect(withFlash(back, "error", "Ruta no encontrada"));
  revalidateDispatch();
  redirect(withFlash(back, "ok", "Ruta actualizada"));
}

export async function startRouteAction(formData: FormData) {
  const { admin, tenantId } = await guard();
  const back = safeReturn(formData.get("returnTo"));
  const routeId = id.safeParse(formData.get("routeId"));
  if (!routeId.success) redirect(withFlash(back, "error", "Ruta inválida"));
  const orders = await prisma.order.findMany({
    where: {
      tenantId,
      routeId: routeId.data,
      fulfillmentStatus: { in: ["por_asignar", "programado"] },
    },
    select: { id: true },
  });
  const n = await markOrders({
    tenantId,
    actorEmail: admin.email,
    orderIds: orders.map((o) => o.id),
    status: "en_ruta",
  });
  revalidateDispatch();
  redirect(withFlash(back, "ok", `Ruta iniciada · ${n} pedido(s) en ruta`));
}
