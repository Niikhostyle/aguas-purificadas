import { Droplets, MessageCircle, Smartphone, Truck } from "lucide-react";
import { Reveal } from "@/components/storefront/reveal";

const ITEMS = [
  {
    icon: Droplets,
    title: "Agua purificada",
    body: "Bidones y botellones listos para tu hogar u oficina.",
  },
  {
    icon: Truck,
    title: "Despacho a domicilio",
    body: "Coordinamos la entrega en tu comuna, sin que tengas que salir.",
  },
  {
    icon: Smartphone,
    title: "Pide en línea",
    body: "Arma tu pedido en minutos desde el celular o el computador.",
  },
  {
    icon: MessageCircle,
    title: "Atención directa",
    body: "Resolvemos tus dudas por teléfono o WhatsApp.",
  },
] as const;

/** Generic benefits for tenants without their own photos (no product claims, no third-party images). */
export function NeutralBenefits({ title }: { title?: string }) {
  return (
    <section
      id="beneficios"
      className="bg-[linear-gradient(180deg,var(--mist)_0%,#fff_100%)] py-16 md:py-20"
    >
      <Reveal className="mx-auto max-w-6xl px-4 md:px-6">
        <h2 className="sf-title rc-display text-center text-4xl uppercase text-[var(--brand-deep)] md:text-5xl">
          {title || "¿Por qué elegirnos?"}
        </h2>
        <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {ITEMS.map(({ icon: Icon, title, body }) => (
            <li key={title} className="sf-card sf-card-hover group p-6">
              <span className="flex size-12 items-center justify-center rounded-xl bg-[linear-gradient(135deg,var(--brand)_0%,var(--brand-deep)_100%)] text-white shadow-[0_8px_18px_-8px_var(--brand)] ring-4 ring-[var(--mist)] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-rotate-6 group-hover:scale-105">
                <Icon className="size-6" aria-hidden />
              </span>
              <h3 className="rc-display mt-5 text-2xl uppercase text-[var(--brand-deep)]">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#5a6578]">{body}</p>
            </li>
          ))}
        </ul>
      </Reveal>
    </section>
  );
}
