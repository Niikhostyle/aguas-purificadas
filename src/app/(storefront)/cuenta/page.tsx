import Link from "next/link";
import { redirect } from "next/navigation";
import {
  customerLoginAction,
  customerLogoutAction,
  customerRegisterAction,
} from "@/app/(storefront)/cuenta/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isDemoTenantSlug } from "@/lib/auth";
import { getCustomerSession } from "@/lib/customer-auth";
import { parseModuleFlags } from "@/lib/modules";
import { requireTenant } from "@/lib/tenant";

export default async function CuentaPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const tenant = await requireTenant();
  const flags = parseModuleFlags(tenant.modulesEnabled);
  if (!flags.loginClientes) redirect("/");

  const customer = await getCustomerSession(tenant.id);
  const { ok, error } = await searchParams;
  const isDemo = isDemoTenantSlug(tenant.slug);

  // Public demo: skip credentials entirely (unless demo-access already failed)
  if (!customer && isDemo && !error) {
    redirect("/cuenta/demo-access");
  }

  if (!customer && isDemo && error) {
    return (
      <div className="mx-auto max-w-lg px-4 py-12 md:px-6">
        <h1 className="rc-display text-4xl uppercase text-[var(--brand-deep)]">
          Área clientes
        </h1>
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
        <p className="mt-6 text-sm text-[#5a6578]">
          <Link
            href="/cuenta/demo-access"
            className="text-[var(--brand)] hover:underline"
          >
            Reintentar acceso demo
          </Link>
          {" · "}
          <Link href="/" className="text-[var(--brand)] hover:underline">
            Volver a la tienda
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-12 md:px-6">
      <h1 className="rc-display text-4xl uppercase text-[var(--brand-deep)]">
        Área clientes
      </h1>
      <p className="mt-2 text-sm text-[#5a6578]">
        {isDemo
          ? "En la demo entrá sin registro. El checkout con cuenta sigue siendo opcional."
          : "Registrate o iniciá sesión para guardar tu perfil. El checkout con cuenta es opcional."}
      </p>

      {ok ? (
        <p className="mt-4 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          Sesión lista.
        </p>
      ) : null}
      {error ? (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {customer ? (
        <div className="mt-8 rounded-2xl border border-[#d5e3ec] bg-white p-6">
          <p className="text-sm text-[#5a6578]">Conectado como</p>
          <p className="mt-1 text-lg font-bold text-[var(--brand-deep)]">
            {customer.name}
          </p>
          <p className="text-sm text-[#5a6578]">{customer.email}</p>
          {isDemo ? (
            <p className="mt-6 text-sm text-[#5a6578]">
              <Link href="/" className="text-[var(--brand)] hover:underline">
                Seguir comprando en la demo
              </Link>
            </p>
          ) : (
            <form action={customerLogoutAction} className="mt-6">
              <Button type="submit" variant="outline">
                Cerrar sesión
              </Button>
            </form>
          )}
        </div>
      ) : (
        <div className="mt-8 grid gap-8">
          <form
            action={customerLoginAction}
            className="space-y-4 rounded-2xl border border-[#d5e3ec] bg-white p-6"
          >
            <h2 className="font-bold uppercase text-[var(--brand-deep)]">
              Ingresar
            </h2>
            <div className="space-y-2">
              <Label htmlFor="login-email">Email</Label>
              <Input id="login-email" name="email" type="email" required autoComplete="email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="login-password">Contraseña</Label>
              <Input
                id="login-password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                minLength={8}
              />
            </div>
            <Button type="submit" className="w-full bg-[var(--brand)]">
              Entrar
            </Button>
          </form>

          <form
            action={customerRegisterAction}
            className="space-y-4 rounded-2xl border border-[#d5e3ec] bg-[#f7fbfd] p-6"
          >
            <h2 className="font-bold uppercase text-[var(--brand-deep)]">
              Crear cuenta
            </h2>
            <div className="space-y-2">
              <Label htmlFor="reg-name">Nombre</Label>
              <Input id="reg-name" name="name" required autoComplete="name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-email">Email</Label>
              <Input id="reg-email" name="email" type="email" required autoComplete="email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-phone">Teléfono (opcional)</Label>
              <Input id="reg-phone" name="phone" autoComplete="tel" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-password">Contraseña (mín. 8)</Label>
              <Input
                id="reg-password"
                name="password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>
            <Button type="submit" variant="outline" className="w-full">
              Registrarme
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
