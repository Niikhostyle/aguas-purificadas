import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "MiBidón · Tienda online para empresas de agua",
  description:
    "Plataforma white-label con carrito, WebPay y panel multi-empresa. Tu marca, tu subdominio, tus clientes.",
};

const DEMO_HREF = "https://demo.mibidon.cl";
const CONTACT_HREF =
  "mailto:hola@mibidon.cl?subject=Solicitar%20demo%20MiBidón";
const ADMIN_HREF = "/admin/login?tenant=plataforma";

const services = [
  {
    title: "Tienda con tu marca",
    body: "Colores, logo y textos de tu empresa. El cliente compra sintiendo que está en tu sitio.",
  },
  {
    title: "Subdominio listo",
    body: "cliente.mibidon.cl desde el primer día. Dominio propio como plus cuando lo necesites.",
  },
  {
    title: "Catálogo y precios",
    body: "Botellones, dispensadores y accesorios con fotos, stock activo y orden a tu medida.",
  },
  {
    title: "Carrito y zonas",
    body: "Checkout con comunas de despacho y costo de envío — pensado para agua a domicilio.",
  },
  {
    title: "WebPay",
    body: "Cobro online con Transbank (sandbox o producción). También mock para pruebas internas.",
  },
  {
    title: "Panel empresa",
    body: "Pedidos, productos y marca editables por tu equipo, sin depender de un desarrollador.",
  },
  {
    title: "Multi-empresa",
    body: "Un hosting, N tiendas aisladas. Ideal si operás varias marcas o franquicias de agua.",
  },
  {
    title: "Super-admin MiBidón",
    body: "Alta de empresas, admins y supervisión centralizada desde un solo panel.",
  },
];

const steps = [
  {
    n: "01",
    title: "Alta de tu empresa",
    body: "Creamos tu tenant, subdominio y acceso de admin en minutos.",
  },
  {
    n: "02",
    title: "Cargás catálogo y marca",
    body: "Subís productos, zonas de despacho y la identidad visual de tu flota.",
  },
  {
    n: "03",
    title: "Vendés online",
    body: "Tus clientes piden y pagan. Vos gestionás pedidos desde el panel.",
  },
];

