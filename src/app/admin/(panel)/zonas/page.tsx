import { redirect } from "next/navigation";
import { AlertTriangle, ArrowDown, ArrowUp, MapPinned, Trash2 } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { zonesNeedSetup } from "@/lib/delivery-zones";
import { ConfirmSubmitButton, EmptyState, PageHeader, Panel, StatusBadge, adminButton } from "@/components/admin/ui";
import { ZoneForm } from "@/components/admin/zone-form";
import { deleteZoneAction, moveZoneAction, saveZoneAction } from "./actions";

export default async function DeliveryZonesPage() {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin/login");
  if (admin.role === "super_admin" && admin.tenant.slug === "plataforma") {
    redirect("/admin/plataforma");
  }

  const zones = await prisma.deliveryZone.findMany({
    where: { tenantId: admin.tenantId },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  const needsSetup = zonesNeedSetup(zones);
  const city = admin.tenant.city;

  return (
    <div className="max-w-5xl space-y-5">
      <PageHeader
        title="Zonas de despacho"
        description="Define dónde despachas y cuánto cobras. El cliente elige su zona en el checkout y el costo se suma al total."
        breadcrumbs={[{ label: "Operación" }, { label: "Zonas de despacho" }]}
      />

      {needsSetup ? (
        <div role="status" className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <p>
            {zones.some((z) => z.active)
              ? "Tus zonas son las de ejemplo con que se creó la tienda. Revisa nombres, comunas y costos para que coincidan con donde realmente despachas."
              : "No tienes zonas activas: los clientes no pueden completar su compra. Agrega al menos una zona."}
          </p>
        </div>
      ) : null}

      {zones.length === 0 ? (
        <Panel>
          <EmptyState
            icon={<MapPinned />}
            title="Aún no tienes zonas"
            description="Crea tu primera zona abajo, por ejemplo tu ciudad con despacho gratis."
          />
        </Panel>
      ) : (
        zones.map((zone, i) => (
          <Panel
            key={zone.id}
            title={
              <span className="flex items-center gap-2">
                {zone.name}
                <StatusBadge tone={zone.active ? "success" : "neutral"}>{zone.active ? "Activa" : "Inactiva"}</StatusBadge>
              </span>
            }
            actions={
              <>
                <form action={moveZoneAction}>
                  <input type="hidden" name="id" value={zone.id} />
                  <input type="hidden" name="direction" value="up" />
                  <button
                    type="submit"
                    disabled={i === 0}
                    aria-label={`Subir ${zone.name}`}
                    className={adminButton({ variant: "ghost", size: "sm" })}
                  >
                    <ArrowUp aria-hidden />
                  </button>
                </form>
                <form action={moveZoneAction}>
                  <input type="hidden" name="id" value={zone.id} />
                  <input type="hidden" name="direction" value="down" />
                  <button
                    type="submit"
                    disabled={i === zones.length - 1}
                    aria-label={`Bajar ${zone.name}`}
                    className={adminButton({ variant: "ghost", size: "sm" })}
                  >
                    <ArrowDown aria-hidden />
                  </button>
                </form>
                <form action={deleteZoneAction}>
                  <input type="hidden" name="id" value={zone.id} />
                  <ConfirmSubmitButton
                    confirmTitle={`¿Eliminar «${zone.name}»?`}
                    confirmText="Deja de aparecer en el checkout. Los pedidos anteriores conservan el nombre de la zona. Si solo quieres pausarla, desmarca «Zona activa»."
                    confirmLabel="Sí, eliminar"
                    className={adminButton({ variant: "danger", size: "sm" })}
                  >
                    <Trash2 aria-hidden />
                    Eliminar
                  </ConfirmSubmitButton>
                </form>
              </>
            }
          >
            <ZoneForm
              action={saveZoneAction}
              cityHint={city}
              zone={{
                id: zone.id,
                name: zone.name,
                communes: zone.communes,
                costClp: zone.costClp,
                freeOverClp: zone.freeOverClp,
                active: zone.active,
              }}
            />
          </Panel>
        ))
      )}

      <Panel title="Agregar zona" description="El orden de las zonas es el orden en que aparecen en el checkout.">
        <ZoneForm key={zones.length} action={saveZoneAction} cityHint={city} />
      </Panel>
    </div>
  );
}
