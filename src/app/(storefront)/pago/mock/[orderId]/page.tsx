import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { mockPayAction } from "@/app/(storefront)/pago/mock-actions";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db";
import { getWebpayMode } from "@/lib/webpay";
import { requireTenant } from "@/lib/tenant";
import { formatClp } from "@/lib/utils";

type Props = { params: Promise<{ orderId: string }> };

export default async function MockPaymentPage({ params }: Props) {
  const { orderId } = await params;
  const tenant = await requireTenant();
  const order = await prisma.order.findFirst({
    where: { id: orderId, tenantId: tenant.id },
  });
  if (!order) notFound();

  if (order.status !== "pending") {
    redirect(`/pedido/${order.id}`);
  }

  const mode = getWebpayMode();

  return (
    <div className="bg-[linear-gradient(180deg,#e8f4f1_0%,#f3f7f6_50%)]">
      <div className="mx-auto max-w-lg px-5 pb-20 pt-12 md:px-8">
        <p className="text-sm font-medium uppercase tracking-wide text-[var(--brand)]">
          Pago demo (mock)
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl text-[var(--brand-deep)]">
          Simular WebPay
        </h1>
        <p className="mt-3 text-sm text-[#4a655f]">
          Modo actual: <code className="rounded bg-white px-1">{mode}</code>.
          Esta pantalla aparece cuando{" "}
          <code className="rounded bg-white px-1">WEBPAY_MODE=mock</code> o si
          falla la creación en sandbox. Para Transbank real usá{" "}
          <code className="rounded bg-white px-1">WEBPAY_MODE=sandbox</code>{" "}
          (credenciales de integración).
        </p>

        <div className="mt-8 border border-[#c5d8d2] bg-white/80 p-5 text-sm">
          <p className="text-[#4a655f]">Pedido</p>
          <p className="font-mono text-[var(--brand-deep)]">
            {order.id.slice(-8).toUpperCase()}
          </p>
          <p className="mt-3 text-[#4a655f]">Total</p>
          <p className="font-[family-name:var(--font-display)] text-2xl text-[var(--brand)]">
            {formatClp(order.totalClp)}
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-3">
          <form action={mockPayAction}>
            <input type="hidden" name="orderId" value={order.id} />
            <input type="hidden" name="outcome" value="paid" />
            <Button type="submit" className="w-full">
              Simular pago aprobado
            </Button>
          </form>
          <form action={mockPayAction}>
            <input type="hidden" name="orderId" value={order.id} />
            <input type="hidden" name="outcome" value="failed" />
            <Button type="submit" variant="outline" className="w-full">
              Simular pago rechazado
            </Button>
          </form>
          <form action={mockPayAction}>
            <input type="hidden" name="orderId" value={order.id} />
            <input type="hidden" name="outcome" value="cancelled" />
            <Button type="submit" variant="ghost" className="w-full">
              Simular anulación
            </Button>
          </form>
        </div>

        <p className="mt-8 text-center text-sm">
          <Link href="/carrito" className="text-[var(--brand)] hover:underline">
            Volver al carrito
          </Link>
        </p>
      </div>
    </div>
  );
}
