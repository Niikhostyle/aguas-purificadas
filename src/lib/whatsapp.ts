/** MiBidón's own sales number (apex landing), digits only, e.g. 56912345678 */
export function whatsappNumber(): string {
  const raw = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "56900000000").replace(
    /\D/g,
    "",
  );
  return raw || "56900000000";
}

export function whatsappHref(text: string): string {
  return `https://wa.me/${whatsappNumber()}?text=${encodeURIComponent(text)}`;
}

/**
 * Normalizes a Chilean number to digits with country code (56 + 9 digits).
 * Accepts "+56 9 1234 5678", "912345678", "56912345678", "0056…".
 * Returns null when it can't be a valid Chilean number.
 */
export function normalizeChileWhatsapp(raw: string | null | undefined): string | null {
  let digits = (raw ?? "").replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.length === 9) digits = `56${digits}`;
  else if (digits.length === 8) digits = `569${digits}`;
  return /^56\d{9}$/.test(digits) ? digits : null;
}

/** "+56 9 1234 5678" for mobiles, "+56 71 234 5678"-style otherwise. */
export function formatChileWhatsapp(raw: string | null | undefined): string {
  const d = normalizeChileWhatsapp(raw);
  if (!d) return raw ?? "";
  const local = d.slice(2);
  return local.startsWith("9")
    ? `+56 9 ${local.slice(1, 5)} ${local.slice(5)}`
    : `+56 ${local.slice(0, 2)} ${local.slice(2, 5)} ${local.slice(5)}`;
}

/** wa.me link to a tenant's company number, or null when not configured. */
export function tenantWhatsappHref(
  whatsapp: string | null | undefined,
  text?: string,
): string | null {
  const digits = normalizeChileWhatsapp(whatsapp);
  if (!digits) return null;
  return text
    ? `https://wa.me/${digits}?text=${encodeURIComponent(text)}`
    : `https://wa.me/${digits}`;
}
