import { prisma } from "@/lib/db";
import {
  commitWebpayPayment,
  createWebpayPayment,
  getAppBaseUrl,
} from "@/lib/webpay";

const TERMINAL = new Set(["paid", "failed", "cancelled"]);

export async function startPaymentForOrder(orderId: string, tenantId: string) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, tenantId },
  });
  if (!order) throw new Error("Pedido no encontrado");
  if (TERMINAL.has(order.status)) {
    return { redirectTo: `${getAppBaseUrl()}/pedido/${order.id}` };
  }

  // Reuse existing sandbox redirect if we already created a token
  if (
    order.webpayToken &&
    order.paymentProvider === "sandbox" &&
    order.status === "pending"
  ) {
    // Need the Transbank URL again — recreate is safer with new buy order
  }

  let payment;
  try {
    payment = await createWebpayPayment({
      tenantId,
      orderId: order.id,
      amountClp: order.totalClp,
    });
  } catch (err) {
    console.error("WebPay create failed, falling back to mock:", err);
    payment = {
      mode: "mock" as const,
      buyOrder: `MOCK${Date.now().toString(36)}`.slice(0, 26),
    };
  }

  if (payment.mode === "mock") {
    await prisma.order.update({
      where: { id: order.id },
      data: {
        buyOrder: payment.buyOrder,
        paymentProvider: "mock",
        webpayToken: null,
      },
    });
    return { redirectTo: `/pago/mock/${order.id}` };
  }

  await prisma.order.update({
    where: { id: order.id },
    data: {
      buyOrder: payment.buyOrder,
      webpayToken: payment.token,
      paymentProvider: "sandbox",
    },
  });

  return {
    redirectTo: `${payment.url}?token_ws=${encodeURIComponent(payment.token)}`,
  };
}

/** Idempotent commit: terminal statuses are returned as-is. */
export async function finalizeWebpayReturn(input: {
  token?: string | null;
  abortedToken?: string | null;
}) {
  const token = input.token || null;
  const aborted = input.abortedToken || null;

  if (aborted && !token) {
    const order = await prisma.order.findFirst({
      where: { webpayToken: aborted },
    });
    if (!order) return { orderId: null as string | null, status: "cancelled" as const };
    if (TERMINAL.has(order.status)) {
      return { orderId: order.id, status: order.status };
    }
    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: "cancelled",
        webpayStatus: "ABORTED",
      },
    });
    return { orderId: order.id, status: "cancelled" as const };
  }

  if (!token) {
    return { orderId: null as string | null, status: "failed" as const };
  }

  const order = await prisma.order.findFirst({
    where: { webpayToken: token },
  });
  if (!order) {
    return { orderId: null as string | null, status: "failed" as const };
  }

  if (TERMINAL.has(order.status)) {
    return { orderId: order.id, status: order.status };
  }

  const commit = await commitWebpayPayment({
    tenantId: order.tenantId,
    token,
  });

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: {
      status: commit.status,
      webpayStatus: commit.webpayStatus,
      webpayResponseCode: commit.responseCode,
      webpayAuthorizationCode: commit.authorizationCode,
      webpayPaymentTypeCode: commit.paymentTypeCode,
      webpayCardLast4: commit.cardLast4,
      paidAt: commit.status === "paid" ? new Date() : null,
    },
  });

  return { orderId: updated.id, status: updated.status };
}

export async function finalizeMockPayment(input: {
  orderId: string;
  tenantId: string;
  outcome: "paid" | "failed" | "cancelled";
}) {
  const order = await prisma.order.findFirst({
    where: { id: input.orderId, tenantId: input.tenantId },
  });
  if (!order) return null;
  if (TERMINAL.has(order.status)) return order;

  return prisma.order.update({
    where: { id: order.id },
    data: {
      status: input.outcome,
      paymentProvider: "mock",
      webpayStatus:
        input.outcome === "paid"
          ? "AUTHORIZED"
          : input.outcome === "cancelled"
            ? "ABORTED"
            : "FAILED",
      webpayResponseCode: input.outcome === "paid" ? 0 : -1,
      webpayAuthorizationCode:
        input.outcome === "paid" ? "MOCK-AUTH" : null,
      paidAt: input.outcome === "paid" ? new Date() : null,
    },
  });
}
