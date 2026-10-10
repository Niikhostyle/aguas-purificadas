import {
  Environment,
  IntegrationApiKeys,
  IntegrationCommerceCodes,
  Options,
  WebpayPlus,
} from "transbank-sdk";
import { decryptSecret } from "@/lib/crypto";
import { prisma } from "@/lib/db";

export type WebpayMode = "auto" | "sandbox" | "mock";

export type TenantWebpayCreds = {
  commerceCode: string;
  apiKey: string;
  environment: "integration" | "production";
  source: "db" | "env" | "sdk-defaults";
};

export function getWebpayMode(): WebpayMode {
  const mode = (process.env.WEBPAY_MODE || "auto").toLowerCase();
  if (mode === "sandbox" || mode === "mock" || mode === "auto") return mode;
  return "auto";
}

export function getAppBaseUrl(): string {
  return (
    process.env.APP_URL?.replace(/\/$/, "") || "http://127.0.0.1:43123"
  );
}

/** Resolve credentials for a tenant. Returns null if none available. */
export async function resolveTenantWebpayCreds(
  tenantId: string,
): Promise<TenantWebpayCreds | null> {
  const row = await prisma.webPayCredential.findUnique({
    where: { tenantId },
  });
  if (row?.active && row.apiKeyEncrypted) {
    try {
      return {
        commerceCode: row.commerceCode,
        apiKey: decryptSecret(row.apiKeyEncrypted),
        environment:
          row.environment === "production" ? "production" : "integration",
        source: "db",
      };
    } catch {
      // fall through to env
    }
  }

  const commerceCode = process.env.WEBPAY_COMMERCE_CODE;
  const apiKey = process.env.WEBPAY_API_KEY;
  if (commerceCode && apiKey) {
    return {
      commerceCode,
      apiKey,
      environment: "integration",
      source: "env",
    };
  }

  // Official Transbank integration commerce defaults (safe for sandbox only)
  if (getWebpayMode() !== "mock") {
    return {
      commerceCode: IntegrationCommerceCodes.WEBPAY_PLUS,
      apiKey: IntegrationApiKeys.WEBPAY,
      environment: "integration",
      source: "sdk-defaults",
    };
  }

  return null;
}

export function shouldUseMock(creds: TenantWebpayCreds | null): boolean {
  const mode = getWebpayMode();
  if (mode === "mock") return true;
  if (mode === "sandbox") return false;
  // auto: mock only when explicitly no creds (shouldn't happen with sdk-defaults)
  return !creds;
}

function buildTransaction(creds: TenantWebpayCreds) {
  const env =
    creds.environment === "production"
      ? Environment.Production
      : Environment.Integration;
  return new WebpayPlus.Transaction(
    new Options(creds.commerceCode, creds.apiKey, env),
  );
}

/** Unique buy_order ≤ 26 chars for Transbank. */
export function makeBuyOrder(orderId: string): string {
  const suffix = orderId.replace(/[^a-zA-Z0-9]/g, "").slice(-10);
  const stamp = Date.now().toString(36).slice(-8);
  return `RC${stamp}${suffix}`.slice(0, 26);
}

export type CreatePaymentResult =
  | { mode: "sandbox"; token: string; url: string; buyOrder: string }
  | { mode: "mock"; buyOrder: string };

export async function createWebpayPayment(input: {
  tenantId: string;
  orderId: string;
  amountClp: number;
}): Promise<CreatePaymentResult> {
  const creds = await resolveTenantWebpayCreds(input.tenantId);
  const buyOrder = makeBuyOrder(input.orderId);

  if (shouldUseMock(creds) || !creds) {
    return { mode: "mock", buyOrder };
  }

  const returnUrl = `${getAppBaseUrl()}/pago/retorno`;
  const tx = buildTransaction(creds);
  const response = await tx.create(
    buyOrder,
    input.orderId,
    input.amountClp,
    returnUrl,
  );

  return {
    mode: "sandbox",
    token: response.token,
    url: response.url,
    buyOrder,
  };
}

export type CommitResult = {
  status: "paid" | "failed";
  webpayStatus: string;
  responseCode: number | null;
  authorizationCode: string | null;
  paymentTypeCode: string | null;
  cardLast4: string | null;
  raw?: unknown;
};

export async function commitWebpayPayment(input: {
  tenantId: string;
  token: string;
}): Promise<CommitResult> {
  const creds = await resolveTenantWebpayCreds(input.tenantId);
  if (!creds) {
    return {
      status: "failed",
      webpayStatus: "NO_CREDENTIALS",
      responseCode: null,
      authorizationCode: null,
      paymentTypeCode: null,
      cardLast4: null,
    };
  }

  const tx = buildTransaction(creds);

  try {
    const result = await tx.commit(input.token);
    const responseCode =
      typeof result.response_code === "number" ? result.response_code : null;
    const webpayStatus = String(result.status || "");
    const authorized =
      webpayStatus === "AUTHORIZED" &&
      (responseCode === 0 || responseCode === null);

    return {
      status: authorized ? "paid" : "failed",
      webpayStatus,
      responseCode,
      authorizationCode: result.authorization_code
        ? String(result.authorization_code)
        : null,
      paymentTypeCode: result.payment_type_code
        ? String(result.payment_type_code)
        : null,
      cardLast4: result.card_detail?.card_number
        ? String(result.card_detail.card_number).slice(-4)
        : null,
      raw: result,
    };
  } catch (err) {
    // Idempotency: transaction may already be committed — fetch status
    try {
      const statusResult = await tx.status(input.token);
      const responseCode =
        typeof statusResult.response_code === "number"
          ? statusResult.response_code
          : null;
      const webpayStatus = String(statusResult.status || "");
      const authorized =
        webpayStatus === "AUTHORIZED" &&
        (responseCode === 0 || responseCode === null);
      return {
        status: authorized ? "paid" : "failed",
        webpayStatus: webpayStatus || "COMMIT_RETRY",
        responseCode,
        authorizationCode: statusResult.authorization_code
          ? String(statusResult.authorization_code)
          : null,
        paymentTypeCode: statusResult.payment_type_code
          ? String(statusResult.payment_type_code)
          : null,
        cardLast4: statusResult.card_detail?.card_number
          ? String(statusResult.card_detail.card_number).slice(-4)
          : null,
        raw: { commitError: String(err), status: statusResult },
      };
    } catch {
      return {
        status: "failed",
        webpayStatus: "COMMIT_ERROR",
        responseCode: null,
        authorizationCode: null,
        paymentTypeCode: null,
        cardLast4: null,
        raw: { error: String(err) },
      };
    }
  }
}

export const SANDBOX_TEST_CARDS = {
  approvedVisa: {
    number: "4051885600446623",
    cvv: "123",
    note: "Aprobada (Visa débito/crédito integración)",
  },
  rejectedVisa: {
    number: "4051885600446623",
    // Actually rejection uses same card with different outcome via RUT - Transbank integration uses:
    // For credit: 4051885600446623 approved
    // Rejected: 5180350659385122 or use authentication failure
  },
  // Official common integration cards from Transbank docs
  creditApproved: "4051885600446623",
  creditRejected: "5180350659385122",
  debitApproved: "4051885600446623",
} as const;
