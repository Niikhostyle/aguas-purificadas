import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminSession, isSuperAdmin } from "@/lib/auth";
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
  const tenantSlug = (tenantQuery || headerSlug || "rio-claro").toLowerCase();
  const isPlatform = tenantSlug === "plataforma";

  return (
    <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(160deg,#e8f4f1_0%,#f3f7f6_50%,#dce8e4_100%)] px-5">
      <div className="w-full max-w-md">
        <p className="font-[family-name:var(--font-display)] text-3xl text-[var(--brand-deep)]">
          {isPlatform ? "Panel plataforma" : "Panel empresa"}
        </p>
        <p className="mt-2 text-sm text-[#4a655f]">
          {isPlatform
            ? "Super-admin: gestiona el alta de empresas."
            : "Ingresá con el admin de la empresa (slug del tenant)."}
        </p>

        <form
          action={loginAction}
          className="mt-8 space-y-4 rounded-lg border border-[#c5d8d2] bg-white p-6 shadow-sm"
        >
          <div className="space-y-2">
            <Label htmlFor="tenantSlug">Slug empresa</Label>
            <Input
              id="tenantSlug"
              name="tenantSlug"
              required
              defaultValue={tenantSlug}
              placeholder="rio-claro"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Correo</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              defaultValue={
                isPlatform ? "super@plataforma.demo" : "admin@rio-claro.demo"
              }
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
              defaultValue="admin123"
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

        <p className="mt-6 text-center text-sm text-[#4a655f]">
          <Link
            href={isPlatform ? "/admin/login?tenant=rio-claro" : "/admin/login?tenant=plataforma"}
            className="text-[var(--brand)] hover:underline"
          >
            {isPlatform ? "Login empresa demo" : "Login super-admin"}
          </Link>
          {" · "}
          <Link href="/" className="text-[var(--brand)] hover:underline">
            Tienda
          </Link>
        </p>
      </div>
    </div>
  );
}
