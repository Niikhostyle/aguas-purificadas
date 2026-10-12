import { Droplets, MessageCircle, Smartphone, Truck } from "lucide-react";

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
export function NeutralBenefits() {
  return (
    <section id="beneficios" className="bg-[var(--mist)] py-16">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <h2 className="rc-display text-center text-4xl uppercase text-[var(--brand-deep)] md:text-5xl">
          ¿Por qué elegirnos?
        </h2>
        <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {ITEMS.map(({ icon: Icon, title, body }) => (
            <li
              key={title}
              className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-[#e4eef4] transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className="flex size-12 items-center justify-center rounded-xl bg-[linear-gradient(135deg,var(--brand)_0%,var(--brand-deep)_100%)] text-white">
                <Icon className="size-6" aria-hidden />
              </span>
              <h3 className="rc-display mt-4 text-2xl uppercase text-[var(--brand-deep)]">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#5a6578]">{body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
