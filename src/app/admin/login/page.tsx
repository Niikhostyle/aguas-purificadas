import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import { getTenantSlugFromHeaders } from "@/lib/tenant";
import { loginAction } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await getAdminSession();
  if (session) redirect("/admin");

  const { error } = await searchParams;
  const tenantSlug = (await getTenantSlugFromHeaders()) || "rio-claro";

  return (
    <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(160deg,#e8f4f1_0%,#f3f7f6_50%,#dce8e4_100%)] px-5">
      <div className="w-full max-w-md">
        <p className="font-[family-name:var(--font-display)] text-3xl text-[var(--brand-deep)]">
          Panel empresa
        </p>
        <p className="mt-2 text-sm text-[#4a655f]">
          Ingresá con las credenciales del tenant demo (
          <code className="rounded bg-white px-1">{tenantSlug}</code>).
        </p>

        <form
          action={loginAction}
          className="mt-8 space-y-4 rounded-lg border border-[#c5d8d2] bg-white p-6 shadow-sm"
        >
          <input type="hidden" name="tenantSlug" value={tenantSlug} />
          <div className="space-y-2">
            <Label htmlFor="email">Correo</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              defaultValue="admin@rio-claro.demo"
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
          <Link href="/" className="text-[var(--brand)] hover:underline">
            ← Volver a la tienda
          </Link>
        </p>
      </div>
    </div>
  );
}
