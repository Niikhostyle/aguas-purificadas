import Link from "next/link";
import { redirect } from "next/navigation";
import {
  DEMO_TENANT_SLUG,
  getAdminSession,
  isDemoTenantSlug,
  isSuperAdmin,
} from "@/lib/auth";
import { getTenantSlugFromHeaders } from "@/lib/tenant";
import { loginAction } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; tenant?: string }>;
}) {
  const session = await getAdminSession();
  if (session) {
    redirect(isSuperAdmin(session) ? "/admin/plataforma" : "/admin");
  }

  const { error, tenant: tenantQuery } = await searchParams;
  const headerSlug = await getTenantSlugFromHeaders();
  const tenantSlug = (tenantQuery || headerSlug || DEMO_TENANT_SLUG).toLowerCase();
  const isPlatform = tenantSlug === "plataforma";

  const wantsDemo =
    isDemoTenantSlug(tenantSlug) || isDemoTenantSlug(headerSlug);

  // Public demo: skip credentials entirely (unless demo-access already failed)
  if (!error && wantsDemo) {
    redirect("/admin/demo-access");
  }

  if (error && wantsDemo) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(160deg,#e8f7fc_0%,#f7fbfd_50%,#d5e3ec_100%)] px-5">
        <div className="w-full max-w-md">
          <p className="font-[family-name:var(--font-display)] text-3xl text-[var(--brand-deep)]">
            Demo
          </p>
          <p className="mt-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
          <p className="mt-6 text-center text-sm text-[#5a6578]">
            <Link href="/" className="text-[var(--brand)] hover:underline">
              Volver a la tienda demo
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(160deg,#e8f7fc_0%,#f7fbfd_50%,#d5e3ec_100%)] px-5">
      <div className="w-full max-w-md">
        <p className="font-[family-name:var(--font-display)] text-3xl text-[var(--brand-deep)]">
          {isPlatform ? "Panel MiBidón" : "Panel empresa"}
        </p>
        <p className="mt-2 text-sm text-[#5a6578]">
          {isPlatform
            ? "Super-admin: gestioná empresas y sus administradores."
            : "Ingresá con el admin de la empresa (slug del tenant)."}
        </p>

        <form
          action={loginAction}
          className="mt-8 space-y-4 rounded-lg border border-[#d5e3ec] bg-white p-6 shadow-sm"
        >
          {isPlatform ? (
            <>
              <input type="hidden" name="loginMode" value="platform" />
              <input type="hidden" name="tenantSlug" value="plataforma" />
            </>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="tenantSlug">Slug empresa</Label>
              <Input
                id="tenantSlug"
                name="tenantSlug"
                required
                defaultValue={tenantSlug}
                placeholder="mi-empresa"
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Correo</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="username"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
            />
          </div>
          {error ? (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          ) : null}
          <Button type="submit" className="w-full">
            Entrar
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-[#5a6578]">
          <Link
            href="/admin/demo-access"
            className="text-[var(--brand)] hover:underline"
          >
            Abrir demo (sin login)
          </Link>
          {" · "}
          <Link
            href={
              isPlatform
                ? "/admin/login?tenant=demo"
                : "/admin/login?tenant=plataforma"
            }
            className="text-[var(--brand)] hover:underline"
          >
            {isPlatform ? "Login empresa" : "Login MiBidón (super-admin)"}
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
