/**
 * Dev-only end-to-end check of /api/platform/provision against a running `next dev`.
 *
 *   PROVISION_TEST_BASE=127.0.0.1:43125 npx tsx scripts/test-provisioning.ts
 *
 * Needs PLATFORM_PROVISION_SECRET (read from .env), PLATFORM_BASE_DOMAIN=localhost:<port>
 * on the server, and a local Chrome for the activation / login steps.
 */
import "dotenv/config";
import { request as httpRequest } from "node:http";
import { randomBytes } from "node:crypto";
import { chromium } from "playwright-core";
import { signProvisionBody } from "../src/lib/provision-signature";

const BASE = process.env.PROVISION_TEST_BASE || "127.0.0.1:43125";
const [HOST_IP, PORT] = BASE.split(":");
const SECRET = process.env.PLATFORM_PROVISION_SECRET || "";
const STRONG_PASSWORD = `Agua-${randomBytes(9).toString("base64url")}!`;

type Res = { status: number; headers: Record<string, string | string[] | undefined>; text: string };

function req(
  method: string,
  host: string,
  path: string,
  opts: { headers?: Record<string, string>; body?: string } = {},
): Promise<Res> {
  return new Promise((resolve, reject) => {
    const r = httpRequest(
      {
        host: HOST_IP,
        port: Number(PORT),
        method,
        path,
        headers: { host, ...(opts.headers || {}) },
      },
      (res) => {
        let text = "";
        res.setEncoding("utf8");
        res.on("data", (c) => (text += c));
        res.on("end", () => resolve({ status: res.statusCode || 0, headers: res.headers, text }));
      },
    );
    r.on("error", reject);
    if (opts.body) r.write(opts.body);
    r.end();
  });
}

const apex = `localhost:${PORT}`;
const tenantHost = (slug: string) => `${slug}.localhost:${PORT}`;

async function provision(
  payload: Record<string, unknown>,
  opts: { host?: string; ts?: number; secret?: string; path?: string } = {},
) {
  const body = JSON.stringify(payload);
  const ts = String(opts.ts ?? Math.floor(Date.now() / 1000));
  const sig = signProvisionBody(opts.secret ?? SECRET, ts, body);
  const res = await req("POST", opts.host ?? apex, opts.path ?? "/api/platform/provision", {
    headers: {
      "content-type": "application/json",
      "x-mibidon-timestamp": ts,
      "x-mibidon-signature": sig,
    },
    body,
  });
  let json: Record<string, unknown> = {};
  try {
    json = JSON.parse(res.text);
  } catch {
    /* non-JSON */
  }
  return { status: res.status, json };
}

let failures = 0;
function check(name: string, cond: unknown, detail?: unknown) {
  if (cond) console.log(`  ok   ${name}`);
  else {
    failures++;
    console.log(`  FAIL ${name}`, detail ?? "");
  }
}

function location(res: Res) {
  return String(res.headers.location || "");
}

