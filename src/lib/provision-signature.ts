import { createHmac, timingSafeEqual } from "crypto";

export const SIGNATURE_HEADER = "x-mibidon-signature";
export const TIMESTAMP_HEADER = "x-mibidon-timestamp";
export const MAX_SKEW_SECONDS = 300;

/** hex(HMAC-SHA256(secret, `${timestamp}.${rawBody}`)); timestamp in unix seconds. */
export function signProvisionBody(secret: string, timestamp: string, rawBody: string) {
  return createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex");
}

export type SignatureCheck = { ok: true } | { ok: false; reason: string };

export function verifyProvisionSignature(
  secret: string,
  timestamp: string | null,
  signature: string | null,
  rawBody: string,
  nowSeconds = Math.floor(Date.now() / 1000),
): SignatureCheck {
  if (!timestamp || !/^\d{9,12}$/.test(timestamp)) return { ok: false, reason: "bad_timestamp" };
  if (Math.abs(nowSeconds - Number(timestamp)) > MAX_SKEW_SECONDS) {
    return { ok: false, reason: "expired_timestamp" };
  }
  const given = (signature || "").trim().replace(/^sha256=/i, "").toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(given)) return { ok: false, reason: "bad_signature" };
  const expected = signProvisionBody(secret, timestamp, rawBody);
  const ok = timingSafeEqual(Buffer.from(given, "hex"), Buffer.from(expected, "hex"));
  return ok ? { ok: true } : { ok: false, reason: "bad_signature" };
}
