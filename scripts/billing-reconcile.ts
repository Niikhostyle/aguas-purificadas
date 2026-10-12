/**
 * Reconciles MiBidón tenants with FOSSBilling orders (cron / manual safety net).
 *
 * The FOSSBilling "mibidon" module already reconciles hourly from FOSSBilling's own cron;
 * this script does the same from outside, via the FOSSBilling admin API, in case the
 * module is disabled or its hooks failed. Idempotent: it only sends `sync` actions.
 *
 * Dependency-free (Node ≥ 20 fetch + crypto), so it can run from a checkout with
 * `npx tsx scripts/billing-reconcile.ts` or on Node ≥ 22.6 with `--experimental-strip-types`.
 *
 * Env:
 *   FOSSBILLING_API_URL      https://billing.mibidon.cl
 *   FOSSBILLING_API_KEY      API key of a FOSSBilling staff member (Profile → API key)
 *   PLATFORM_PROVISION_URL   http://127.0.0.1:3001/api/platform/provision
 *   PLATFORM_PROVISION_SECRET
 *   FOSSBILLING_PRODUCT_SLUGS  plan-mibidon (comma separated)
 *   MIBIDON_COMPANY_FIELD / MIBIDON_SLUG_FIELD  order form field names (empresa / subdominio)
 * Flags: --dry-run (only print what would be sent)
 */
import { createHmac } from "node:crypto";

type Json = Record<string, unknown>;

const env = (name: string, fallback?: string) => {
  const v = process.env[name]?.trim() || fallback;
  if (!v) throw new Error(`Missing env ${name}`);
  return v;
};

const API_URL = env("FOSSBILLING_API_URL", "https://billing.mibidon.cl").replace(/\/$/, "");
const API_KEY = env("FOSSBILLING_API_KEY");
const PROVISION_URL = env("PLATFORM_PROVISION_URL", "http://127.0.0.1:3001/api/platform/provision");
const SECRET = env("PLATFORM_PROVISION_SECRET");
const PRODUCT_SLUGS = env("FOSSBILLING_PRODUCT_SLUGS", "plan-mibidon").split(",").map((s) => s.trim());
const COMPANY_FIELD = env("MIBIDON_COMPANY_FIELD", "empresa");
const SLUG_FIELD = env("MIBIDON_SLUG_FIELD", "subdominio");
const DRY_RUN = process.argv.includes("--dry-run");
const SYNCABLE = new Set(["active", "suspended", "canceled"]);

async function fossbilling<T>(path: string, params: Json = {}): Promise<T> {
  const res = await fetch(`${API_URL}/api/admin/${path}`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`admin:${API_KEY}`).toString("base64")}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(params),
  });
  const data = (await res.json().catch(() => null)) as { result?: T; error?: { message?: string } | null } | null;
  if (!res.ok || !data || data.error) {
    throw new Error(`FOSSBilling ${path}: ${data?.error?.message || `HTTP ${res.status}`}`);
  }
  return data.result as T;
}

async function provision(payload: Json) {
  const body = JSON.stringify(payload);
  const ts = String(Math.floor(Date.now() / 1000));
  const signature = createHmac("sha256", SECRET).update(`${ts}.${body}`).digest("hex");
  const res = await fetch(PROVISION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-mibidon-timestamp": ts,
      "x-mibidon-signature": signature,
    },
    body,
  });
  const json = (await res.json().catch(() => ({}))) as Json;
  return { status: res.status, json };
}

async function listAll<T>(path: string, params: Json = {}): Promise<T[]> {
  const out: T[] = [];
  for (let page = 1; page < 1000; page++) {
    const res = await fossbilling<{ list: T[]; pages?: number }>(path, { ...params, page, per_page: 100 });
    out.push(...res.list);
    if (!res.pages || page >= res.pages) break;
  }
  return out;
}

type Order = { id: number | string; client_id: number | string; product_id: number | string; status: string; config?: Json | string | null };
type Client = { id: number; first_name?: string; last_name?: string; email: string; company?: string; phone_cc?: string; phone?: string };

function str(v: unknown) {
  return typeof v === "string" ? v.trim() : typeof v === "number" ? String(v) : "";
}

async function main() {
  const products = await listAll<{ id: number | string; slug: string }>("product/get_list");
  const productIds = new Map(products.filter((p) => PRODUCT_SLUGS.includes(p.slug)).map((p) => [String(p.id), p.slug]));
  if (!productIds.size) throw new Error(`No FOSSBilling product with slug ${PRODUCT_SLUGS.join(", ")}`);

  const orders = (await listAll<Order>("order/get_list")).filter(
    (o) => productIds.has(String(o.product_id)) && SYNCABLE.has(o.status),
  );
  const clients = new Map<string, Client>();
  const summary = { orders: orders.length, created: 0, changed: 0, unchanged: 0, errors: 0 };

  for (const order of orders) {
    try {
      const full = typeof order.config === "object" && order.config ? order : await fossbilling<Order>("order/get", { id: order.id });
      const config = (typeof full.config === "string" ? JSON.parse(full.config || "{}") : full.config || {}) as Json;
      const clientId = String(order.client_id);
      if (!clients.has(clientId)) clients.set(clientId, await fossbilling<Client>("client/get", { id: order.client_id }));
      const client = clients.get(clientId)!;

      const ownerName = `${str(client.first_name)} ${str(client.last_name)}`.trim();
      const companyName = str(config[COMPANY_FIELD]) || str(client.company) || ownerName;
      const phone = str(client.phone);
      const payload = {
        action: "sync",
        status: order.status,
        orderId: String(order.id),
        clientId,
        companyName,
        slug: str(config[SLUG_FIELD]) || companyName,
        ownerName: ownerName || companyName,
        ownerEmail: client.email,
        ownerPhone: phone ? `${str(client.phone_cc) ? `+${str(client.phone_cc).replace(/^\+/, "")} ` : ""}${phone}` : null,
        plan: productIds.get(String(order.product_id)),
      };

      if (DRY_RUN) {
        console.log(`[dry-run] order ${order.id} (${order.status}) -> ${payload.slug}`);
        continue;
      }
      const res = await provision(payload);
      if (res.json.created) {
        summary.created++;
        console.log(`order ${order.id}: store created ${(res.json.tenant as Json)?.url} — invite: ${res.json.inviteUrl ? "issued (send it to the client)" : "none"}`);
        if (res.json.inviteUrl) console.log(`  invite for ${client.email}: ${res.json.inviteUrl}`);
      } else if (res.json.ok) {
        if (res.json.changed) {
          summary.changed++;
          console.log(`order ${order.id}: ${order.status}`);
        } else summary.unchanged++;
      } else {
        summary.errors++;
        console.error(`order ${order.id}: HTTP ${res.status} ${res.json.message || res.json.error}`);
      }
    } catch (e) {
      summary.errors++;
      console.error(`order ${order.id}:`, e instanceof Error ? e.message : e);
    }
  }

  console.log(JSON.stringify(summary));
  process.exitCode = summary.errors ? 1 : 0;
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exitCode = 1;
});
