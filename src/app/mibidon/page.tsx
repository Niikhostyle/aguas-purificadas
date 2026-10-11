import Link from "next/link";
import { FaqAccordion } from "@/components/mibidon/faq-accordion";
import {
  CountUp,
  Reveal,
  ScrollHeader,
  TiltPanel,
} from "@/components/mibidon/landing-motion";
import { RoiCalculator } from "@/components/mibidon/roi-calculator";
import { whatsappHref } from "@/lib/whatsapp";

const DEMO_HREF = "https://demo.mibidon.cl";
const CONTACT_MAIL = "mailto:hola@mibidon.cl";

const display = {
  fontFamily: "var(--font-mb-display), 'Plus Jakarta Sans', sans-serif",
} as const;

const FEATURES = [
  {
    icon: "payments",
    iconBg: "bg-[#00a3e0]/15 text-[#00a3e0]",
    title: "Cobro 100% automático con WebPay Plus",
    body: "Acepta Débito, Crédito y Mach al instante. Cero comprobantes adulterados y conciliación bancaria en un clic.",
    tip: "Dinero directo a tu cuenta bancaria",
    tipColor: "text-emerald-700",
    tipIcon: "trending_up",
  },
  {
    icon: "autorenew",
    iconBg: "bg-emerald-100 text-emerald-700",
    title: "Suscripciones y pedidos recurrentes",
    body: "Tus clientes de hogares y empresas programan recargas semanales o quincenales automáticas. Flujo de caja garantizado mes a mes.",
    tip: "Fidelización garantizada sin llamadas",
    tipColor: "text-[#00a3e0]",
    tipIcon: "verified",
  },
  {
    icon: "distance",
    iconBg: "bg-sky-100 text-sky-800",
    title: "Rutas y despachos por comuna",
    body: "Configura días de entrega, pedidos mínimos y costos de envío por sector. Optimiza los camiones y reduce gastos de combustible.",
    tip: "Repartidores con hojas de ruta ordenadas",
    tipColor: "text-sky-800",
    tipIcon: "local_shipping",
  },
  {
    icon: "touch_app",
    iconBg: "bg-cyan-100 text-cyan-800",
    title: "Experiencia de compra en 2 toques",
    body: "Sin registros eternos ni descargas de aplicaciones lentas. Funciona perfecto desde el link en tu bio de Instagram o estado de WhatsApp.",
    tip: "3x mayor conversión que un eCommerce genérico",
    tipColor: "text-cyan-800",
    tipIcon: "speed",
  },
] as const;

