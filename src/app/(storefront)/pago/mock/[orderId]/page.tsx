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
    <div className="bg-[linear-gradient(180deg,var(--mist)_0%,#fff_420px)]">
      <div className="mx-auto max-w-lg px-5 pb-20 pt-12 md:px-8">
        <p className="sf-eyebrow">
          Pago demo (mock)
        </p>
        <h1 className="rc-display mt-3 text-4xl uppercase text-[var(--brand-deep)]">
          Simular WebPay
        </h1>
        <p className="mt-3 text-sm text-[#5a6578]">
          Modo actual: <code className="rounded bg-white px-1">{mode}</code>.
          Esta pantalla aparece cuando{" "}
          <code className="rounded bg-white px-1">WEBPAY_MODE=mock</code> o si
          falla la creación en sandbox. Para Transbank real usa{" "}
          <code className="rounded bg-white px-1">WEBPAY_MODE=sandbox</code>{" "}
          (credenciales de integración).
        </p>

        <div className="sf-enter sf-card mt-8 p-5 text-sm">
          <p className="text-[#5a6578]">Pedido</p>
          <p className="font-mono text-[var(--brand-deep)]">
            {order.id.slice(-8).toUpperCase()}
          </p>
          <p className="mt-3 text-[#5a6578]">Total</p>
          <p className="rc-display text-3xl text-[var(--brand)]">
            {formatClp(order.totalClp)}
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-3">
          <form action={mockPayAction}>
            <input type="hidden" name="orderId" value={order.id} />
            <input type="hidden" name="outcome" value="paid" />
            <Button type="submit" className="h-11 w-full font-semibold">
              Simular pago aprobado
            </Button>
          </form>
          <form action={mockPayAction}>
            <input type="hidden" name="orderId" value={order.id} />
            <input type="hidden" name="outcome" value="failed" />
            <Button type="submit" variant="outline" className="h-11 w-full">
              Simular pago rechazado
            </Button>
          </form>
          <form action={mockPayAction}>
            <input type="hidden" name="orderId" value={order.id} />
            <input type="hidden" name="outcome" value="cancelled" />
            <Button type="submit" variant="ghost" className="h-11 w-full">
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
