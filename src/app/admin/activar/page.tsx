import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { findValidInvite } from "@/lib/admin-invite";
import { platformUrl } from "@/lib/platform-url";
import { getTenantSlugFromHeaders } from "@/lib/tenant";
import { ActivateForm } from "./activate-form";

export const metadata: Metadata = {
  title: "Activar cuenta",
  robots: { index: false },
  referrer: "no-referrer",
};

export default async function ActivateAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token = "" } = await searchParams;
  const invite = await findValidInvite(token);
  const hostSlug = await getTenantSlugFromHeaders();

  // The session cookie must be minted on the store's own subdomain.
  if (invite && invite.adminUser.tenant.slug !== hostSlug) {
    redirect(
      platformUrl(`/admin/activar?token=${encodeURIComponent(token)}`, invite.adminUser.tenant.slug),
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(160deg,#e8f7fc_0%,#f7fbfd_50%,#d5e3ec_100%)] px-5">
      <div className="w-full max-w-md">
        <p className="font-[family-name:var(--font-display)] text-3xl text-[var(--brand-deep)]">
          Activa tu tienda
        </p>
        {invite ? (
          <>
            <p className="mt-2 text-sm text-[#5a6578]">
              Crea la contraseña del panel de <strong>{invite.adminUser.tenant.name}</strong>. Usuario:{" "}
              <strong>{invite.adminUser.email}</strong>
            </p>
            <ActivateForm token={token} email={invite.adminUser.email} />
          </>
        ) : (
          <div className="mt-6 rounded-lg border border-[#d5e3ec] bg-white p-6 text-sm text-[#5a6578] shadow-sm">
            <p>Este enlace de activación no es válido, ya fue usado o expiró.</p>
            <p className="mt-3">
              Puedes generar uno nuevo desde tu cuenta en{" "}
              <a className="text-[var(--brand)] hover:underline" href="https://billing.mibidon.cl">
                billing.mibidon.cl
              </a>{" "}
              o{" "}
              <Link className="text-[var(--brand)] hover:underline" href="/admin/login">
                ingresar con tu contraseña
              </Link>
              .
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