export default function MiBidonLandingPage() {
  const waActivate = whatsappHref(
    "Hola, quiero activar mi tienda en MiBidón con los 14 días gratis",
  );
  const waAdvisor = whatsappHref(
    "Hola quiero hablar con un asesor comercial de MiBidón",
  );
  const waHeader = whatsappHref("Hola quiero información sobre MiBidón");

  return (
    <>
      <ScrollHeader>
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 md:px-8">
          <Link href="/" className="flex min-w-0 flex-1 items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#00a3e0] to-[#06b6d4] text-sm font-extrabold text-white shadow-[0_4px_14px_rgba(0,163,224,0.45)]">
              MB
            </div>
            <div className="flex min-w-0 flex-col">
              <span
                className="truncate text-lg font-extrabold leading-none tracking-tight text-white"
                style={display}
              >
                MiBidón
              </span>
              <span className="truncate text-[11px] font-semibold tracking-wide text-[#7dd3fc]">
                Para Embotelladoras
              </span>
            </div>
          </Link>
          <nav className="hidden items-center gap-5 text-sm font-semibold text-white/85 md:flex">
            <a href="#features" className="transition hover:text-white">
              Plataforma
            </a>
            <a href="#pricing" className="transition hover:text-white">
              Precios
            </a>
            <a href={DEMO_HREF} className="transition hover:text-white">
              Demo
            </a>
          </nav>
          <div className="flex shrink-0 items-center gap-2">
            <a
              href="#pricing"
              className="mb-cta-pulse flex min-h-10 items-center justify-center rounded-lg bg-[#00a3e0] px-3.5 py-1.5 text-xs font-bold uppercase tracking-wide text-white transition hover:brightness-110 active:scale-95"
            >
              Activar Tienda
            </a>
            <a
              href={waHeader}
              title="WhatsApp Asesor"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-400/15 text-emerald-300"
            >
              <span className="material-symbols-outlined text-[20px]">chat</span>
            </a>
          </div>
        </div>
      </ScrollHeader>

      <main className="relative flex min-h-screen w-full flex-col pb-28 pt-16">
        {/* Full-bleed hydro hero */}
        <section className="mb-hero-plane relative overflow-hidden text-white">
          <div className="mb-shimmer pointer-events-none absolute inset-0" />
          <div className="mb-orb mb-orb-a" />
          <div className="mb-orb mb-orb-b" />
          <div className="mb-orb mb-orb-c" />

          {/* Live ticker */}
          <div className="relative z-10 border-b border-white/10 bg-black/20 px-4 py-2 md:px-8">
            <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-1.5">
                <span className="inline-flex h-2 w-2 animate-ping rounded-full bg-emerald-400" />
                <span className="shrink-0 text-[11px] font-bold uppercase tracking-wider text-emerald-300">
                  En vivo:
                </span>
                <span className="truncate text-[13px] text-slate-200">
                  3 nuevas embotelladoras activadas esta semana
                </span>
              </div>
              <span className="shrink-0 text-[11px] font-semibold text-[#41befd]">
                Chile
              </span>
            </div>
          </div>

          <div className="relative z-10 mx-auto grid max-w-6xl gap-8 px-4 py-10 md:px-8 md:py-16 lg:grid-cols-2 lg:items-center lg:gap-12">
            <Reveal>
              <div className="flex flex-col gap-5">
                <p
                  className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl"
                  style={display}
                >
                  MiBidón
                </p>
                <div className="inline-flex items-center gap-1.5 self-start rounded-full border border-[#41befd]/35 bg-[#00a3e0]/20 px-3 py-1">
                  <span className="material-symbols-outlined text-[16px] text-[#41befd]">
                    verified
                  </span>
                  <span className="text-[11px] font-bold uppercase tracking-wide text-[#bae6fd]">
                    White-label para agua purificada
                  </span>
                </div>

                <h1
                  className="text-[32px] font-extrabold leading-[1.12] tracking-tight text-white md:text-[44px] lg:text-[52px] lg:leading-[1.08]"
                  style={display}
                >
                  Multiplica tus ventas en{" "}
                  <span className="bg-gradient-to-r from-[#41befd] to-[#67e8f9] bg-clip-text text-transparent">
                    piloto automático
                  </span>
                </h1>

                <p className="max-w-xl text-[15px] leading-6 text-slate-200 md:text-lg md:leading-7">
                  eCommerce white-label que digitaliza pedidos, automatiza rutas
                  y cobra con <strong className="text-white">WebPay en 2 clics</strong>.
                  Tu tienda lista en menos de 24 horas.
                </p>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-semibold text-slate-200">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px] text-[#41befd]">
                      bolt
                    </span>
                    0% comisión
                  </span>
                  <span className="text-white/30">•</span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px] text-[#41befd]">
                      domain
                    </span>
                    100% tu marca
                  </span>
                  <span className="text-white/30">•</span>
                  <span className="flex items-center gap-1 text-emerald-300">
                    <span className="material-symbols-outlined text-[16px]">
                      check_circle
                    </span>
                    Activación 24h
                  </span>
                </div>

                <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:flex-wrap">
                  <a
                    href="#pricing"
                    className="mb-cta-pulse flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#00a3e0] to-[#06b6d4] px-4 py-3 text-base font-bold text-white ring-2 ring-[#41befd]/35 transition hover:brightness-110 active:scale-[0.98] sm:w-auto sm:px-8"
                    style={display}
                  >
                    <span>Comenzar gratis 14 días</span>
                    <span className="material-symbols-outlined text-[20px]">
                      rocket_launch
                    </span>
                  </a>
                  <a
                    href={DEMO_HREF}
                    className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/10 px-4 py-2 text-xs font-bold text-white transition hover:bg-white/16 active:scale-[0.98] sm:w-auto"
                  >
                    <span className="material-symbols-outlined text-[18px] text-[#41befd]">
                      play_circle
                    </span>
                    <span>Ver demostración en vivo</span>
                  </a>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-300">
                  <span className="material-symbols-outlined text-[15px] text-emerald-400">
                    lock
                  </span>
                  <span>Sin tarjeta de crédito · Cancela cuando quieras</span>
                </div>
              </div>
            </Reveal>

            <Reveal delayMs={120}>
              <TiltPanel className="mb-float-y">
                <RoiCalculator />
              </TiltPanel>
            </Reveal>
          </div>
        </section>

        {/* Stats strip */}
        <section className="relative z-10 -mt-6 px-4 md:-mt-8 md:px-8">
          <Reveal>
            <div className="mx-auto grid max-w-6xl grid-cols-3 gap-2 rounded-2xl border border-[#0f2b5c]/10 bg-white/80 p-3 shadow-[0_16px_40px_-20px_rgba(15,43,92,0.35)] backdrop-blur-md md:gap-4 md:p-5">
              {[
                { n: 120, suffix: "+", label: "Embotelladoras" },
                { n: 24, suffix: "h", label: "Activación" },
                { n: 0, suffix: "%", label: "Comisión x venta" },
              ].map((s, i) => (
                <div
                  key={s.label}
                  className="flex flex-col items-center text-center"
                >
                  <span
                    className="text-2xl font-extrabold text-[#0a1c3c] md:text-3xl"
                    style={display}
                  >
                    <CountUp value={s.n} suffix={s.suffix} durationMs={1100 + i * 200} />
                  </span>
                  <span className="text-[11px] font-semibold text-[#475569] md:text-xs">
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          </Reveal>
        </section>

        {/* Trust */}
        <section className="px-4 py-8 md:px-8 md:py-10">
          <Reveal>
            <div className="mx-auto max-w-6xl rounded-2xl border border-[#0f2b5c]/08 bg-gradient-to-r from-[#dff3fb] to-[#eef8fc] p-4 md:p-6">
              <div className="flex items-center justify-center gap-1 text-center">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span
                    key={i}
                    className="material-symbols-outlined text-[18px] text-amber-500"
                  >
                    star
                  </span>
                ))}
                <span className="ml-1 text-xs font-bold text-[#0a1c3c]">
                  +120 embotelladoras y distribuidores
                </span>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 border-t border-[#0f2b5c]/08 pt-3 text-center">
                {[
                  ["Transbank", "WebPay Plus"],
                  ["Boleta SII", "Automática"],
                  ["SSL 256-bit", "Transacción Segura"],
                ].map(([t, s]) => (
                  <div key={t} className="flex flex-col items-center">
                    <span className="text-xs font-bold text-[#0a1c3c]">{t}</span>
                    <span className="text-[11px] text-[#475569]">{s}</span>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </section>

        {/* Comparison */}
        <section className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-6 md:px-8 md:py-12">
          <Reveal>
            <div className="flex flex-col gap-1 text-center">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#ba1a1a]">
                El costo oculto de operar a la antigua
              </span>
              <h2
                className="text-xl font-bold tracking-tight text-[#0a1c3c] md:text-3xl"
                style={display}
              >
                Vender por WhatsApp vs. Crecer con MiBidón
              </h2>
              <p className="text-[13px] text-[#475569]">
                Cada mensaje sin contestar a tiempo es un botellón que vendió tu
                competencia.
              </p>
            </div>
          </Reveal>
          <div className="mt-1 grid gap-3 md:grid-cols-2">
            <Reveal delayMs={40}>
              <div className="flex h-full flex-col gap-2 rounded-2xl border border-red-200/80 bg-gradient-to-br from-red-50 to-white p-4 shadow-sm">
                <div className="flex items-center gap-2 text-lg font-bold text-[#ba1a1a]">
                  <span className="material-symbols-outlined text-[22px]">
                    cancel
                  </span>
                  El Caos del WhatsApp
                </div>
                <ul className="flex flex-col gap-2 pt-1 text-[13px] text-slate-700">
                  {[
                    ["Clientes perdidos:", "Demoras en responder y se van con otro distribuidor."],
                    ["Comprobantes falsos:", "Horas cuadrando transferencias manuales en el banco."],
                    ["Rutas desordenadas:", "Repartidores dando vueltas sin optimización por comuna."],
                    ["Cero recompra automática:", "Dependes de que el cliente se acuerde de pedir."],
                  ].map(([k, v]) => (
                    <li key={k} className="flex items-start gap-2">
                      <span className="font-bold text-[#ba1a1a]">✕</span>
                      <span>
                        <strong>{k}</strong> {v}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
            <Reveal delayMs={120}>
              <div className="flex h-full flex-col gap-2 rounded-2xl border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-50 to-white p-4 shadow-md">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-lg font-bold text-emerald-800">
                    <span className="material-symbols-outlined text-[24px] text-emerald-600">
                      check_circle
                    </span>
                    Con MiBidón Automatizado
                  </div>
                  <span className="rounded bg-emerald-600 px-2 py-0.5 text-[11px] font-bold text-white">
                    +85% Retención
                  </span>
                </div>
                <ul className="flex flex-col gap-2 pt-1 text-[13px] text-slate-800">
                  {[
                    ["Cobro inmediato con WebPay:", "La plata entra directo a tu cuenta bancaria."],
                    ["Despacho ordenado por comuna:", "Rutas listas cada mañana para tus choferes."],
                    ["Suscripciones de recarga:", "Ingresos mensuales fijos y clientes cautivos."],
                    ["100% tu marca:", "Tu logo, tus colores, tu dominio web exclusivo."],
                  ].map(([k, v]) => (
                    <li key={k} className="flex items-start gap-2">
                      <span className="font-bold text-emerald-600">✓</span>
                      <span>
                        <strong>{k}</strong> {v}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </section>

        {/* Features */}
        <section
          id="features"
          className="relative mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-6 md:px-8 md:py-12"
        >
          <div className="pointer-events-none absolute inset-x-8 top-0 h-40 rounded-full bg-[#00a3e0]/10 blur-3xl" />
          <Reveal>
            <div className="relative flex flex-col gap-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#00a3e0]">
                Características que generan ingresos
              </span>
              <h2
                className="text-2xl font-bold tracking-tight text-[#0a1c3c] md:text-4xl"
                style={display}
              >
                Diseñado exclusivamente para el negocio del agua
              </h2>
              <p className="max-w-2xl text-[15px] text-[#475569]">
                Herramientas creadas para resolver los dolores específicos de
                plantas y distribuidores.
              </p>
            </div>
          </Reveal>
          <div className="relative grid gap-3 sm:grid-cols-2">
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} delayMs={i * 70}>
                <article className="flex h-full flex-col gap-2 rounded-2xl border border-[#0f2b5c]/08 bg-white/85 p-4 shadow-[0_10px_30px_-18px_rgba(15,43,92,0.35)] transition hover:-translate-y-1 hover:border-[#00a3e0]/50 hover:shadow-[0_16px_36px_-16px_rgba(0,163,224,0.35)]">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${f.iconBg}`}
                  >
                    <span className="material-symbols-outlined text-[24px]">
                      {f.icon}
                    </span>
                  </div>
                  <h3
                    className="text-lg font-bold text-[#0a1c3c]"
                    style={display}
                  >
                    {f.title}
                  </h3>
                  <p className="text-[13px] leading-5 text-[#475569]">{f.body}</p>
                  <div
                    className={`inline-flex items-center gap-1 pt-1 text-[11px] font-semibold ${f.tipColor}`}
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {f.tipIcon}
                    </span>
                    {f.tip}
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Testimonials */}
        <section className="mx-2 rounded-3xl bg-gradient-to-br from-[#0f2b5c] to-[#061229] px-4 py-8 text-white md:mx-auto md:max-w-6xl md:px-8 md:py-12">
          <Reveal>
            <div className="flex flex-col gap-1 text-center">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#41befd]">
                Resultados reales
              </span>
              <h2
                className="text-xl font-bold md:text-3xl"
                style={display}
              >
                Embotelladoras que ya escalaron
              </h2>
            </div>
          </Reveal>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {[
              {
                quote:
                  "Aumentamos un 45% las recargas en el primer mes sin contratar más secretarias. Los pedidos entran pagados y los choferes saben exactamente adónde ir.",
                initials: "CM",
                name: "Carlos Morales",
                role: "Agua Manantial del Valle (Santiago)",
              },
              {
                quote:
                  "Antes pasaba 3 horas cada noche cuadrando transferencias truchas. Ahora con WebPay automático duermo tranquila y las empresas me compran solas.",
                initials: "AV",
                name: "Andrea Valenzuela",
                role: "Purificadora Aconcagua (Valparaíso)",
              },
            ].map((t, i) => (
              <Reveal key={t.name} delayMs={i * 90}>
                <article className="mb-glass flex h-full flex-col gap-2 rounded-2xl p-4">
                  <div className="flex items-center gap-1 text-amber-400">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <span
                        key={j}
                        className="material-symbols-outlined text-[18px]"
                      >
                        star
                      </span>
                    ))}
                  </div>
                  <p className="text-[13px] font-medium italic leading-relaxed text-slate-100">
                    “{t.quote}”
                  </p>
                  <div className="flex items-center gap-3 border-t border-white/15 pt-2">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#00a3e0] text-[14px] font-bold text-white">
                      {t.initials}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-white">
                        {t.name}
                      </span>
                      <span className="text-[11px] text-slate-300">{t.role}</span>
                    </div>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Pricing */}
        <section
          id="pricing"
          className="mx-auto flex w-full max-w-xl flex-col gap-4 px-4 py-10 md:max-w-6xl md:px-8 md:py-14"
        >
          <Reveal>
            <div className="flex flex-col gap-1 text-center">
              <div className="mx-auto inline-flex items-center justify-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-bold text-emerald-800">
                <span className="material-symbols-outlined text-[16px]">
                  local_offer
                </span>
                Oferta de lanzamiento exclusiva
              </div>
              <h2
                className="text-2xl font-bold text-[#0a1c3c] md:text-4xl"
                style={display}
              >
                Empieza a vender esta misma semana
              </h2>
              <p className="text-[13px] text-[#475569]">
                Prueba el sistema completo durante 14 días sin ningún riesgo.
              </p>
            </div>
          </Reveal>

          <Reveal delayMs={80}>
            <div className="relative mx-auto flex w-full max-w-lg flex-col gap-4 overflow-hidden rounded-2xl border-2 border-[#00a3e0] bg-gradient-to-b from-white to-[#e8f4fb] p-4 shadow-[0_20px_50px_-24px_rgba(0,163,224,0.55)] md:p-6">
              <div className="absolute -right-12 top-6 rotate-45 bg-[#00a3e0] px-12 py-1 text-center text-[11px] font-bold uppercase tracking-wider text-white shadow-sm">
                Más Elegido
              </div>
              <div className="flex flex-col gap-1 pr-14">
                <span className="text-xs font-bold uppercase tracking-wider text-[#00a3e0]">
                  Plan Pro Despegue
                </span>
                <h3
                  className="text-xl font-extrabold text-[#0a1c3c]"
                  style={display}
                >
                  Tu Tienda Llave en Mano
                </h3>
                <p className="text-[13px] text-[#475569]">
                  Todo configurado por nuestros especialistas listo para recibir
                  pedidos.
                </p>
              </div>
              <div className="flex items-baseline gap-2 border-b border-[#cfe8f6] pb-2">
                <span
                  className="text-4xl font-extrabold text-[#0a1c3c]"
                  style={display}
                >
                  $29.990
                </span>
                <span className="text-xs text-[#475569]">/ mes</span>
                <span className="ml-auto rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                  0% Comisiones
                </span>
              </div>
              <div className="flex flex-col gap-2.5 text-[13px] text-slate-800">
                {[
                  ["100% Tu Marca y Logo:", "Dominio exclusivo .cl o subdominio"],
                  ["Pasarela WebPay Plus:", "Dinero directo a tu cuenta bancaria"],
                  ["Módulo de Recargas Frecuentes:", "Retención de clientes"],
                  ["Control de Comunas y Tarifas:", "Despachos sin errores"],
                  ["Soporte Prioritario por WhatsApp:", "Asesor dedicado en Chile"],
                  ["Migración y Carga de Catálogo Gratis", ""],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-center gap-2">
                    <span className="material-symbols-outlined shrink-0 text-[18px] text-emerald-600">
                      check_circle
                    </span>
                    <span>
                      <strong>{k}</strong> {v}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex flex-col gap-2 pt-1">
                <a
                  href={waActivate}
                  className="mb-cta-pulse flex min-h-[50px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#00a3e0] to-[#06b6d4] px-4 py-3 text-center text-base font-bold text-white transition hover:brightness-110 active:scale-[0.98]"
                  style={display}
                >
                  <span>Quiero mi tienda ahora</span>
                  <span className="material-symbols-outlined text-[20px]">
                    arrow_forward
                  </span>
                </a>
                <div className="flex items-center justify-center gap-1.5 text-center text-[11px] text-[#64748b]">
                  <span className="material-symbols-outlined text-[16px] text-emerald-600">
                    verified_user
                  </span>
                  <span>
                    Garantía de satisfacción de 30 días o 100% de devolución
                  </span>
                </div>
              </div>
            </div>
          </Reveal>
        </section>

        {/* FAQ */}
        <section className="mx-auto flex w-full max-w-3xl flex-col gap-3 px-4 py-6 md:px-8">
          <Reveal>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#00a3e0]">
                Resolvemos tus dudas
              </span>
              <h3 className="text-lg font-bold text-[#0a1c3c]" style={display}>
                Preguntas frecuentes antes de activar
              </h3>
            </div>
          </Reveal>
          <Reveal delayMs={60}>
            <FaqAccordion />
          </Reveal>
        </section>

        {/* Closer */}
        <section className="px-4 pb-10 md:px-8">
          <Reveal>
            <div className="relative mx-auto flex max-w-3xl flex-col items-center gap-3 overflow-hidden rounded-3xl bg-gradient-to-br from-[#061229] via-[#0f2b5c] to-[#0a3a5c] p-6 text-center text-white shadow-xl md:p-10">
              <div className="mb-orb mb-orb-c !opacity-60" />
              <div className="relative flex h-14 w-14 items-center justify-center rounded-full border border-white/20 bg-white/10 text-[#41befd]">
                <span className="material-symbols-outlined text-[32px]">
                  support_agent
                </span>
              </div>
              <div className="relative flex flex-col gap-1">
                <h3
                  className="text-xl font-bold text-white md:text-2xl"
                  style={display}
                >
                  ¿Tienes dudas con la operación?
                </h3>
                <p className="text-[13px] text-slate-200">
                  Conversa con un asesor especialista en distribución de agua y
                  agenda una demo de 10 minutos.
                </p>
              </div>
              <div className="relative flex w-full flex-col gap-2 pt-1 sm:flex-row sm:justify-center">
                <a
                  href={waAdvisor}
                  className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-[15px] font-bold text-white shadow-lg transition hover:bg-emerald-600 active:scale-[0.98] sm:w-auto sm:px-6"
                  style={display}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    chat
                  </span>
                  Hablar por WhatsApp
                </a>
                <a
                  href={CONTACT_MAIL}
                  className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold text-white transition hover:bg-white/15 active:scale-[0.98] sm:w-auto"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    mail
                  </span>
                  hola@mibidon.cl
                </a>
              </div>
            </div>
          </Reveal>
        </section>

        <footer className="mt-auto flex flex-col items-center justify-center gap-1 border-t border-[#0f2b5c]/10 px-4 py-6 text-center">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-gradient-to-br from-[#00a3e0] to-[#06b6d4] text-[10px] font-extrabold text-white">
              MB
            </div>
            <span className="text-xs font-bold text-[#0a1c3c]">
              MiBidón Chile
            </span>
          </div>
          <a
            href={CONTACT_MAIL}
            className="flex items-center gap-1 text-xs font-semibold text-[#00a3e0] transition hover:text-[#0a1c3c]"
          >
            <span className="material-symbols-outlined text-[16px]">mail</span>
            hola@mibidon.cl
          </a>
          <span className="text-[11px] text-[#64748b]">
            Plataforma eCommerce White-Label para Embotelladoras de Agua
          </span>
        </footer>
      </main>

      <nav className="fixed bottom-0 z-50 w-full border-t border-[#0f2b5c]/10 bg-[#e8f4fb]/92 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_-12px_rgba(15,43,92,0.25)] backdrop-blur-xl md:hidden">
        <div className="flex h-16 items-center justify-around px-4">
          <a
            href="#"
            className="flex h-11 w-14 flex-col items-center justify-center gap-0.5 font-bold text-[#00a3e0]"
          >
            <span className="material-symbols-outlined text-[22px]">
              rocket_launch
            </span>
            <span className="text-[11px]">Plataforma</span>
          </a>
          <a
            href="#demo-interactiva"
            className="flex h-11 w-14 flex-col items-center justify-center gap-0.5 text-[#475569] transition hover:text-[#00a3e0]"
          >
            <span className="material-symbols-outlined text-[22px]">
              calculate
            </span>
            <span className="text-[11px]">Ganancias</span>
          </a>
          <a
            href="#pricing"
            className="flex h-11 w-14 flex-col items-center justify-center gap-0.5 text-[#475569] transition hover:text-[#00a3e0]"
          >
            <span className="material-symbols-outlined text-[22px]">sell</span>
            <span className="text-[11px]">Planes</span>
          </a>
          <a
            href={waAdvisor}
            className="flex h-11 w-14 flex-col items-center justify-center gap-0.5 font-semibold text-emerald-600 transition hover:text-emerald-700"
          >
            <span className="material-symbols-outlined text-[22px]">chat</span>
            <span className="text-[11px]">Ventas</span>
          </a>
        </div>
      </nav>
    </>
  );
}
