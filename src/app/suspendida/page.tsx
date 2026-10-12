import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { platformUrl } from "@/lib/platform-url";
import { getInactiveHostTenant } from "@/lib/tenant";

export const metadata: Metadata = {
  title: "Cuenta suspendida",
  robots: { index: false },
};

const BILLING_URL = "https://billing.mibidon.cl";

export default async function SuspendedPage() {
  const tenant = await getInactiveHostTenant();
  if (!tenant) redirect("/");

  const canceled = tenant.billingStatus === "canceled";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#f7fbfd] px-5 text-center">
      <p className="text-sm font-semibold uppercase tracking-wider text-[#5a6578]">{tenant.name}</p>
      <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl text-[#12326e]">
        {canceled ? "Tienda no disponible" : "Cuenta suspendida"}
      </h1>
      <p className="mt-3 max-w-md text-[#5a6578]">
        {canceled
          ? "Esta tienda online fue dada de baja. Si eres el dueño y quieres reactivarla, contáctanos desde tu cuenta de facturación."
          : "Esta tienda está temporalmente fuera de servicio. Si eres el dueño, regulariza el pago de tu plan MiBidón y se reactivará automáticamente."}
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <a
          href={BILLING_URL}
          className="rounded-md bg-[#00B1E2] px-5 py-2.5 text-sm font-semibold text-white"
        >
          Ir a mi cuenta de facturación
        </a>
        <a
          href={platformUrl("/")}
          className="rounded-md border border-[#d5e3ec] bg-white px-5 py-2.5 text-sm font-semibold text-[#12326e]"
        >
          Conocer MiBidón
        </a>
      </div>
    </div>
  );
}
