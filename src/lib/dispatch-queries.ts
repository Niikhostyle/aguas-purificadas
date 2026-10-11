import { prisma } from "@/lib/db";
import { DISPATCHABLE_PAYMENT, dateFromStr, startOfDayCl, todayCl } from "@/lib/dispatch";

export async function getDispatchStats(tenantId: string) {
  const today = todayCl();
  const dayStart = startOfDayCl(today);
  const base = { tenantId, status: { in: DISPATCHABLE_PAYMENT } };
  const [hoy, creadosHoy, pendientes, enRuta, entregadosHoy] = await Promise.all([
    prisma.order.count({ where: { ...base, deliveryDate: dateFromStr(today) } }),
    prisma.order.count({ where: { ...base, createdAt: { gte: dayStart } } }),
    prisma.order.count({
      where: { ...base, fulfillmentStatus: { in: ["por_asignar", "programado", "no_entregado"] } },
    }),
    prisma.order.count({ where: { ...base, fulfillmentStatus: "en_ruta" } }),
    prisma.order.count({
      where: { ...base, fulfillmentStatus: "entregado", deliveredAt: { gte: dayStart } },
    }),
  ]);
  return { today, hoy, creadosHoy, pendientes, enRuta, entregadosHoy };
}
