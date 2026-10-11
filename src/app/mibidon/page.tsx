import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "MiBidón · Tienda online para empresas de agua",
  description:
    "Plataforma white-label con carrito, WebPay y panel multi-empresa. Tu marca, tu subdominio, tus clientes.",
};

const DEMO_HREF = "https://demo.mibidon.cl";
const DEMO_FALLBACK = "/?tenant=rio-claro";
const CONTACT_HREF = "mailto:hola@mibidon.cl?subject=Solicitar%20demo%20MiBidón";
const ADMIN_HREF = "/admin/login?tenant=plataforma";

const features = [
  {
    title: "Multi-empresa",
    body: "Cada cliente de agua opera su propia tienda, catálogo y pedidos, aislados por tenant.",
  },
  {
    title: "Subdominio listo",
    body: "cliente.mibidon.cl desde el día uno. Dominio propio del cliente como plus después.",
  },
  {
    title: "Carrito y despacho",
    body: "Checkout con zonas de entrega y totales claros, pensado para botellones a domicilio.",
  },
  {
    title: "WebPay",
    body: "Cobro con Transbank sandbox o mock para pruebas; listo para credenciales reales.",
  },
  {
    title: "Panel de marca",
    body: "Colores, logo, textos y productos editables por la empresa — sin tocar código.",
  },
  {
    title: "Super-admin MiBidón",
    body: "Alta de empresas, admins y supervisión desde un solo panel de plataforma.",
  },
];

