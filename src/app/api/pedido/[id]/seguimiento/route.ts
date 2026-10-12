import { getOrderTracking } from "@/lib/live-tracking-server";
import { getTenantSlugFromHeaders } from "@/lib/tenant";
import { prisma } from "@/lib/db";

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
}

/** Live delivery status of one order, polled by the order page while the truck is on its way. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id || id.length > 40) return json({ error: "not_found" }, 404);
  const slug = await getTenantSlugFromHeaders();
  if (!slug) return json({ error: "not_found" }, 404);
  const tenant = await prisma.tenant.findFirst({ where: { slug, active: true }, select: { id: true } });
  if (!tenant) return json({ error: "not_found" }, 404);
  const tracking = await getOrderTracking(tenant.id, id);
  if (!tracking) return json({ error: "not_found" }, 404);
  return json(tracking);
}