export default function MiBidonLandingPage() {
  return (
    <>
      {/* —— Header (VAO-like nav) —— */}
      <header className="sticky top-0 z-40 border-b border-[#d5e3ec]/80 bg-[#f7fbfd]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 md:px-8">
          <a
            href="/"
            className="text-2xl tracking-tight text-[#12326e] md:text-[1.75rem]"
            style={{ fontFamily: "var(--font-mb-display), 'Archivo Black', sans-serif" }}
          >
            MiBidón
          </a>
          <nav className="flex items-center gap-3 text-sm font-semibold text-[#12326e] sm:gap-5">
            <a href="#servicios" className="hidden hover:text-[#00b1e2] sm:inline">
              Qué incluye
            </a>
            <a href="#como" className="hidden hover:text-[#00b1e2] md:inline">
              Cómo funciona
            </a>
            <Link href={ADMIN_HREF} className="hover:text-[#00b1e2]">
              Acceso
            </Link>
            <a
              href={DEMO_HREF}
              className="rounded-md bg-[#00b1e2] px-3.5 py-2 text-white transition hover:bg-[#0099c7]"
            >
              Ver demo
            </a>
          </nav>
        </div>
      </header>

      {/* —— 1. Main banner / hero —— */}
      <section className="relative min-h-[88vh] overflow-hidden">
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/rio-claro/hero.jpg"
            alt=""
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(18,50,110,0.93)_0%,rgba(0,177,226,0.5)_52%,rgba(18,50,110,0.4)_100%)]" />
        </div>
        <div className="relative mx-auto flex min-h-[88vh] max-w-6xl flex-col justify-end px-5 pb-16 pt-28 md:justify-center md:px-8 md:pb-28">
          <p className="animate-fade-up text-xs font-bold uppercase tracking-[0.22em] text-white/80">
            Ecommerce · Agua a domicilio · White-label
          </p>
          <h1
            className="animate-fade-up mt-4 max-w-3xl text-4xl leading-[1.05] tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl [animation-delay:60ms]"
            style={{ fontFamily: "var(--font-mb-display), 'Archivo Black', sans-serif" }}
          >
            En un mercado saturado, tu marca de agua necesita su propia tienda
          </h1>
          <p className="animate-fade-up mt-5 max-w-xl text-lg text-white/85 md:text-xl [animation-delay:120ms]">
            MiBidón es la plataforma white-label para vender botellones online:
            catálogo, carrito, WebPay y panel — con tu identidad.
          </p>
          <div className="animate-fade-up mt-9 flex flex-wrap gap-3 [animation-delay:180ms]">
            <a
              href={DEMO_HREF}
              className="inline-flex items-center rounded-md bg-white px-6 py-3.5 text-sm font-bold uppercase tracking-wide text-[#12326e] transition hover:bg-[#e8f7fc]"
            >
              Ver demo
            </a>
            <a
              href={CONTACT_HREF}
              className="inline-flex items-center rounded-md border border-white/70 bg-white/10 px-6 py-3.5 text-sm font-bold uppercase tracking-wide text-white backdrop-blur-sm transition hover:bg-white/20"
            >
              Solicitar demo
            </a>
          </div>
        </div>
      </section>

      {/* —— 2. Mid CTA strip (VAO “¿Estás listo…”) —— */}
      <section className="bg-[#12326e] text-white">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-5 py-14 md:flex-row md:items-center md:px-8 md:py-16">
          <div className="max-w-2xl">
            <h2
              className="text-3xl leading-tight tracking-tight md:text-4xl"
              style={{ fontFamily: "var(--font-mb-display), 'Archivo Black', sans-serif" }}
            >
              ¿Listo para que tus clientes pidan agua en dos clics?
            </h2>
            <p className="mt-3 text-white/75">
              No bajes la meta: subí el canal. Probá la demo en vivo y pedí tu
              espacio MiBidón.
            </p>
          </div>
          <a
            href={DEMO_HREF}
            className="shrink-0 rounded-md bg-[#00b1e2] px-6 py-3.5 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-[#33c1e8]"
          >
            Entrar a la demo
          </a>
        </div>
      </section>

      {/* —— 3. Services grid (VAO services-slide pattern, no client logos) —— */}
      <section id="servicios" className="bg-white">
        <div className="mx-auto max-w-6xl px-5 py-20 md:px-8 md:py-28">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#00b1e2]">
            Qué hace MiBidón
          </p>
          <h2
            className="mt-3 max-w-3xl text-3xl leading-tight tracking-tight text-[#12326e] md:text-5xl"
            style={{ fontFamily: "var(--font-mb-display), 'Archivo Black', sans-serif" }}
          >
            Una buena plataforma hace a tu marca de agua memorable e
            indispensable
          </h2>
          <p className="mt-4 max-w-2xl text-[#5a6578]">
            En MiBidón somos especialistas en ecommerce para agua purificada a
            domicilio. Esto es lo que incluye:
          </p>

          <ul className="mt-14 grid gap-0 sm:grid-cols-2 lg:grid-cols-4">
            {services.map((s, i) => (
              <li
                key={s.title}
                className="group border border-[#d5e3ec] bg-[#f7fbfd] p-6 transition hover:bg-[#e8f7fc] sm:-ml-px sm:-mt-px"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <span className="text-xs font-bold text-[#00b1e2]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3
                  className="mt-3 text-xl tracking-tight text-[#12326e]"
                  style={{
                    fontFamily: "var(--font-mb-display), 'Archivo Black', sans-serif",
                  }}
                >
                  {s.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[#5a6578]">
                  {s.body}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* —— 4. Banner cover / proof (no portfolio logos) —— */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/rio-claro/hero-2.jpg"
            alt=""
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-[#12326e]/88" />
        </div>
        <div className="relative mx-auto max-w-6xl px-5 py-20 md:px-8 md:py-28">
          <h2
            className="max-w-2xl text-3xl tracking-tight text-white md:text-5xl"
            style={{ fontFamily: "var(--font-mb-display), 'Archivo Black', sans-serif" }}
          >
            Hecho para flotas de botellones, no para tiendas genéricas
          </h2>
          <p className="mt-4 max-w-xl text-lg text-white/80">
            Multi-tenant, subdominios, zonas de despacho y WebPay. Un solo
            hosting; cada empresa vende con su marca.
          </p>
          <dl className="mt-12 grid gap-8 sm:grid-cols-3">
            {[
              { k: "N empresas", v: "Un solo servidor" },
              { k: "Subdominio", v: "cliente.mibidon.cl" },
              { k: "Pagos", v: "WebPay listo" },
            ].map((stat) => (
              <div key={stat.k} className="border-t border-white/25 pt-4">
                <dt
                  className="text-2xl text-white md:text-3xl"
                  style={{
                    fontFamily: "var(--font-mb-display), 'Archivo Black', sans-serif",
                  }}
                >
                  {stat.k}
                </dt>
                <dd className="mt-1 text-sm text-white/70">{stat.v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* —— 5. How it works —— */}
      <section id="como" className="bg-[#f7fbfd]">
        <div className="mx-auto max-w-6xl px-5 py-20 md:px-8 md:py-28">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#00b1e2]">
            Cómo funciona
          </p>
          <h2
            className="mt-3 text-3xl tracking-tight text-[#12326e] md:text-5xl"
            style={{ fontFamily: "var(--font-mb-display), 'Archivo Black', sans-serif" }}
          >
            Tres pasos para vender online
          </h2>
          <ol className="mt-14 grid gap-10 md:grid-cols-3">
            {steps.map((step) => (
              <li key={step.n} className="border-t-2 border-[#00b1e2] pt-6">
                <span
                  className="text-4xl text-[#00b1e2]"
                  style={{
                    fontFamily: "var(--font-mb-display), 'Archivo Black', sans-serif",
                  }}
                >
                  {step.n}
                </span>
                <h3
                  className="mt-3 text-2xl text-[#12326e]"
                  style={{
                    fontFamily: "var(--font-mb-display), 'Archivo Black', sans-serif",
                  }}
                >
                  {step.title}
                </h3>
                <p className="mt-2 text-[#5a6578]">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* —— 6. Demo showcase + CTA —— */}
      <section className="border-y border-[#d5e3ec] bg-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-20 md:grid-cols-2 md:items-center md:px-8 md:py-24">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#00b1e2]">
              Demo para prospectos
            </p>
            <h2
              className="mt-3 text-3xl tracking-tight text-[#12326e] md:text-5xl"
              style={{ fontFamily: "var(--font-mb-display), 'Archivo Black', sans-serif" }}
            >
              Mirá la tienda como la vería tu cliente
            </h2>
            <p className="mt-4 text-[#5a6578]">
              Demo pública con home, grilla, detalle, carrito y checkout. Entrá
              a{" "}
              <a href={DEMO_HREF} className="font-semibold text-[#00b1e2] hover:underline">
                demo.mibidon.cl
              </a>
              .
            </p>
            <a
              href={DEMO_HREF}
              className="mt-8 inline-flex rounded-md bg-[#00b1e2] px-6 py-3.5 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-[#0099c7]"
            >
              Abrir demo.mibidon.cl
            </a>
          </div>
          <a
            href={DEMO_HREF}
            className="group relative block overflow-hidden border border-[#d5e3ec] bg-[#f7fbfd] shadow-[0_24px_60px_-36px_rgba(18,50,110,0.5)]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/rio-claro/hero-2.jpg"
              alt="Vista previa de la tienda demo MiBidón"
              className="aspect-[4/3] w-full object-cover transition duration-700 group-hover:scale-[1.03]"
            />
            <span className="absolute bottom-4 left-4 rounded-md bg-[#12326e] px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-white">
              demo.mibidon.cl
            </span>
          </a>
        </div>
      </section>

      {/* —— 7. Final CTA banner —— */}
      <section className="bg-[#00b1e2]">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-5 py-16 md:flex-row md:items-center md:px-8 md:py-20">
          <div className="max-w-xl text-white">
            <h2
              className="text-3xl tracking-tight md:text-4xl"
              style={{ fontFamily: "var(--font-mb-display), 'Archivo Black', sans-serif" }}
            >
              Subamos el volumen de tus pedidos
            </h2>
            <p className="mt-3 text-white/90">
              Pedí una demo guiada o entrá al panel si ya sos partner MiBidón.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a
              href={CONTACT_HREF}
              className="rounded-md bg-[#12326e] px-6 py-3.5 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-[#0d2454]"
            >
              Solicitar demo
            </a>
            <Link
              href={ADMIN_HREF}
              className="rounded-md border border-white/80 px-6 py-3.5 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-white/15"
            >
              Panel plataforma
            </Link>
          </div>
        </div>
      </section>

      {/* —— Footer —— */}
      <footer className="bg-[#12326e] text-white/75">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-10 md:flex-row md:items-end md:justify-between md:px-8">
          <div>
            <p
              className="text-2xl text-white"
              style={{ fontFamily: "var(--font-mb-display), 'Archivo Black', sans-serif" }}
            >
              MiBidón
            </p>
            <p className="mt-2 max-w-sm text-sm">
              Plataforma white-label para empresas de agua purificada.
              Tiendas en{" "}
              <span className="text-white">cliente.mibidon.cl</span>.
            </p>
          </div>
          <div className="text-sm">
            <p>
              <a href={CONTACT_HREF} className="text-[#7fd4f0] hover:underline">
                hola@mibidon.cl
              </a>
            </p>
            <p className="mt-1">
              Demo:{" "}
              <a href={DEMO_HREF} className="text-[#7fd4f0] hover:underline">
                demo.mibidon.cl
              </a>
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