export default function MiBidonLandingPage() {
  return (
    <div className="min-h-screen bg-[#f7fbfd] text-[#1d243f]">
      {/* Ambient water field */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_80%_60%_at_10%_0%,#00b1e233_0%,transparent_55%),radial-gradient(ellipse_70%_50%_at_90%_10%,#12326e22_0%,transparent_50%),linear-gradient(180deg,#e8f7fc_0%,#f7fbfd_45%,#ffffff_100%)]"
      />

      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 md:px-8">
        <p className="rc-display text-2xl font-semibold tracking-wide text-[#12326e] md:text-3xl">
          MiBidón
        </p>
        <nav className="flex items-center gap-4 text-sm font-medium text-[#12326e]">
          <a href="#como-funciona" className="hidden hover:text-[#00b1e2] sm:inline">
            Cómo funciona
          </a>
          <Link
            href={ADMIN_HREF}
            className="hover:text-[#00b1e2]"
          >
            Acceso empresas
          </Link>
          <a
            href={DEMO_HREF}
            className="rounded-md bg-[#00b1e2] px-3.5 py-2 text-white transition hover:bg-[#0099c7]"
          >
            Ver demo
          </a>
        </nav>
      </header>

      {/* Hero — one composition, brand first */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/rio-claro/hero.jpg"
            alt=""
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(18,50,110,0.92)_0%,rgba(0,177,226,0.55)_48%,rgba(18,50,110,0.35)_100%)]" />
        </div>

        <div className="relative mx-auto flex min-h-[88vh] max-w-6xl flex-col justify-end px-5 pb-16 pt-28 md:justify-center md:px-8 md:pb-24 md:pt-20">
          <p className="animate-fade-up rc-display text-6xl font-semibold leading-none tracking-wide text-white drop-shadow-sm sm:text-7xl md:text-8xl">
            MiBidón
          </p>
          <h1 className="animate-fade-up mt-5 max-w-xl text-2xl font-light leading-snug text-white/95 sm:text-3xl md:text-4xl [animation-delay:80ms]">
            Tu tienda de agua online, con tu marca
          </h1>
          <p className="animate-fade-up mt-4 max-w-lg text-base leading-relaxed text-white/85 md:text-lg [animation-delay:140ms]">
            Plataforma white-label para empresas de agua purificada: catálogo,
            carrito, WebPay y panel — en subdominio propio.
          </p>
          <div className="animate-fade-up mt-9 flex flex-wrap gap-3 [animation-delay:200ms]">
            <a
              href={DEMO_HREF}
              className="inline-flex items-center rounded-md bg-white px-6 py-3 text-sm font-bold uppercase tracking-wide text-[#12326e] transition hover:bg-[#e8f7fc]"
            >
              Ver demo
            </a>
            <a
              href={CONTACT_HREF}
              className="inline-flex items-center rounded-md border border-white/70 bg-white/10 px-6 py-3 text-sm font-bold uppercase tracking-wide text-white backdrop-blur-sm transition hover:bg-white/20"
            >
              Solicitar demo
            </a>
          </div>
          <p className="animate-fade-up mt-4 text-sm text-white/70 [animation-delay:260ms]">
            Demo en vivo:{" "}
            <a href={DEMO_HREF} className="underline decoration-white/40 underline-offset-2 hover:text-white">
              demo.mibidon.cl
            </a>
            <span className="mx-1.5 opacity-50">·</span>
            <Link href={DEMO_FALLBACK} className="underline decoration-white/40 underline-offset-2 hover:text-white">
              abrir con ?tenant=
            </Link>
          </p>
        </div>
      </section>

      <section
        id="como-funciona"
        className="mx-auto max-w-6xl px-5 py-20 md:px-8 md:py-28"
      >
        <p className="rc-display text-sm font-semibold uppercase tracking-[0.18em] text-[#00b1e2]">
          Para tu negocio
        </p>
        <h2 className="rc-display mt-2 text-4xl text-[#12326e] md:text-5xl">
          Todo lo que necesita una flota de botellones
        </h2>
        <p className="mt-3 max-w-2xl text-[#5a6578]">
          MiBidón hospeda N empresas en un solo servidor. Cada una vende con su
          identidad; vos operás la plataforma.
        </p>

        <ul className="mt-14 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <li
              key={f.title}
              className="animate-fade-up border-t border-[#d5e3ec] pt-5"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <h3 className="rc-display text-2xl text-[#12326e]">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#5a6578]">
                {f.body}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="border-y border-[#d5e3ec] bg-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-20 md:grid-cols-2 md:items-center md:px-8 md:py-24">
          <div>
            <p className="rc-display text-sm font-semibold uppercase tracking-[0.18em] text-[#00b1e2]">
              Demo para prospectos
            </p>
            <h2 className="rc-display mt-2 text-4xl text-[#12326e] md:text-5xl">
              Mirá la tienda como la vería tu cliente
            </h2>
            <p className="mt-4 text-[#5a6578]">
              Clon funcional al estilo aguasrioclaro.cl: home, grilla, detalle,
              carrito y checkout. Es el tenant de demostración Río Claro.
            </p>
            <a
              href={DEMO_HREF}
              className="mt-8 inline-flex rounded-md bg-[#00b1e2] px-6 py-3 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-[#0099c7]"
            >
              Entrar a la demo
            </a>
          </div>
          <a
            href={DEMO_HREF}
            className="group relative block overflow-hidden border border-[#d5e3ec] bg-[#f7fbfd] shadow-[0_20px_50px_-30px_rgba(18,50,110,0.45)] transition"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/rio-claro/hero-2.jpg"
              alt="Vista previa de la tienda demo Río Claro"
              className="aspect-[4/3] w-full object-cover transition duration-700 group-hover:scale-[1.03]"
            />
            <span className="absolute bottom-4 left-4 rounded-md bg-[#12326e]/px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-white">
              demo.mibidon.cl
            </span>
          </a>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-20 md:px-8 md:py-28">
        <div className="relative overflow-hidden rounded-sm bg-[#12326e] px-8 py-14 text-white md:px-14">
          <div
            aria-hidden
            className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[#00b1e2]/40 blur-3xl"
          />
          <div className="relative max-w-xl">
            <h2 className="rc-display text-4xl md:text-5xl">
              ¿Listo para vender agua online?
            </h2>
            <p className="mt-3 text-white/80">
              Pedí una demo guiada o entrá al panel si ya sos partner MiBidón.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href={CONTACT_HREF}
                className="inline-flex rounded-md bg-[#00b1e2] px-6 py-3 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-[#33c1e8]"
              >
                Solicitar demo
              </a>
              <Link
                href={ADMIN_HREF}
                className="inline-flex rounded-md border border-white/40 px-6 py-3 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-white/10"
              >
                Panel plataforma
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#d5e3ec] bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-8 text-sm text-[#5a6578] md:flex-row md:items-center md:justify-between md:px-8">
          <p className="rc-display text-xl text-[#12326e]">MiBidón</p>
          <p>
            mibidon.cl · tiendas en{" "}
            <span className="text-[#12326e]">cliente.mibidon.cl</span>
          </p>
          <p>
            <a href={CONTACT_HREF} className="text-[#00b1e2] hover:underline">
              hola@mibidon.cl
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