async function main() {
  if (SECRET.length < 32) throw new Error("PLATFORM_PROVISION_SECRET missing/short in .env");
  const run = randomBytes(3).toString("hex");
  const slug = `agua-${run}`;
  const orderId = `T-${run}-1`;
  const owner = `owner-${run}@example.com`;
  const createPayload = {
    action: "create",
    orderId,
    clientId: "77",
    companyName: `Aguas Prueba ${run}`,
    slug: `Agua ${run}`,
    ownerName: "Dueña Prueba",
    ownerEmail: owner,
    ownerPhone: "+56 9 1234 5678",
    plan: "plan-mibidon",
  };

  console.log("signature / host guards");
  check("bad signature -> 401", (await provision({ action: "check", slug: "x" }, { secret: "x".repeat(40) })).status === 401);
  const expired = await provision({ action: "check", slug: "x" }, { ts: Math.floor(Date.now() / 1000) - 600 });
  check("expired timestamp -> 401", expired.status === 401 && expired.json.error === "expired_timestamp", expired);
  const noSig = await req("POST", apex, "/api/platform/provision", { body: "{}" });
  check("missing signature -> 401", noSig.status === 401);
  check("tenant host -> 404", (await provision({ action: "check", slug: "x" }, { host: tenantHost("demo") })).status === 404);
  check(
    "?tenant= on apex -> 404",
    (await provision({ action: "check", slug: "x" }, { path: "/api/platform/provision?tenant=demo" })).status === 404,
  );
  const invalid = await provision({ action: "create", orderId: "x" });
  check("invalid payload -> 422", invalid.status === 422, invalid);

  console.log("slug checks");
  const reserved = await provision({ action: "check", slug: "Billing" });
  check("reserved slug unavailable", reserved.json.available === false && reserved.json.reason === "reserved", reserved);
  const takenDemo = await provision({ action: "check", slug: "demo" });
  check("demo unavailable", takenDemo.json.available === false, takenDemo);
  const free = await provision({ action: "check", slug: `Agua ${run}` });
  check("new slug available + normalized", free.json.available === true && free.json.slug === slug, free);

  console.log("create");
  const created = await provision(createPayload);
  const tenant = created.json.tenant as { slug: string; url: string } | undefined;
  check("create -> 201", created.status === 201 && created.json.created === true, created);
  check("tenant slug normalized", tenant?.slug === slug, tenant);
  check("invite url on tenant host", String(created.json.inviteUrl || "").startsWith(`http://${slug}.localhost:${PORT}/admin/activar?token=`), created.json.inviteUrl);
  const firstInvite = String(created.json.inviteUrl);

  const again = await provision(createPayload);
  check("repeat create -> 200 created:false", again.status === 200 && again.json.created === false, again);
  check("repeat create same tenant", (again.json.tenant as { slug?: string })?.slug === slug);
  check("repeat create rotates invite (not activated yet)", Boolean(again.json.inviteUrl) && again.json.inviteUrl !== firstInvite);
  const invite = String(again.json.inviteUrl);

  const conflict = await provision({ ...createPayload, orderId: `T-${run}-2` });
  check("slug conflict -> 409 slug_taken", conflict.status === 409 && conflict.json.error === "slug_taken", conflict);
  const reservedCreate = await provision({ ...createPayload, orderId: `T-${run}-3`, slug: "admin" });
  check("reserved slug create -> 422", reservedCreate.status === 422 && reservedCreate.json.error === "slug_reserved", reservedCreate);

  console.log("storefront / isolation");
  const store = await req("GET", tenantHost(slug), "/");
  check("new storefront 200", store.status === 200 && store.text.includes(`Aguas Prueba ${run}`), store.status);
  const demoStore = await req("GET", tenantHost("demo"), "/");
  check("demo storefront still 200", demoStore.status === 200);

  console.log("activation + login (Chrome)");
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  try {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();

    await page.goto(firstInvite);
    check("revoked first invite rejected", await page.getByText("no es válido").isVisible());

    await page.goto(invite);
    await page.fill("#password", "short");
    await page.fill("#confirm", "short");
    await page.evaluate(() => {
      document.querySelectorAll("input[minlength]").forEach((el) => el.removeAttribute("minlength"));
    });
    await page.click("button[type=submit]");
    const shortShown = await page
      .getByText("debe tener al menos 12")
      .waitFor({ timeout: 10_000 })
      .then(() => true)
      .catch(() => false);
    check("short password rejected", shortShown, page.url());

    await page.fill("#password", STRONG_PASSWORD);
    await page.fill("#confirm", STRONG_PASSWORD);
    await page.click("button[type=submit]");
    await page.waitForURL(`http://${slug}.localhost:${PORT}/admin`);
    check("activation logs in to /admin", page.url().endsWith("/admin"));
    check("panel shows company", await page.getByText(`Aguas Prueba ${run}`).first().isVisible());

    const cookie = (await ctx.cookies()).find((c) => c.name === "aguas_admin_session");
    check("session cookie host-only on tenant", cookie?.domain === `${slug}.localhost`, cookie?.domain);
    const cookieHeader = { cookie: `aguas_admin_session=${cookie?.value}` };
    const otherTenant = await req("GET", tenantHost("demo"), "/admin/pedidos", { headers: cookieHeader });
    check("session rejected on demo host", otherTenant.status !== 200 || !otherTenant.text.includes(`Aguas Prueba ${run}`), otherTenant.status);
    const platform = await req("GET", apex, "/admin/plataforma", { headers: cookieHeader });
    check("session rejected on platform", platform.status >= 300 && platform.status < 400, platform.status);

    await page.goto(invite);
    check("used invite rejected", await page.getByText("no es válido").isVisible());

    const ctx2 = await browser.newContext();
    const p2 = await ctx2.newPage();
    await p2.goto(`http://${slug}.localhost:${PORT}/admin/login`);
    await p2.fill("#email", owner);
    await p2.fill("#password", STRONG_PASSWORD);
    await p2.click("button[type=submit]");
    await p2.waitForURL(`http://${slug}.localhost:${PORT}/admin`);
    check("password login OK", p2.url().endsWith("/admin"));

    const repeatAfter = await provision(createPayload);
    check("repeat create after activation -> no invite", repeatAfter.status === 200 && repeatAfter.json.inviteUrl === null, repeatAfter);

    console.log("suspend");
    const susp = await provision({ action: "suspend", orderId });
    check("suspend -> 200", susp.status === 200 && (susp.json.tenant as { billingStatus?: string })?.billingStatus === "suspended", susp);
    const sStore = await req("GET", tenantHost(slug), "/productos");
    check("storefront redirects to /suspendida", sStore.status === 307 && location(sStore).endsWith("/suspendida"), [sStore.status, location(sStore)]);
    const sPage = await req("GET", tenantHost(slug), "/suspendida");
    check("suspended page friendly", sPage.status === 200 && sPage.text.includes("Cuenta suspendida"), sPage.status);
    await p2.goto(`http://${slug}.localhost:${PORT}/admin`);
    check("admin panel blocked -> /suspendida", p2.url().endsWith("/suspendida"), p2.url());
    const sInvite = await provision({ action: "invite", orderId });
    check("no invites while suspended", sInvite.status === 409, sInvite);
    const unknown = await provision({ action: "suspend", orderId: "nope-404" });
    check("suspend unknown order -> 404", unknown.status === 404);
    const demoOk = await req("GET", tenantHost("demo"), "/");
    check("other tenants unaffected", demoOk.status === 200);

    console.log("unsuspend / renew");
    const uns = await provision({ action: "unsuspend", orderId });
    check("unsuspend -> 200", uns.status === 200 && (uns.json.tenant as { active?: boolean })?.active === true, uns);
    check("storefront back", (await req("GET", tenantHost(slug), "/")).status === 200);
    await p2.goto(`http://${slug}.localhost:${PORT}/admin`);
    check("admin session works again", p2.url().endsWith("/admin"), p2.url());
    check("renew -> 200", (await provision({ action: "renew", orderId })).status === 200);
    const reinvite = await provision({ action: "invite", orderId });
    check("invite (password reset) -> url", reinvite.status === 200 && String(reinvite.json.inviteUrl).includes("/admin/activar?token="), reinvite);

    console.log("cancel / sync");
    const can = await provision({ action: "cancel", orderId });
    check("cancel -> 200", can.status === 200 && (can.json.tenant as { billingStatus?: string })?.billingStatus === "canceled", can);
    const cPage = await req("GET", tenantHost(slug), "/suspendida");
    check("canceled page", cPage.status === 200 && cPage.text.includes("Tienda no disponible"));
    const cLogin = await req("GET", tenantHost(slug), "/admin/login");
    check("admin login page -> /suspendida", cLogin.status === 307 && location(cLogin).endsWith("/suspendida"), [cLogin.status, location(cLogin)]);

    const syncActive = await provision({ ...createPayload, action: "sync", status: "active" });
    check("sync active reactivates", syncActive.status === 200 && syncActive.json.changed === true, syncActive);
    const syncSame = await provision({ ...createPayload, action: "sync", status: "active" });
    check("sync idempotent", syncSame.status === 200 && syncSame.json.changed === false, syncSame);
    const syncMissingSusp = await provision({ ...createPayload, orderId: `T-${run}-9`, slug: `otra-${run}`, action: "sync", status: "suspended" });
    check("sync suspended w/o tenant skipped", syncMissingSusp.json.skipped === true, syncMissingSusp);
    const syncMissingActive = await provision({ ...createPayload, orderId: `T-${run}-9`, slug: `otra-${run}`, action: "sync", status: "active" });
    check("sync active w/o tenant creates", syncMissingActive.status === 201 && syncMissingActive.json.created === true, syncMissingActive);
    await provision({ action: "cancel", orderId: `T-${run}-9` });

    await ctx.close();
    await ctx2.close();
  } finally {
    await browser.close();
  }

  console.log(failures ? `\n${failures} check(s) FAILED` : "\nall checks passed");
  process.exit(failures ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
