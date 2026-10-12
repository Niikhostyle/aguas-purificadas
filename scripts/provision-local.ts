/**
 * Dev-only: provision one tenant through /api/platform/provision exactly like FOSSBilling does.
 *
 *   npx tsx scripts/provision-local.ts "Jimena Leiva" jimena-leiva [127.0.0.1:43128]
 */
import "dotenv/config";
import { request as httpRequest } from "node:http";
import { randomBytes } from "node:crypto";
import { signProvisionBody } from "../src/lib/provision-signature";

const [companyName, slug, base = "127.0.0.1:43128"] = process.argv.slice(2);
if (!companyName || !slug) {
  console.error('Uso: npx tsx scripts/provision-local.ts "Nombre Empresa" slug [host:puerto]');
  process.exit(1);
}
const [host, port] = base.split(":");
const secret = process.env.PLATFORM_PROVISION_SECRET || "";

const body = JSON.stringify({
  action: "create",
  orderId: `LOCAL-${randomBytes(3).toString("hex")}`,
  clientId: "1",
  companyName,
  slug,
  ownerName: companyName,
  ownerEmail: `${slug}@example.com`,
  plan: "plan-mibidon",
});
const ts = String(Math.floor(Date.now() / 1000));

const req = httpRequest(
  {
    host,
    port: Number(port),
    method: "POST",
    path: "/api/platform/provision",
    headers: {
      host: `localhost:${port}`,
      "content-type": "application/json",
      "x-mibidon-timestamp": ts,
      "x-mibidon-signature": signProvisionBody(secret, ts, body),
    },
  },
  (res) => {
    let text = "";
    res.setEncoding("utf8");
    res.on("data", (c) => (text += c));
    res.on("end", () => {
      console.log(res.statusCode, text);
      process.exit(res.statusCode && res.statusCode < 300 ? 0 : 1);
    });
  },
);
req.on("error", (e) => {
  console.error(e);
  process.exit(1);
});
req.write(body);
req.end();
