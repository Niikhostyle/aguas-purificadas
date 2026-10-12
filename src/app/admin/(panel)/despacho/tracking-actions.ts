"use server";

import { z } from "zod";
import { recordDriverPosition, stopDriverSharing } from "@/lib/live-tracking-server";
import { requireTenantModule } from "@/lib/tenant-admin";

const fixSchema = z.object({
  routeId: z.string().min(1).max(40),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  accuracy: z.number().min(0).max(100000).nullable().optional(),
  heading: z.number().min(0).max(360).nullable().optional(),
});

export type TrackingResult = { ok: true } | { ok: false; error: string };

export async function reportDriverPositionAction(input: z.input<typeof fixSchema>): Promise<TrackingResult> {
  const { tenantId, enabled } = await requireTenantModule("despacho");
  if (!enabled) return { ok: false, error: "El módulo de despacho está desactivado" };
  const parsed = fixSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Ubicación inválida" };
  const { routeId, ...fix } = parsed.data;
  const saved = await recordDriverPosition(tenantId, routeId, fix);
  return saved ? { ok: true } : { ok: false, error: "Ruta no encontrada" };
}

export async function stopDriverSharingAction(routeId: string): Promise<TrackingResult> {
  const { tenantId } = await requireTenantModule("despacho");
  const id = z.string().min(1).max(40).safeParse(routeId);
  if (!id.success) return { ok: false, error: "Ruta inválida" };
  await stopDriverSharing(tenantId, id.data);
  return { ok: true };
}
