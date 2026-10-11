import Link from "next/link";
import { FaqAccordion } from "@/components/mibidon/faq-accordion";
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
    iconBg: "bg-[#41befd]/20 text-[#00658d]",
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
    tipColor: "text-[#00658d]",
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
    iconBg: "bg-indigo-100 text-indigo-800",
    title: "Experiencia de compra en 2 toques",
    body: "Sin registros eternos ni descargas de aplicaciones lentas. Funciona perfecto desde el link en tu bio de Instagram o estado de WhatsApp.",
    tip: "3x mayor conversión que un eCommerce genérico",
    tipColor: "text-indigo-800",
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
      {/* Fixed header */}
      <header className="fixed top-0 z-50 w-full border-b border-[#eaedff] bg-[#faf8ff]/90 shadow-[0_1px_8px_rgba(0,0,0,0.04)] backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 md:px-8">
          <Link href="/" className="flex min-w-0 flex-1 items-center gap-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#0f2b5c] text-sm font-extrabold text-white">
              MB
            </div>
            <div className="flex min-w-0 flex-col">
              <span
                className="truncate text-lg font-bold leading-none tracking-tight text-[#00163d]"
                style={display}
              >
                MiBidón
              </span>
              <span className="truncate text-[11px] font-semibold tracking-wide text-[#00658d]">
                Para Embotelladoras
              </span>
            </div>
          </Link>
          <nav className="hidden items-center gap-5 text-sm font-semibold text-[#00163d] md:flex">
            <a href="#features" className="hover:text-[#00658d]">
              Plataforma
            </a>
            <a href="#pricing" className="hover:text-[#00658d]">
              Precios
            </a>
            <a href={DEMO_HREF} className="hover:text-[#00658d]">
              Demo
            </a>
          </nav>
          <div className="flex shrink-0 items-center gap-2">
            <a
              href="#pricing"
              className="flex min-h-10 items-center justify-center rounded-lg bg-[#00658d] px-3.5 py-1.5 text-xs font-bold uppercase tracking-wide text-white shadow-[0_3px_12px_rgba(0,101,141,0.35)] transition active:scale-95"
            >
              Activar Tienda
            </a>
            <a
              href={waHeader}
              title="WhatsApp Asesor"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-600"
            >
              <span className="material-symbols-outlined text-[20px]">chat</span>
            </a>
          </div>
        </div>
      </header>

      <main className="relative flex min-h-screen w-full flex-col bg-[#faf8ff] pb-28 pt-16">
        {/* Live ticker */}
        <div className="flex items-center justify-between gap-2 border-b border-[#0f2b5c] bg-[#00163d] px-4 py-2 text-white md:px-8">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-1.5">
              <span className="inline-flex h-2 w-2 animate-ping rounded-full bg-emerald-400" />
              <span className="shrink-0 text-[11px] font-bold uppercase tracking-wider text-emerald-300">
                En vivo:
              </span>
              <span className="truncate text-[13px] text-slate-200">
                🔥 3 nuevas embotelladoras activadas esta semana
              </span>
            </div>
            <span className="shrink-0 text-[11px] font-semibold text-[#41befd]">
              Chile 🇨🇱
            </span>
          </div>
        </div>

        {/* Hero */}
        <section className="relative overflow-hidden px-4 pb-8 pt-4 md:px-8 md:pb-14 md:pt-10">
          <div className="pointer-events-none absolute -right-12 -top-12 h-64 w-64 rounded-full bg-[#41befd]/25 blur-3xl" />
          <div className="pointer-events-none absolute left-[-4rem] top-44 h-56 w-56 rounded-full bg-[#0f2b5c]/20 blur-3xl" />

          <div className="relative mx-auto grid max-w-6xl gap-8 lg:grid-cols-2 lg:items-start lg:gap-12">
            <div className="flex flex-col gap-4">
              <div className="inline-flex items-center gap-1.5 self-start rounded-full border border-[#00658d]/30 bg-[#41befd]/20 px-3 py-1">
                <span className="material-symbols-outlined text-[16px] text-[#00658d]">
                  verified
                </span>
                <span className="text-[11px] font-bold uppercase tracking-wide text-[#00658d]">
                  Plataforma White-Label para Agua Purificada
                </span>
              </div>

              <h1
                className="text-[36px] font-extrabold leading-[1.15] tracking-tight text-[#00163d] md:text-5xl md:leading-[1.1] lg:text-[56px] lg:leading-[64px]"
                style={display}
              >
                Multiplica tus ventas de agua purificada en{" "}
                <span className="text-[#00658d]">piloto automático</span>
              </h1>

              <p className="max-w-xl text-[15px] leading-6 text-[#44464f] md:text-lg md:leading-7">
                La plataforma eCommerce white-label que digitaliza tus pedidos,
                automatiza rutas y te hace cobrar con{" "}
                <strong>WebPay en 2 clics</strong>. Tu tienda lista en menos de
                24 horas.
              </p>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 py-0.5 text-[11px] font-semibold text-slate-700">
                <span className="flex items-center gap-1 text-[#00163d]">
                  <span className="material-symbols-outlined text-[16px] text-[#00658d]">
                    bolt
                  </span>
                  0% comisión x venta
                </span>
                <span className="text-[#c4c6d0]">•</span>
                <span className="flex items-center gap-1 text-[#00163d]">
                  <span className="material-symbols-outlined text-[16px] text-[#00658d]">
                    domain
                  </span>
                  100% tu marca
                </span>
                <span className="text-[#c4c6d0]">•</span>
                <span className="flex items-center gap-1 text-emerald-700">
                  <span className="material-symbols-outlined text-[16px] text-emerald-600">
                    check_circle
                  </span>
                  Activación en 24h
                </span>
              </div>

              <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:flex-wrap">
                <a
                  href="#pricing"
                  className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#00658d] to-[#0089be] px-4 py-3 text-base font-bold text-white shadow-[0_8px_24px_rgba(0,101,141,0.38)] ring-2 ring-[#00658d]/30 transition hover:brightness-105 active:scale-[0.98] sm:w-auto sm:px-8"
                  style={display}
                >
                  <span>Comenzar gratis 14 días</span>
                  <span className="material-symbols-outlined text-[20px]">
                    rocket_launch
                  </span>
                </a>
                <a
                  href={DEMO_HREF}
                  className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg border border-[#c4c6d0]/40 bg-[#eaedff] px-4 py-2 text-xs font-bold text-[#00163d] transition active:scale-[0.98] sm:w-auto"
                >
                  <span className="material-symbols-outlined text-[18px] text-[#00658d]">
                    play_circle
                  </span>
                  <span>Ver demostración en vivo</span>
                </a>
              </div>
              <div className="flex items-center justify-center gap-2 text-center text-[11px] text-[#747780] sm:justify-start">
                <span className="material-symbols-outlined text-[15px] text-emerald-600">
                  lock
                </span>
                <span>Sin tarjeta de crédito • Cancela cuando quieras</span>
              </div>
            </div>

            <RoiCalculator />
          </div>
        </section>

        {/* Trust */}
        <section className="px-4 py-2 md:px-8">
          <div className="mx-auto max-w-6xl rounded-xl border border-[#c4c6d0]/30 bg-[#f2f3ff] p-3 md:p-5">
            <div className="flex items-center justify-center gap-1 text-center">
              {Array.from({ length: 5 }).map((_, i) => (
                <span
                  key={i}
                  className="material-symbols-outlined text-[18px] text-amber-500"
                >
                  star
                </span>
              ))}
              <span className="ml-1 text-xs font-bold text-[#00163d]">
                +120 embotelladoras y distribuidores
              </span>
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2 border-t border-[#eaedff] pt-3 text-center">
              {[
                ["Transbank", "WebPay Plus"],
                ["Boleta SII", "Automática"],
                ["SSL 256-bit", "Transacción Segura"],
              ].map(([t, s]) => (
                <div key={t} className="flex flex-col items-center">
                  <span className="text-xs font-bold text-[#00163d]">{t}</span>
                  <span className="text-[11px] text-[#44464f]">{s}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Comparison */}
        <section className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-6 md:px-8 md:py-12">
          <div className="flex flex-col gap-1 text-center">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#ba1a1a]">
              El costo oculto de operar a la antigua
            </span>
            <h2
              className="text-xl font-bold tracking-tight text-[#00163d] md:text-3xl"
              style={display}
            >
              Vender por WhatsApp vs. Crecer con MiBidón
            </h2>
            <p className="text-[13px] text-[#44464f]">
              Cada mensaje sin contestar a tiempo es un botellón que vendió tu
              competencia.
            </p>
          </div>
          <div className="mt-1 grid gap-3 md:grid-cols-2">
            <div className="flex flex-col gap-2 rounded-xl border border-red-200/80 bg-red-50/70 p-4">
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
            <div className="flex flex-col gap-2 rounded-xl border-2 border-emerald-500/30 bg-emerald-50/80 p-4 shadow-sm">
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
          </div>
        </section>

        {/* Features */}
        <section
          id="features"
          className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-6 md:px-8 md:py-12"
        >
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#00658d]">
              Características que generan ingresos
            </span>
            <h2
              className="text-2xl font-bold tracking-tight text-[#00163d] md:text-4xl"
              style={display}
            >
              Diseñado exclusivamente para el negocio del agua
            </h2>
            <p className="max-w-2xl text-[15px] text-[#44464f]">
              Herramientas creadas para resolver los dolores específicos de
              plantas y distribuidores:
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {FEATURES.map((f) => (
              <article
                key={f.title}
                className="flex flex-col gap-2 rounded-xl border border-[#c4c6d0]/30 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[#00658d] hover:shadow-md"
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-lg ${f.iconBg}`}
                >
                  <span className="material-symbols-outlined text-[24px]">
                    {f.icon}
                  </span>
                </div>
                <h3
                  className="text-lg font-bold text-[#00163d]"
                  style={display}
                >
                  {f.title}
                </h3>
                <p className="text-[13px] leading-5 text-[#44464f]">{f.body}</p>
                <div
                  className={`inline-flex items-center gap-1 pt-1 text-[11px] font-semibold ${f.tipColor}`}
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {f.tipIcon}
                  </span>
                  {f.tip}
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Testimonials */}
        <section className="mx-2 rounded-2xl bg-[#f2f3ff] px-4 py-6 md:mx-auto md:max-w-6xl md:px-8 md:py-12">
          <div className="flex flex-col gap-1 text-center">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#00658d]">
              Resultados reales
            </span>
            <h2
              className="text-xl font-bold text-[#00163d] md:text-3xl"
              style={display}
            >
              Embotelladoras que ya escalaron
            </h2>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {[
              {
                quote:
                  "Aumentamos un 45% las recargas en el primer mes sin contratar más secretarias. Los pedidos entran pagados y los choferes saben exactamente adónde ir.",
                initials: "CM",
                name: "Carlos Morales",
                role: "Agua Manantial del Valle (Santiago)",
                bg: "bg-[#00658d]",
              },
              {
                quote:
                  "Antes pasaba 3 horas cada noche cuadrando transferencias truchas. Ahora con WebPay automático duermo tranquila y las empresas me compran solas.",
                initials: "AV",
                name: "Andrea Valenzuela",
                role: "Purificadora Aconcagua (Valparaíso)",
                bg: "bg-[#0f2b5c]",
              },
            ].map((t) => (
              <article
                key={t.name}
                className="flex flex-col gap-2 rounded-xl border border-[#c4c6d0]/30 bg-white p-4 shadow-sm"
              >
                <div className="flex items-center gap-1 text-amber-500">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span
                      key={i}
                      className="material-symbols-outlined text-[18px]"
                    >
                      star
                    </span>
                  ))}
                </div>
                <p className="text-[13px] font-medium italic leading-relaxed text-[#00163d]">
                  “{t.quote}”
                </p>
                <div className="flex items-center gap-3 border-t border-[#eaedff] pt-2">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[14px] font-bold text-white ${t.bg}`}
                  >
                    {t.initials}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-[#00163d]">
                      {t.name}
                    </span>
                    <span className="text-[11px] text-[#44464f]">{t.role}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Pricing */}
        <section
          id="pricing"
          className="mx-auto flex w-full max-w-xl flex-col gap-4 px-4 py-8 md:max-w-6xl md:px-8 md:py-14"
        >
          <div className="flex flex-col gap-1 text-center">
            <div className="mx-auto inline-flex items-center justify-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-bold text-emerald-800">
              <span className="material-symbols-outlined text-[16px]">
                local_offer
              </span>
              Oferta de lanzamiento exclusiva
            </div>
            <h2
              className="text-2xl font-bold text-[#00163d] md:text-4xl"
              style={display}
            >
              Empieza a vender esta misma semana
            </h2>
            <p className="text-[13px] text-[#44464f]">
              Prueba el sistema completo durante 14 días sin ningún riesgo para
              tu negocio.
            </p>
          </div>

          <div className="relative mx-auto flex w-full max-w-lg flex-col gap-4 overflow-hidden rounded-2xl border-2 border-[#00658d] bg-gradient-to-b from-white to-[#f2f3ff] p-4 shadow-xl md:p-6">
            <div className="absolute -right-12 top-6 rotate-45 bg-[#00658d] px-12 py-1 text-center text-[11px] font-bold uppercase tracking-wider text-white shadow-sm">
              Más Elegido
            </div>
            <div className="flex flex-col gap-1 pr-14">
              <span className="text-xs font-bold uppercase tracking-wider text-[#00658d]">
                Plan Pro Despegue
              </span>
              <h3
                className="text-xl font-extrabold text-[#00163d]"
                style={display}
              >
                Tu Tienda Llave en Mano
              </h3>
              <p className="text-[13px] text-[#44464f]">
                Todo configurado por nuestros especialistas listo para recibir
                pedidos.
              </p>
            </div>
            <div className="flex items-baseline gap-2 border-b border-[#eaedff] pb-2">
              <span
                className="text-4xl font-extrabold text-[#00163d]"
                style={display}
              >
                $29.990
              </span>
              <span className="text-xs text-[#44464f]">/ mes</span>
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
                className="flex min-h-[50px] w-full items-center justify-center gap-2 rounded-xl bg-[#00658d] px-4 py-3 text-center text-base font-bold text-white shadow-md transition hover:bg-[#00658d]/95 active:scale-[0.98]"
                style={display}
              >
                <span>Quiero mi tienda ahora</span>
                <span className="material-symbols-outlined text-[20px]">
                  arrow_forward
                </span>
              </a>
              <div className="flex items-center justify-center gap-1.5 text-center text-[11px] text-[#747780]">
                <span className="material-symbols-outlined text-[16px] text-emerald-600">
                  verified_user
                </span>
                <span>
                  Garantía de satisfacción de 30 días o 100% de devolución
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="mx-auto flex w-full max-w-3xl flex-col gap-3 px-4 py-6 md:px-8">
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#00658d]">
              Resolvemos tus dudas
            </span>
            <h3 className="text-lg font-bold text-[#00163d]" style={display}>
              Preguntas frecuentes antes de activar
            </h3>
          </div>
          <FaqAccordion />
        </section>

        {/* Closer */}
        <section className="px-4 pb-8 md:px-8">
          <div className="relative mx-auto flex max-w-3xl flex-col items-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-br from-[#00163d] to-[#0f2b5c] p-5 text-center text-white shadow-xl md:p-8">
            <div className="pointer-events-none absolute -bottom-10 -right-10 h-44 w-44 rounded-full bg-[#41befd]/20 blur-3xl" />
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/20 bg-white/10 text-[#41befd]">
              <span className="material-symbols-outlined text-[32px]">
                support_agent
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <h3
                className="text-xl font-bold text-white md:text-2xl"
                style={display}
              >
                ¿Tienes dudas con la operación?
              </h3>
              <p className="text-[13px] text-slate-200">
                Conversa directamente con un asesor especialista en distribución
                de agua y agenda una demo personalizada de 10 minutos.
              </p>
            </div>
            <div className="flex w-full flex-col gap-2 pt-1 sm:flex-row sm:justify-center">
              <a
                href={waAdvisor}
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-[15px] font-bold text-white shadow-lg transition hover:bg-emerald-600 active:scale-[0.98] sm:w-auto sm:px-6"
                style={display}
              >
                <span className="material-symbols-outlined text-[20px]">
                  chat
                </span>
                Hablar con un asesor por WhatsApp
              </a>
              <a
                href={CONTACT_MAIL}
                className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold text-white transition hover:bg-white/15 active:scale-[0.98] sm:w-auto"
              >
                <span className="material-symbols-outlined text-[18px]">
                  mail
                </span>
                Escribir a hola@mibidon.cl
              </a>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-auto flex flex-col items-center justify-center gap-1 border-t border-[#eaedff] px-4 py-6 text-center">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-[#0f2b5c] text-[10px] font-extrabold text-white">
              MB
            </div>
            <span className="text-xs font-bold text-[#00163d]">
              MiBidón Chile
            </span>
          </div>
          <a
            href={CONTACT_MAIL}
            className="flex items-center gap-1 text-xs font-semibold text-[#00658d] transition hover:text-[#00163d]"
          >
            <span className="material-symbols-outlined text-[16px]">mail</span>
            hola@mibidon.cl
          </a>
          <span className="text-[11px] text-[#747780]">
            Plataforma eCommerce White-Label para Embotelladoras de Agua
          </span>
          <a
            href={DEMO_HREF}
            className="mt-1 text-[11px] font-semibold text-[#00658d] hover:underline"
          >
            Ver demo en vivo → demo.mibidon.cl
          </a>
        </footer>
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 z-50 w-full border-t border-[#eaedff] bg-[#faf8ff]/90 pb-[env(safe-area-inset-bottom)] shadow-[0_-2px_12px_rgba(0,0,0,0.05)] backdrop-blur-xl md:hidden">
        <div className="flex h-16 items-center justify-around px-4">
          <a
            href="#"
            className="flex h-11 w-14 flex-col items-center justify-center gap-0.5 font-bold text-[#00658d]"
          >
            <span className="material-symbols-outlined text-[22px]">
              rocket_launch
            </span>
            <span className="text-[11px]">Plataforma</span>
          </a>
          <a
            href="#demo-interactiva"
            className="flex h-11 w-14 flex-col items-center justify-center gap-0.5 text-[#44464f] transition hover:text-[#00658d]"
          >
            <span className="material-symbols-outlined text-[22px]">
              calculate
            </span>
            <span className="text-[11px]">Ganancias</span>
          </a>
          <a
            href="#pricing"
            className="flex h-11 w-14 flex-col items-center justify-center gap-0.5 text-[#44464f] transition hover:text-[#00658d]"
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
