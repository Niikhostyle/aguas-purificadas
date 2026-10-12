import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { platformUrl } from "@/lib/platform-url";
import { getTenantSlugFromHeaders } from "@/lib/tenant";
import { goToTenantLoginAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const metadata: Metadata = { title: "Ingresar a mi tienda · MiBidón" };

const BILLING_URL = "https://billing.mibidon.cl";

export default async function TenantLoginHelperPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await getTenantSlugFromHeaders()) redirect("/admin/login");
  const { error } = await searchParams;
  const example = platformUrl("/", "tutienda").replace(/^https?:\/\//, "").replace(/\/$/, "");

  return (
    <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(160deg,#e8f7fc_0%,#f7fbfd_50%,#d5e3ec_100%)] px-5">
      <div className="w-full max-w-md">
        <p className="font-[family-name:var(--font-display)] text-3xl text-[var(--brand-deep)]">
          Ingresar a mi tienda
        </p>
        <p className="mt-2 text-sm text-[#5a6578]">
          Escribe el subdominio de tu tienda (ej. <code>{example}</code>) y te llevamos a su panel.
        </p>
        <form
          action={goToTenantLoginAction}
          className="mt-8 space-y-4 rounded-lg border border-[#d5e3ec] bg-white p-6 shadow-sm"
        >
          <div className="space-y-2">
            <Label htmlFor="store">Subdominio de tu tienda</Label>
            <Input id="store" name="store" required placeholder="tutienda" autoComplete="off" />
          </div>
          {error ? (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          ) : null}
          <Button type="submit" className="w-full">
            Continuar
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-[#5a6578]">
          <a href={BILLING_URL} className="text-[var(--brand)] hover:underline">
            Facturación y plan
          </a>
          {" · "}
          <Link href="/admin/login?tenant=plataforma" className="text-[var(--brand)] hover:underline">
            Equipo MiBidón
          </Link>
          {" · "}
          <Link href="/" className="text-[var(--brand)] hover:underline">
            Inicio
          </Link>
        </p>
      </div>
    </div>
  );
}
