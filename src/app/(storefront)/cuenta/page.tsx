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
      <div className="mx-auto max-w-lg px-4 py-12 md:px-6 md:py-16">
        <h1 className="sf-title sf-title-start rc-display text-4xl uppercase text-[var(--brand-deep)] md:text-5xl">
          Área clientes
        </h1>
        <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
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
    <div className="mx-auto max-w-lg px-4 py-12 md:px-6 md:py-16">
      <h1 className="sf-title sf-title-start rc-display text-4xl uppercase text-[var(--brand-deep)] md:text-5xl">
        Área clientes
      </h1>
      <p className="mt-4 text-sm text-[#5a6578]">
        {isDemo
          ? "En la demo entrá sin registro. El checkout con cuenta sigue siendo opcional."
          : "Registrate o iniciá sesión para guardar tu perfil. El checkout con cuenta es opcional."}
      </p>

      {ok ? (
        <p className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Sesión lista.
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {customer ? (
        <div className="sf-enter sf-card mt-8 p-6">
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
            className="sf-enter sf-card space-y-4 p-6"
          >
            <h2 className="font-bold uppercase text-[var(--brand-deep)]">
              Ingresar
            </h2>
            <div className="space-y-2">
              <Label htmlFor="login-email">Email</Label>
              <Input id="login-email" name="email" type="email" required autoComplete="email" className="h-11 bg-white px-3.5" />
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
            <Button type="submit" className="h-11 w-full font-bold uppercase tracking-wide">
              Entrar
            </Button>
          </form>

          <form
            action={customerRegisterAction}
            className="sf-enter sf-card space-y-4 bg-[linear-gradient(180deg,var(--mist)_0%,#fff_100%)] p-6 [animation-delay:100ms]"
          >
            <h2 className="font-bold uppercase text-[var(--brand-deep)]">
              Crear cuenta
            </h2>
            <div className="space-y-2">
              <Label htmlFor="reg-name">Nombre</Label>
              <Input id="reg-name" name="name" required autoComplete="name" className="h-11 bg-white px-3.5" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-email">Email</Label>
              <Input id="reg-email" name="email" type="email" required autoComplete="email" className="h-11 bg-white px-3.5" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-phone">Teléfono (opcional)</Label>
              <Input id="reg-phone" name="phone" autoComplete="tel" className="h-11 bg-white px-3.5" />
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
            <Button type="submit" variant="outline" className="h-11 w-full font-bold uppercase tracking-wide">
              Registrarme
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
