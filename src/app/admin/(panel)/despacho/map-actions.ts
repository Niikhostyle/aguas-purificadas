"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { isValidChileCoord } from "@/lib/geo";
import { locatePendingOrders, setOrderLocation } from "@/lib/geocode";
import { requireTenantAdmin } from "@/lib/tenant-admin";

/** Per click: ~1 s each (Nominatim policy), so keep the action short. */
const LOCATE_BATCH = 12;

const locationSchema = z.object({
  orderId: z.string().min(1).max(40),
  lat: z.number(),
  lng: z.number(),
});

export async function setOrderLocationAction(input: {
  orderId: string;
  lat: number;
  lng: number;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const { tenantId } = await requireTenantAdmin();
  const parsed = locationSchema.safeParse(input);
  if (!parsed.success || !isValidChileCoord(parsed.data.lat, parsed.data.lng)) {
    return { ok: false, error: "Ubicación fuera de Chile o inválida" };
  }
  const lat = Math.round(parsed.data.lat * 1e6) / 1e6;
  const lng = Math.round(parsed.data.lng * 1e6) / 1e6;
  const saved = await setOrderLocation(tenantId, parsed.data.orderId, lat, lng);
  if (!saved) return { ok: false, error: "Pedido no encontrado" };
  revalidatePath("/admin");
  revalidatePath("/admin/despacho/mapa");
  return { ok: true };
}

function safeReturn(raw: FormDataEntryValue | null): string {
  const v = typeof raw === "string" ? raw : "";
  return v.startsWith("/admin") && !v.startsWith("//") ? v : "/admin/despacho/mapa";
}

function withFlash(path: string, key: "ok" | "error", msg: string): string {
  const url = new URL(path, "http://x");
  url.searchParams.delete("ok");
  url.searchParams.delete("error");
  url.searchParams.set(key, msg);
  return `${url.pathname}${url.search}`;
}

export async function locateOrdersAction(formData: FormData) {
  const { tenantId } = await requireTenantAdmin();
  const back = safeReturn(formData.get("returnTo"));
  const res = await locatePendingOrders({ tenantId, limit: LOCATE_BATCH });
  revalidatePath("/admin");
  revalidatePath("/admin/despacho/mapa");
  if (res.checked === 0) redirect(withFlash(back, "ok", "Todos los pedidos ya están ubicados"));
  const found = res.located + res.reused;
  const parts = [`${found} pedido(s) ubicados`];
  if (res.not_found) parts.push(`${res.not_found} sin resultado (arrastra el pin o revisa la dirección)`);
  if (res.error) parts.push("el servicio de mapas no respondió, intenta en un momento");
  redirect(withFlash(back, res.error && found === 0 ? "error" : "ok", parts.join(" · ")));
}
