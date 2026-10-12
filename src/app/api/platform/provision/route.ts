import { NextResponse } from "next/server";
import {
  SIGNATURE_HEADER,
  TIMESTAMP_HEADER,
  verifyProvisionSignature,
} from "@/lib/provision-signature";
import { handleProvision, provisionRequestSchema } from "@/lib/provisioning";
import { getTenantSlugFromHeaders } from "@/lib/tenant";

export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 16 * 1024;

function json(status: number, body: Record<string, unknown>) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

/**
 * Server-to-server endpoint for FOSSBilling (billing.mibidon.cl): creates, suspends,
 * reactivates and cancels tenants. Body is HMAC-signed with PLATFORM_PROVISION_SECRET.
 */
export async function POST(request: Request) {
  // Tenant hosts (<slug>.mibidon.cl, ?tenant=) never expose platform endpoints.
  if (await getTenantSlugFromHeaders()) return json(404, { ok: false, error: "not_found" });

  const secret = process.env.PLATFORM_PROVISION_SECRET?.trim();
  if (!secret || secret.length < 32) {
    return json(503, { ok: false, error: "provisioning_disabled" });
  }

  const raw = await request.text();
  if (Buffer.byteLength(raw) > MAX_BODY_BYTES) return json(413, { ok: false, error: "too_large" });

  const check = verifyProvisionSignature(
    secret,
    request.headers.get(TIMESTAMP_HEADER),
    request.headers.get(SIGNATURE_HEADER),
    raw,
  );
  if (!check.ok) return json(401, { ok: false, error: check.reason });

  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return json(400, { ok: false, error: "bad_json" });
  }
  const parsed = provisionRequestSchema.safeParse(payload);
  if (!parsed.success) {
    return json(422, {
      ok: false,
      error: "invalid_request",
      issues: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
    });
  }

  try {
    const result = await handleProvision(parsed.data);
    console.info(
      `[provision] ${parsed.data.action} order=${"orderId" in parsed.data ? parsed.data.orderId : "-"} -> ${result.status}`,
    );
    return json(result.status, result.body);
  } catch (e) {
    console.error("[provision] failed", e);
    return json(500, { ok: false, error: "internal_error" });
  }
}
