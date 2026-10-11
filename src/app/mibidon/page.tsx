import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { HeroVisual, MiniBottle } from "@/components/mibidon/hero-visual";
import { LandingEffects } from "@/components/mibidon/landing-effects";
import { whatsappHref } from "@/lib/whatsapp";

const HEADLINE = "Hidratación de Primera, Directo a tu Puerta en Cauquenes";

const delay = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

function TrustIcon({ children }: { children: ReactNode }) {
  return (
    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {children}
      </svg>
    </span>
  );
}

const TRUST_ICONS: Record<string, ReactNode> = {
  sanitaria: (
    <>
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  despacho: (
    <>
      <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
      <path d="M15 18H9" />
      <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" />
      <circle cx="17" cy="18" r="2" />
      <circle cx="7" cy="18" r="2" />
    </>
  ),
  pago: (
    <>
      <rect width="20" height="14" x="2" y="5" rx="2" />
      <path d="M2 10h20" />
    </>
  ),
};

const STATS = [
  { value: 20, suffix: "L", label: "Por bidón, sellado y listo para beber" },
  { value: 3, suffix: "", label: "Formatos: recarga, envase nuevo y packs" },
  { value: 100, suffix: "%", label: "Agua purificada bajo normativa" },
] as const;

const PRODUCTS = [
  {
    id: "recarga",
    name: "Recarga 20L",
    price: "$2.500",
    blurb: "Llena tu bidón en casa. Agua purificada lista para beber.",
    bottles: [24],
    message:
      "Hola MiBidón, quiero pedir una Recarga 20L a domicilio en Cauquenes.",
  },
  {
    id: "envase",
    name: "Envase Nuevo",
    price: "$8.990",
    blurb: "Bidón nuevo + primera carga. Ideal si estás partiendo.",
    bottles: [8],
    message:
      "Hola MiBidón, quiero un Envase Nuevo 20L con primera carga en Cauquenes.",
  },
  {
    id: "packs",
    name: "Packs",
    price: "$14.990",
    blurb: "Pack familiar de recargas. Ahorra y mantén el stock en casa.",
    bottles: [14, 6, 14],
    message:
      "Hola MiBidón, quiero información de Packs de agua a domicilio en Cauquenes.",
  },
] as const;

const TRUST = [
  {
    icon: "sanitaria",
    title: "Resolución Sanitaria",
    body: "Agua tratada bajo normativa vigente.",
  },
  {
    icon: "despacho",
    title: "Despacho Rápido",
    body: "Entrega a domicilio en Cauquenes.",
  },
  {
    icon: "pago",
    title: "Pago Electrónico",
    body: "Transferencia o medios digitales.",
  },
] as const;

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

export default function MiBidonLandingPage() {
  const waOrder = whatsappHref(
    "Hola MiBidón, quiero hacer un pedido de agua a domicilio en Cauquenes.",
  );
  const waHero = whatsappHref(
    "Hola MiBidón, quiero pedir agua purificada a domicilio en Cauquenes.",
  );

  return (
    <>
      <LandingEffects />

      <header
        data-nav
        className="mb-nav fixed inset-x-0 top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur-md"
      >
        <div className="mb-nav-inner mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5 md:px-8">
          <Link href="/" className="group flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-sm font-extrabold text-white shadow-md shadow-blue-600/25 transition-transform duration-500 group-hover:rotate-[-6deg] group-hover:scale-105">
              MB
            </span>
            <span className="text-lg font-extrabold tracking-tight text-slate-900">
              MiBidón
            </span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-semibold text-slate-600 md:flex">
            <a href="#productos" className="transition-colors hover:text-slate-900">
              Productos
            </a>
            <a href="#nosotros" className="transition-colors hover:text-slate-900">
              Nosotros
            </a>
          </nav>
          <a
            href={waOrder}
            className="mb-shine inline-flex min-h-10 items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-700 active:scale-[0.98]"
          >
            Hacer Pedido
          </a>
        </div>
        <div
          data-progress
          className="mb-progress absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-blue-400 via-blue-600 to-blue-700"
          aria-hidden="true"
        />
      </header>

      <main className="overflow-x-clip bg-slate-50 pt-16">
        {/* Hero */}
        <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 md:grid-cols-2 md:gap-14 md:px-8 md:py-24">
          <div className="flex flex-col gap-6">
            <p
              className="mb-enter inline-flex w-fit items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-blue-700 ring-1 ring-blue-100"
              style={delay(0)}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
              MiBidón · Cauquenes
            </p>
            <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight text-slate-900 sm:text-5xl lg:text-[3.25rem]">
              {HEADLINE.split(" ").map((word, i, words) => (
                <span key={i}>
                  <span
                    className={`mb-word ${word === "Cauquenes" ? "text-blue-600" : ""}`}
                    style={{ "--i": i } as CSSProperties}
                  >
                    {word}
                  </span>
                  {i < words.length - 1 ? " " : null}
                </span>
              ))}
            </h1>
            <p
              className="mb-enter max-w-xl text-lg font-medium leading-relaxed text-slate-600"
              style={delay(650)}
            >
              Agua purificada para tu hogar o negocio. Pedí por WhatsApp y
              recibe en la puerta, sin vueltas.
            </p>
            <div
              className="mb-enter flex flex-col gap-3 pt-1 sm:flex-row sm:items-center"
              style={delay(800)}
            >
              <a
                href={waHero}
                className="mb-shine mb-shine-auto inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-base font-bold text-white shadow-lg shadow-blue-600/25 transition hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-600/30 active:scale-[0.98]"
              >
                <WhatsAppIcon className="h-5 w-5" />
                Pedir por WhatsApp
              </a>
              <a
                href="#productos"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-transparent px-6 py-3 text-base font-bold text-slate-900 transition hover:border-slate-400 hover:bg-white"
              >
                Ver Productos
                <span className="mb-arrow" aria-hidden="true">
                  →
                </span>
              </a>
            </div>
            <p
              className="mb-enter flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-semibold text-slate-500"
              style={delay(950)}
            >
              <span>✓ Despacho a domicilio</span>
              <span>✓ Pago electrónico</span>
              <span>✓ Resolución sanitaria</span>
            </p>
          </div>

          <HeroVisual />
        </section>

        {/* Trust strip */}
        <section className="border-y border-slate-200 bg-white/70">
          <div className="mx-auto grid max-w-6xl gap-6 px-5 py-10 md:grid-cols-3 md:gap-8 md:px-8 md:py-12">
            {TRUST.map((item, i) => (
              <div
                key={item.title}
                data-reveal
                style={delay(i * 120)}
                className="flex items-center gap-4"
              >
                <TrustIcon>{TRUST_ICONS[item.icon]}</TrustIcon>
                <div className="flex flex-col gap-0.5">
                  <h2 className="text-base font-extrabold text-slate-900">
                    {item.title}
                  </h2>
                  <p className="text-sm font-medium text-slate-600">{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Products bento */}
        <section id="productos" className="mx-auto max-w-6xl px-5 py-20 md:px-8 md:py-24">
          <div data-reveal className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
              Productos
            </h2>
            <p className="mt-3 text-base font-medium text-slate-600">
              Elige tu opción y confirma el pedido por WhatsApp en minutos.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3 md:gap-8">
            {PRODUCTS.map((product, i) => (
              <div key={product.id} data-reveal style={delay(i * 120)}>
                <article
                  data-spotlight
                  className="mb-card group flex h-full flex-col gap-5 rounded-3xl bg-white p-7 shadow-lg shadow-slate-200/50"
                >
                  <div className="relative flex h-36 items-end justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 to-white pb-5">
                    {product.bottles.map((off, j) => (
                      <MiniBottle
                        key={j}
                        id={`mb-mini-${product.id}-${j}`}
                        fillOffset={off}
                        className={product.bottles.length > 1 ? "h-20 w-auto" : "h-24 w-auto"}
                      />
                    ))}
                  </div>
                  <div className="flex flex-1 flex-col gap-2">
                    <h3 className="text-xl font-extrabold text-slate-900">
                      {product.name}
                    </h3>
                    <p className="text-sm font-medium leading-relaxed text-slate-600">
                      {product.blurb}
                    </p>
                    <p className="pt-2 text-3xl font-extrabold tracking-tight text-blue-600">
                      {product.price}
                    </p>
                  </div>
                  <a
                    href={whatsappHref(product.message)}
                    className="mb-shine inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700 active:scale-[0.98]"
                  >
                    Pedir por WhatsApp
                    <span className="mb-arrow" aria-hidden="true">
                      →
                    </span>
                  </a>
                </article>
              </div>
            ))}
          </div>
        </section>

        {/* Nosotros */}
        <section
          id="nosotros"
          className="border-t border-slate-200 bg-white/60 px-5 py-24 md:px-8"
        >
          <div data-reveal className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-bold uppercase tracking-wider text-blue-600">
              Nosotros
            </p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
              Tomarla es Vida
            </h2>
            <p className="mt-5 text-lg font-medium leading-relaxed text-slate-600">
              En MiBidón llevamos agua purificada a hogares y negocios de
              Cauquenes. Calidad, puntualidad y un pedido simple por WhatsApp.
            </p>
          </div>
          <div className="mx-auto mt-14 grid max-w-4xl gap-5 sm:grid-cols-3">
            {STATS.map((stat, i) => (
              <div
                key={stat.label}
                data-reveal
                style={delay(i * 120)}
                className="rounded-3xl bg-white p-6 text-center shadow-lg shadow-slate-200/50 transition-transform duration-500 hover:-translate-y-1"
              >
                <p className="text-4xl font-extrabold tracking-tight text-blue-600 tabular-nums">
                  <span data-count={stat.value}>{stat.value}</span>
                  {stat.suffix}
                </p>
                <p className="mt-2 text-sm font-medium text-slate-600">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        <footer className="border-t border-slate-200 bg-slate-50 px-5 py-10 text-center md:px-8">
          <p className="text-sm font-extrabold text-slate-900">MiBidón</p>
          <p className="mt-1 text-sm font-medium text-slate-600">
            Agua purificada a domicilio · Cauquenes
          </p>
        </footer>
      </main>

      {/* FAB WhatsApp */}
      <div data-fab className="mb-fab fixed bottom-6 right-6 z-50 flex items-center gap-3">
        <span className="mb-fab-tip whitespace-nowrap rounded-xl bg-slate-900 px-3.5 py-2 text-sm font-semibold text-white shadow-xl">
          ¿Pedimos tu agua?
        </span>
        <a
          href={waOrder}
          aria-label="Pedir por WhatsApp"
          className="mb-fab-btn relative flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white shadow-2xl shadow-green-600/40 hover:bg-green-600"
        >
          <span className="mb-fab-ring" aria-hidden="true" />
          <span className="mb-fab-ring" aria-hidden="true" />
          <WhatsAppIcon className="relative h-7 w-7" />
        </a>
      </div>
    </>
  );
}
