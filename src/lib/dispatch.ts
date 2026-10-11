export const FULFILLMENT_STATUSES = [
  "por_asignar",
  "programado",
  "en_ruta",
  "entregado",
  "no_entregado",
] as const;
export type FulfillmentStatus = (typeof FULFILLMENT_STATUSES)[number];

export const FULFILLMENT_LABEL: Record<string, string> = {
  por_asignar: "Por asignar",
  programado: "Programado",
  en_ruta: "En ruta",
  entregado: "Entregado",
  no_entregado: "No entregado",
};

export const FULFILLMENT_BADGE: Record<string, string> = {
  por_asignar: "bg-amber-50 text-amber-800 ring-amber-200",
  programado: "bg-sky-50 text-sky-800 ring-sky-200",
  en_ruta: "bg-[#e6f7fc] text-[#007fa3] ring-[#9fdcef]",
  entregado: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  no_entregado: "bg-rose-50 text-rose-800 ring-rose-200",
};

export const PAYMENT_BADGE: Record<string, string> = {
  paid: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  pending: "bg-amber-50 text-amber-800 ring-amber-200",
  failed: "bg-rose-50 text-rose-800 ring-rose-200",
  cancelled: "bg-slate-100 text-slate-600 ring-slate-200",
};

export const SLOTS = ["manana", "tarde"] as const;
export const SLOT_LABEL: Record<string, string> = {
  manana: "Mañana (9–13 h)",
  tarde: "Tarde (14–19 h)",
};

export const FREQUENCIES = ["semanal", "quincenal", "mensual"] as const;
export type Frequency = (typeof FREQUENCIES)[number];
export const FREQUENCY_LABEL: Record<string, string> = {
  semanal: "Semanal",
  quincenal: "Quincenal",
  mensual: "Mensual",
};

/** Orders that can enter dispatch (failed/cancelled payments are excluded). */
export const DISPATCHABLE_PAYMENT = ["paid", "pending"];

const TZ = "America/Santiago";

/** YYYY-MM-DD for "now" in Chile. */
export function todayCl(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** @db.Date values come back as UTC midnight. */
export function toDateStr(d: Date | null | undefined): string | null {
  if (!d) return null;
  return d.toISOString().slice(0, 10);
}

export function dateFromStr(s: string): Date {
  return new Date(`${s}T00:00:00.000Z`);
}

export function addDaysStr(s: string, days: number): string {
  const d = dateFromStr(s);
  d.setUTCDate(d.getUTCDate() + days);
  return toDateStr(d)!;
}

export function addFrequency(s: string, freq: string | null | undefined): string {
  if (freq === "semanal") return addDaysStr(s, 7);
  if (freq === "quincenal") return addDaysStr(s, 14);
  const d = dateFromStr(s);
  d.setUTCMonth(d.getUTCMonth() + 1);
  return toDateStr(d)!;
}

function clOffsetMinutes(at: Date): number {
  const part = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    timeZoneName: "longOffset",
  })
    .formatToParts(at)
    .find((p) => p.type === "timeZoneName")?.value;
  const m = part?.match(/GMT([+-])(\d{2}):(\d{2})/);
  if (!m) return -180;
  const sign = m[1] === "-" ? -1 : 1;
  return sign * (Number(m[2]) * 60 + Number(m[3]));
}

/** UTC instant at which the given Chile calendar day starts. */
export function startOfDayCl(s: string = todayCl()): Date {
  const utcMidnight = dateFromStr(s);
  return new Date(utcMidnight.getTime() - clOffsetMinutes(utcMidnight) * 60_000);
}

export function formatDateCl(s: string | null, style: "short" | "long" = "short"): string {
  if (!s) return "Sin fecha";
  const d = dateFromStr(s);
  return d.toLocaleDateString("es-CL", {
    timeZone: "UTC",
    weekday: style === "long" ? "long" : "short",
    day: "numeric",
    month: style === "long" ? "long" : "short",
  });
}

export function formatDateTimeCl(d: Date | null | undefined): string {
  if (!d) return "—";
  return d.toLocaleString("es-CL", {
    timeZone: TZ,
    dateStyle: "short",
    timeStyle: "short",
  });
}

/** Digits only with Chile country code, e.g. 56912345678. */
export function normalizePhone(raw: string): string {
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.length === 9 && digits.startsWith("9")) digits = `56${digits}`;
  if (digits.length === 8) digits = `569${digits}`;
  return digits;
}

export function customerWhatsappHref(phone: string, text: string): string {
  return `https://wa.me/${normalizePhone(phone)}?text=${encodeURIComponent(text)}`;
}

export function mapsHref(address: string, commune?: string | null): string {
  const q = [address, commune, "Chile"].filter(Boolean).join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

/**
 * Returnable containers are inferred from the product name (bidón / recarga /
 * botellón); dispensers and accessories are not returnable.
 */
export function isReturnableItem(name: string): boolean {
  if (/dispensador|surtidor|bomba|vaso|soporte|toma|rack|porta/i.test(name)) return false;
  return /bid[oó]n|recarga|botell[oó]n/i.test(name);
}

export function bottlesForItems(
  items: { productName: string; quantity: number }[],
): number {
  return items.reduce(
    (sum, item) => sum + (isReturnableItem(item.productName) ? item.quantity : 0),
    0,
  );
}

export function shortRef(id: string): string {
  return id.slice(-8).toUpperCase();
}

/** Stops are ordered by comuna/sector, then address (not real route optimization). */
export function compareStops(
  a: { deliveryCommune: string | null; deliveryZoneName: string | null; customerAddress: string },
  b: { deliveryCommune: string | null; deliveryZoneName: string | null; customerAddress: string },
): number {
  const ka = `${a.deliveryCommune ?? a.deliveryZoneName ?? "~"}|${a.customerAddress}`;
  const kb = `${b.deliveryCommune ?? b.deliveryZoneName ?? "~"}|${b.customerAddress}`;
  return ka.localeCompare(kb, "es", { sensitivity: "base", numeric: true });
}
