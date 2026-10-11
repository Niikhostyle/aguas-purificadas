import type { CSSProperties } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Banknote,
  Check,
  CreditCard,
  Droplets,
  FileCheck2,
  Globe,
  Headphones,
  LayoutDashboard,
  Lock,
  Mail,
  MessageCircle,
  MousePointerClick,
  Play,
  Repeat,
  Rocket,
  ShieldCheck,
  Sparkles,
  Star,
  Store,
  Truck,
  X,
  Zap,
} from "lucide-react";
import { FaqAccordion } from "@/components/mibidon/faq-accordion";
import { HeroMockup } from "@/components/mibidon/hero-mockup";
import {
  CountUp,
  Reveal,
  ScrollHeader,
  SpotlightCard,
} from "@/components/mibidon/landing-motion";
import { RoiCalculator } from "@/components/mibidon/roi-calculator";
import { whatsappHref } from "@/lib/whatsapp";

const DEMO_HREF = "https://demo.mibidon.cl";
const CLIENT_LOGIN_HREF = "/admin/login?tenant=plataforma";
const CONTACT_MAIL = "mailto:hola@mibidon.cl";

function cssVars(vars: Record<string, string | number>) {
  return vars as CSSProperties;
}

const HEADLINE: Array<{ text: string; accent?: boolean }> = [
  { text: "Tu" },
  { text: "tienda" },
  { text: "online" },
  { text: "de" },
  { text: "agua," },
  { text: "vendiendo", accent: true },
  { text: "en", accent: true },
  { text: "piloto", accent: true },
  { text: "automático", accent: true },
];

const STATS = [
  { n: 120, prefix: "+", suffix: "", label: "Purificadoras y embotelladoras" },
  { n: 24, prefix: "", suffix: " h", label: "Para tener tu tienda activa" },
  { n: 45, prefix: "+", suffix: "%", label: "Más recargas el primer mes" },
  { n: 0, prefix: "", suffix: "%", label: "Comisión por venta" },
];

const TRUST = [
  { icon: CreditCard, label: "WebPay Plus · Transbank" },
  { icon: FileCheck2, label: "Boleta electrónica SII" },
  { icon: Lock, label: "SSL 256-bit" },
  { icon: Globe, label: "Tu dominio .cl" },
  { icon: Truck, label: "Despacho por comuna" },
  { icon: Repeat, label: "Suscripciones de recarga" },
  { icon: Headphones, label: "Soporte en Chile" },
];

const FEATURES = [
  {
    icon: CreditCard,
    tone: "from-blue-600 to-sky-500",
    title: "Cobro automático con WebPay Plus",
    body: "Débito, crédito y prepago al instante. Cero comprobantes adulterados y conciliación bancaria en un clic.",
    tip: "Dinero directo a tu cuenta",
  },
  {
    icon: Repeat,
    tone: "from-cyan-500 to-teal-400",
    title: "Suscripciones y pedidos recurrentes",
    body: "Hogares y empresas programan recargas semanales o quincenales. Flujo de caja predecible mes a mes.",
    tip: "Fidelización sin llamadas",
  },
  {
    icon: Truck,
    tone: "from-indigo-600 to-blue-500",
    title: "Rutas y despachos por comuna",
    body: "Días de entrega, pedidos mínimos y costo de envío por sector. Tus choferes salen con la ruta ordenada.",
    tip: "Menos combustible, más entregas",
  },
  {
    icon: MousePointerClick,
    tone: "from-sky-500 to-cyan-400",
    title: "Compra en 2 toques",
    body: "Sin registros eternos ni apps que descargar. Funciona perfecto desde tu bio de Instagram o estado de WhatsApp.",
    tip: "3x más conversión que un eCommerce genérico",
  },
  {
    icon: LayoutDashboard,
    tone: "from-blue-700 to-indigo-500",
    title: "Panel de pedidos en tiempo real",
    body: "Ve cada pedido pagado, su comuna y estado de despacho. Exporta reportes de ventas cuando quieras.",
    tip: "Todo tu negocio en una pantalla",
  },
  {
    icon: Store,
    tone: "from-cyan-600 to-blue-500",
    title: "100% tu marca",
    body: "Tu logo, tus colores y tu dominio. Tus clientes nunca ven MiBidón: ven a tu empresa.",
    tip: "White-label de verdad",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Nos cuentas tu operación",
    body: "Productos, precios, comunas de reparto y días de despacho. Una llamada de 10 minutos.",
  },
  {
    n: "02",
    title: "Configuramos tu tienda",
    body: "Cargamos tu catálogo, conectamos tu WebPay y aplicamos tu marca. Lista en menos de 24 horas.",
  },
  {
    n: "03",
    title: "Compartes el link y vendes",
    body: "Publícalo en WhatsApp e Instagram. Los pedidos llegan pagados y ordenados por ruta.",
  },
];

const WEBPAY_BENEFITS = [
  {
    icon: Banknote,
    title: "La plata llega a tu cuenta",
    body: "Usamos tu propio código de comercio Transbank. No retenemos ni tocamos tus ventas.",
  },
  {
    icon: ShieldCheck,
    title: "Adiós comprobantes falsos",
    body: "Cada pedido se confirma solo cuando el pago está aprobado. Nada que revisar a mano.",
  },
  {
    icon: Zap,
    title: "Checkout en segundos",
    body: "Débito, crédito y prepago desde el celular, con la experiencia que tus clientes ya conocen.",
  },
  {
    icon: BarChart3,
    title: "Conciliación automática",
    body: "Ventas, pagos y despachos cuadran en el mismo panel. Cierra el día en un minuto.",
  },
];

const TESTIMONIALS = [
  {
    quote:
      "Aumentamos un 45% las recargas en el primer mes sin contratar más secretarias. Los pedidos entran pagados y los choferes saben exactamente adónde ir.",
    initials: "CM",
    name: "Carlos Morales",
    role: "Agua Manantial del Valle · Santiago",
  },
  {
    quote:
      "Antes pasaba 3 horas cada noche cuadrando transferencias truchas. Ahora con WebPay automático duermo tranquila y las empresas me compran solas.",
    initials: "AV",
    name: "Andrea Valenzuela",
    role: "Purificadora Aconcagua · Valparaíso",
  },
  {
    quote:
      "Pusimos el link en el estado de WhatsApp y el mismo día entraron 30 pedidos pagados. La suscripción quincenal nos ordenó la producción.",
    initials: "RP",
    name: "Rodrigo Pérez",
    role: "Aguas Cordillera · Rancagua",
  },
];

export default function MiBidonLandingPage() {
  const waTrial = whatsappHref(
    "Hola, quiero activar mi tienda en MiBidón con los 14 días gratis",
  );
  const waPro = whatsappHref(
    "Hola, quiero contratar el Plan Pro Despegue de MiBidón para mi purificadora",
  );
  const waEnterprise = whatsappHref(
    "Hola, tengo varias sucursales y quiero cotizar el plan Empresa de MiBidón",
  );
  const waAdvisor = whatsappHref(
    "Hola, quiero hablar con un asesor comercial de MiBidón",
  );

  const plans = [
    {
      name: "Prueba",
      price: "$0",
      period: "14 días",
      blurb: "Prueba el sistema completo con tu marca, sin tarjeta.",
      features: [
        "Tienda en tuempresa.mibidon.cl",
        "Catálogo y comunas configuradas",
        "Pedidos ilimitados de prueba",
        "Soporte por WhatsApp",
      ],
      cta: "Empezar gratis",
      href: waTrial,
      popular: false,
    },
    {
      name: "Pro Despegue",
      price: "$29.990",
      period: "/ mes",
      blurb: "Tu tienda llave en mano, configurada por especialistas.",
      features: [
        "Dominio propio .cl o subdominio",
        "WebPay Plus directo a tu cuenta",
        "Suscripciones de recarga",
        "Comunas, tarifas y rutas de despacho",
        "Migración y carga de catálogo gratis",
        "Soporte prioritario con asesor en Chile",
      ],
      cta: "Quiero mi tienda",
      href: waPro,
      popular: true,
    },
    {
      name: "Empresa",
      price: "A medida",
      period: "",
      blurb: "Para plantas con varias sucursales o flota propia.",
      features: [
        "Todo lo del plan Pro",
        "Múltiples sucursales y bodegas",
        "Integraciones y reportes a medida",
        "Ejecutivo de cuenta dedicado",
      ],
      cta: "Hablar con ventas",
      href: waEnterprise,
      popular: false,
    },
  ];

  return (
    <>
      <ScrollHeader>
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 md:px-8">
          <Link href="/" className="mb-nav-logo flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 via-sky-500 to-cyan-400 text-white shadow-[0_6px_20px_-4px_rgba(56,189,248,0.7)]">
              <Droplets className="size-5" />
            </span>
            <span className="flex flex-col leading-none">
              <span className="mb-display text-lg font-extrabold text-white">MiBidón</span>
              <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-sky-300/90">
                Tiendas para purificadoras
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-7 text-sm font-semibold text-slate-300 lg:flex">
            <a href="#plataforma" className="transition-colors hover:text-white">
              Plataforma
            </a>
            <a href="#calculadora" className="transition-colors hover:text-white">
              Calculadora
            </a>
            <a href="#webpay" className="transition-colors hover:text-white">
              WebPay
            </a>
            <a href="#precios" className="transition-colors hover:text-white">
              Precios
            </a>
            <a href={DEMO_HREF} className="transition-colors hover:text-white">
              Ejemplo de tienda
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href={CLIENT_LOGIN_HREF}
              className="hidden rounded-xl px-3 py-2 text-sm font-semibold text-slate-300 transition-colors hover:text-white md:block"
            >
              Acceso clientes
            </Link>
            <a
              href="#precios"
              className="mb-cta flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-bold"
            >
              <span>Empieza gratis</span>
              <ArrowRight className="size-4" />
            </a>
          </div>
        </div>
      </ScrollHeader>

      <main className="relative">
        {/* Hero */}
        <section className="mb-hero relative overflow-hidden pb-20 pt-28 text-white md:pb-28 md:pt-36">
          <div className="mb-grid-overlay pointer-events-none absolute inset-0" />
          <div className="mb-orb -right-24 -top-24 size-96 bg-blue-500/40" />
          <div
            className="mb-orb -left-32 bottom-0 size-80 bg-cyan-400/25"
            style={{ animationDelay: "-6s", animationDuration: "20s" }}
          />

          <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 md:px-8 lg:grid-cols-[1.02fr_1fr] lg:gap-10">
            <div className="flex flex-col gap-6">
              <div
                className="mb-fade-up inline-flex items-center gap-2 self-start rounded-full border border-sky-300/25 bg-sky-400/10 px-3.5 py-1.5 text-xs font-semibold text-sky-200 backdrop-blur"
                style={cssVars({ "--d": "0ms" })}
              >
                <Sparkles className="size-3.5 text-sky-300" />
                eCommerce white-label para purificadoras y embotelladoras
              </div>

              <h1 className="mb-display text-[2.6rem] font-extrabold leading-[1.05] sm:text-6xl lg:text-[4.1rem]">
                {HEADLINE.map((w, i) => (
                  <span key={i}>
                    <span
                      className={`mb-word ${w.accent ? "mb-gradient-text" : ""}`}
                      style={cssVars({ "--i": i })}
                    >
                      {w.text}
                    </span>{" "}
                  </span>
                ))}
              </h1>

              <p
                className="mb-fade-up max-w-xl text-lg leading-relaxed text-slate-300"
                style={cssVars({ "--d": "750ms" })}
              >
                Le damos a tu purificadora una tienda online con tu marca que
                recibe pedidos, ordena los despachos por comuna y cobra con{" "}
                <strong className="font-semibold text-white">WebPay en 2 clics</strong>.
                Lista en menos de 24 horas, sin comisiones por venta.
              </p>

              <div
                className="mb-fade-up flex flex-col gap-3 sm:flex-row"
                style={cssVars({ "--d": "900ms" })}
              >
                <a
                  href="#precios"
                  className="mb-cta flex min-h-14 items-center justify-center gap-2 rounded-2xl px-7 text-base font-bold"
                >
                  <Rocket className="size-5" />
                  <span>Comenzar gratis 14 días</span>
                </a>
                <a
                  href={DEMO_HREF}
                  className="group flex min-h-14 items-center justify-center gap-2.5 rounded-2xl border border-white/15 bg-white/[0.06] px-6 text-base font-semibold text-white backdrop-blur transition-colors hover:border-white/30 hover:bg-white/10"
                >
                  <span className="flex size-7 items-center justify-center rounded-full bg-white/15 transition-transform duration-300 group-hover:scale-110">
                    <Play className="size-3.5 fill-white" />
                  </span>
                  Ver tienda de ejemplo
                </a>
              </div>

              <div
                className="mb-fade-up flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-400"
                style={cssVars({ "--d": "1050ms" })}
              >
                {["Sin tarjeta de crédito", "0% comisión", "Cancela cuando quieras"].map((t) => (
                  <span key={t} className="flex items-center gap-1.5">
                    <Check className="size-4 text-emerald-400" />
                    {t}
                  </span>
                ))}
              </div>
            </div>

            <HeroMockup />
          </div>

          {/* Stats */}
          <div className="relative mx-auto mt-16 max-w-7xl px-5 md:mt-20 md:px-8">
            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/10 md:grid-cols-4">
              {STATS.map((s, i) => (
                <Reveal
                  key={s.label}
                  delayMs={i * 90}
                  className="flex flex-col gap-1 bg-[#071334]/80 px-6 py-6 backdrop-blur"
                >
                  <span className="mb-display text-4xl font-extrabold text-white md:text-5xl">
                    <CountUp value={s.n} prefix={s.prefix} suffix={s.suffix} durationMs={1400 + i * 150} />
                  </span>
                  <span className="text-sm text-slate-400">{s.label}</span>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Trust marquee */}
        <section className="border-b border-slate-200/80 bg-white py-6">
          <div className="mb-marquee overflow-hidden">
            <div className="mb-marquee-track flex w-max gap-12 pr-12">
              {[...TRUST, ...TRUST].map((t, i) => (
                <span
                  key={i}
                  aria-hidden={i >= TRUST.length}
                  className="flex shrink-0 items-center gap-2 text-sm font-semibold text-slate-500"
                >
                  <t.icon className="size-4 text-blue-600" />
                  {t.label}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Problem vs solution */}
        <section className="mx-auto max-w-7xl px-5 py-24 md:px-8">
          <Reveal className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-rose-600">
              El costo oculto de vender a la antigua
            </span>
            <h2 className="mb-display mt-3 text-3xl font-extrabold text-slate-900 md:text-5xl">
              WhatsApp y transferencias <span className="text-slate-400">vs.</span>{" "}
              <span className="mb-gradient-text-dark">tu tienda MiBidón</span>
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Cada mensaje que no contestas a tiempo es un bidón que vendió tu competencia.
            </p>
          </Reveal>

          <div className="mt-14 grid gap-6 md:grid-cols-2">
            <Reveal variant="left">
              <div className="h-full rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                    <X className="size-5" />
                  </span>
                  <h3 className="mb-display text-xl font-bold text-slate-900">El caos del WhatsApp</h3>
                </div>
                <ul className="mt-6 flex flex-col gap-4">
                  {[
                    ["Clientes perdidos", "Demoras en responder y se van con otro distribuidor."],
                    ["Comprobantes falsos", "Horas cuadrando transferencias en el banco."],
                    ["Rutas desordenadas", "Choferes dando vueltas sin orden por comuna."],
                    ["Cero recompra", "Dependes de que el cliente se acuerde de pedir."],
                  ].map(([k, val]) => (
                    <li key={k} className="flex gap-3 text-slate-600">
                      <X className="mt-0.5 size-4 shrink-0 text-rose-400" />
                      <span>
                        <strong className="font-semibold text-slate-800">{k}:</strong> {val}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>

            <Reveal variant="right" delayMs={120}>
              <div className="relative h-full overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-cyan-600 p-8 text-white shadow-[0_30px_60px_-25px_rgba(37,99,235,0.7)]">
                <div className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full bg-white/10 blur-2xl" />
                <div className="relative flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-white/15">
                      <Check className="size-5" />
                    </span>
                    <h3 className="mb-display text-xl font-bold">Con MiBidón</h3>
                  </div>
                  <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold">
                    +85% retención
                  </span>
                </div>
                <ul className="relative mt-6 flex flex-col gap-4">
                  {[
                    ["Cobro inmediato con WebPay", "La plata entra directo a tu cuenta."],
                    ["Despacho por comuna", "Rutas listas cada mañana para tus choferes."],
                    ["Suscripciones de recarga", "Ingresos fijos y clientes cautivos."],
                    ["100% tu marca", "Tu logo, tus colores, tu dominio."],
                  ].map(([k, val]) => (
                    <li key={k} className="flex gap-3 text-blue-50">
                      <Check className="mt-0.5 size-4 shrink-0 text-cyan-200" />
                      <span>
                        <strong className="font-semibold text-white">{k}:</strong> {val}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </section>

        {/* Features */}
        <section id="plataforma" className="relative scroll-mt-20 bg-gradient-to-b from-slate-50 via-blue-50/60 to-slate-50 py-24">
          <div className="mx-auto max-w-7xl px-5 md:px-8">
            <Reveal className="max-w-2xl">
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
                La plataforma
              </span>
              <h2 className="mb-display mt-3 text-3xl font-extrabold text-slate-900 md:text-5xl">
                Diseñada exclusivamente para el negocio del agua
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                No es un eCommerce genérico: resuelve los dolores reales de plantas
                purificadoras y distribuidores.
              </p>
            </Reveal>

            <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((f, i) => (
                <Reveal key={f.title} delayMs={(i % 3) * 100} variant="scale">
                  <SpotlightCard className="mb-lift h-full rounded-3xl border border-slate-200/80 bg-white/90 p-7 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_-16px_rgba(15,40,100,0.18)]">
                    <span
                      className={`flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br ${f.tone} text-white shadow-lg shadow-blue-500/20`}
                    >
                      <f.icon className="size-6" />
                    </span>
                    <h3 className="mb-display mt-5 text-lg font-bold text-slate-900">{f.title}</h3>
                    <p className="mt-2 leading-relaxed text-slate-600">{f.body}</p>
                    <p className="mt-4 flex items-center gap-1.5 text-sm font-semibold text-blue-700">
                      <Check className="size-4" />
                      {f.tip}
                    </p>
                  </SpotlightCard>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="mx-auto max-w-7xl px-5 py-24 md:px-8">
          <Reveal className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
              Cómo funciona
            </span>
            <h2 className="mb-display mt-3 text-3xl font-extrabold text-slate-900 md:text-5xl">
              De WhatsApp a tienda online en 24 horas
            </h2>
          </Reveal>
          <div className="relative mt-14 grid gap-6 md:grid-cols-3">
            <div
              aria-hidden
              className="absolute left-[16%] right-[16%] top-9 hidden h-px bg-gradient-to-r from-blue-200 via-cyan-300 to-blue-200 md:block"
            />
            {STEPS.map((s, i) => (
              <Reveal key={s.n} delayMs={i * 140} className="relative flex flex-col items-center text-center">
                <span className="mb-display relative flex size-[72px] items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-xl font-extrabold text-white shadow-[0_16px_32px_-12px_rgba(37,99,235,0.7)]">
                  {s.n}
                </span>
                <h3 className="mb-display mt-6 text-xl font-bold text-slate-900">{s.title}</h3>
                <p className="mt-2 max-w-xs leading-relaxed text-slate-600">{s.body}</p>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ROI */}
        <section id="calculadora" className="mb-dark-band relative scroll-mt-20 overflow-hidden py-24 text-white">
          <div className="mb-grid-overlay pointer-events-none absolute inset-0 opacity-60" />
          <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 md:px-8 lg:grid-cols-2">
            <Reveal variant="left" className="flex flex-col gap-5">
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-sky-300">
                Calculadora de ganancias
              </span>
              <h2 className="mb-display text-3xl font-extrabold md:text-5xl">
                ¿Cuánto podrías vender{" "}
                <span className="mb-gradient-text">con tu tienda online?</span>
              </h2>
              <p className="text-lg leading-relaxed text-slate-300">
                Mueve el control con tus bidones del mes. Con pedidos pagados al
                instante y recargas programadas, el plan se paga solo desde la
                primera semana.
              </p>
              <ul className="flex flex-col gap-3 text-slate-200">
                {[
                  "Pedidos pagados antes de salir a ruta",
                  "Clientes que recargan solos cada semana",
                  "Menos horas respondiendo WhatsApp",
                ].map((t) => (
                  <li key={t} className="flex items-center gap-3">
                    <span className="flex size-6 items-center justify-center rounded-full bg-sky-400/20">
                      <Check className="size-3.5 text-sky-300" />
                    </span>
                    {t}
                  </li>
                ))}
              </ul>
            </Reveal>
            <Reveal variant="right" delayMs={120}>
              <RoiCalculator />
            </Reveal>
          </div>
        </section>

        {/* WebPay */}
        <section id="webpay" className="mx-auto max-w-7xl scroll-mt-20 px-5 py-24 md:px-8">
          <div className="grid items-center gap-14 lg:grid-cols-[1fr_1.1fr]">
            <Reveal variant="left" className="relative">
              <div className="absolute inset-6 rounded-[2rem] bg-gradient-to-br from-blue-400/30 to-cyan-300/30 blur-3xl" />
              <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#061331] via-[#0a2160] to-[#0b3b63] p-8 text-white shadow-[0_40px_80px_-30px_rgba(15,40,100,0.6)]">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-300">Pagos de hoy</span>
                  <span className="flex items-center gap-1.5 rounded-full bg-emerald-400/15 px-2.5 py-1 text-xs font-bold text-emerald-300">
                    <span className="size-1.5 rounded-full bg-emerald-400" /> En línea
                  </span>
                </div>
                <p className="mb-display mt-3 text-5xl font-extrabold">
                  $<CountUp value={1284500} />
                </p>
                <p className="mt-1 text-sm text-slate-400">Abonado a tu cuenta corriente</p>
                <div className="mt-7 flex flex-col gap-3">
                  {[
                    ["Pedido #1291 · Providencia", "$14.000", "Débito"],
                    ["Pedido #1290 · Las Condes", "$21.000", "Crédito"],
                    ["Suscripción · Oficina Vitacura", "$56.000", "Crédito"],
                  ].map(([k, amount, method], i) => (
                    <Reveal
                      key={k}
                      delayMs={250 + i * 120}
                      className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex size-8 items-center justify-center rounded-lg bg-emerald-400/15 text-emerald-300">
                          <Check className="size-4" />
                        </span>
                        <div className="leading-tight">
                          <p className="text-sm font-semibold">{k}</p>
                          <p className="text-xs text-slate-400">WebPay Plus · {method}</p>
                        </div>
                      </div>
                      <span className="font-bold">{amount}</span>
                    </Reveal>
                  ))}
                </div>
              </div>
            </Reveal>

            <div>
              <Reveal>
                <span className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
                  Pagos con WebPay Plus
                </span>
                <h2 className="mb-display mt-3 text-3xl font-extrabold text-slate-900 md:text-5xl">
                  Cobra antes de cargar el camión
                </h2>
                <p className="mt-4 text-lg text-slate-600">
                  Conectamos tu comercio Transbank para que cada pedido llegue
                  pagado. Sin transferencias pendientes ni fiado.
                </p>
              </Reveal>
              <div className="mt-10 grid gap-4 sm:grid-cols-2">
                {WEBPAY_BENEFITS.map((b, i) => (
                  <Reveal key={b.title} delayMs={i * 90}>
                    <SpotlightCard className="mb-lift h-full rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
                      <b.icon className="size-6 text-blue-600" />
                      <h3 className="mb-display mt-3 font-bold text-slate-900">{b.title}</h3>
                      <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{b.body}</p>
                    </SpotlightCard>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="bg-gradient-to-b from-slate-50 via-sky-50/70 to-slate-50 py-24">
          <div className="mx-auto max-w-7xl px-5 md:px-8">
            <Reveal className="mx-auto max-w-2xl text-center">
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
                Resultados reales
              </span>
              <h2 className="mb-display mt-3 text-3xl font-extrabold text-slate-900 md:text-5xl">
                Purificadoras que ya escalaron
              </h2>
            </Reveal>
            <div className="mt-14 grid gap-6 md:grid-cols-3">
              {TESTIMONIALS.map((t, i) => (
                <Reveal key={t.name} delayMs={i * 110}>
                  <figure className="mb-lift flex h-full flex-col rounded-3xl border border-slate-200/80 bg-white p-7 shadow-sm">
                    <div className="flex gap-0.5 text-amber-400">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <Star key={j} className="size-4 fill-current" />
                      ))}
                    </div>
                    <blockquote className="mt-4 flex-1 leading-relaxed text-slate-700">
                      “{t.quote}”
                    </blockquote>
                    <figcaption className="mt-6 flex items-center gap-3 border-t border-slate-100 pt-5">
                      <span className="flex size-11 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 text-sm font-bold text-white">
                        {t.initials}
                      </span>
                      <span className="leading-tight">
                        <span className="block font-bold text-slate-900">{t.name}</span>
                        <span className="text-sm text-slate-500">{t.role}</span>
                      </span>
                    </figcaption>
                  </figure>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="precios" className="mx-auto max-w-7xl scroll-mt-20 px-5 py-24 md:px-8">
          <Reveal className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200">
              <Sparkles className="size-3.5" />
              Oferta de lanzamiento · 0% comisión
            </span>
            <h2 className="mb-display mt-4 text-3xl font-extrabold text-slate-900 md:text-5xl">
              Empieza a vender esta misma semana
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Prueba el sistema completo 14 días, sin tarjeta y sin amarres.
            </p>
          </Reveal>

          <div className="mt-16 grid items-stretch gap-6 lg:grid-cols-3 lg:gap-5">
            {plans.map((p, i) => (
              <Reveal key={p.name} delayMs={i * 120} variant="scale" className={p.popular ? "lg:-my-4" : ""}>
                {p.popular ? (
                  <div className="mb-popular h-full rounded-[1.75rem]">
                    <div className="mb-popular-halo" aria-hidden />
                    <div className="mb-popular-glow" aria-hidden />
                    <SpotlightCard className="flex h-full flex-col rounded-[1.7rem] bg-gradient-to-b from-[#071334] to-[#0b2259] p-8 text-white">
                      <div className="flex items-center justify-between">
                        <h3 className="mb-display text-lg font-bold">{p.name}</h3>
                        <span className="rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 px-3 py-1 text-xs font-bold uppercase tracking-wide">
                          Más elegido
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-slate-300">{p.blurb}</p>
                      <p className="mt-6 flex items-baseline gap-1.5">
                        <span className="mb-display text-5xl font-extrabold">{p.price}</span>
                        <span className="text-slate-400">{p.period}</span>
                      </p>
                      <a
                        href={p.href}
                        className="mb-cta mt-7 flex min-h-12 items-center justify-center gap-2 rounded-xl text-base font-bold"
                      >
                        <span>{p.cta}</span>
                        <ArrowRight className="size-4" />
                      </a>
                      <ul className="mt-8 flex flex-col gap-3 text-sm">
                        {p.features.map((f) => (
                          <li key={f} className="flex gap-3 text-slate-200">
                            <Check className="size-4 shrink-0 text-cyan-300" />
                            {f}
                          </li>
                        ))}
                      </ul>
                      <p className="mt-auto flex items-center gap-1.5 pt-8 text-xs text-slate-400">
                        <ShieldCheck className="size-4 text-emerald-400" />
                        Garantía de satisfacción de 30 días
                      </p>
                    </SpotlightCard>
                  </div>
                ) : (
                  <SpotlightCard className="mb-lift flex h-full flex-col rounded-[1.75rem] border border-slate-200 bg-white p-8 shadow-sm">
                    <h3 className="mb-display text-lg font-bold text-slate-900">{p.name}</h3>
                    <p className="mt-2 text-sm text-slate-600">{p.blurb}</p>
                    <p className="mt-6 flex items-baseline gap-1.5">
                      <span className="mb-display text-5xl font-extrabold text-slate-900">{p.price}</span>
                      <span className="text-slate-500">{p.period}</span>
                    </p>
                    <a
                      href={p.href}
                      className="mt-7 flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white text-base font-bold text-slate-900 transition-colors hover:border-blue-500 hover:text-blue-700"
                    >
                      {p.cta}
                      <ArrowRight className="size-4" />
                    </a>
                    <ul className="mt-8 flex flex-col gap-3 text-sm">
                      {p.features.map((f) => (
                        <li key={f} className="flex gap-3 text-slate-600">
                          <Check className="size-4 shrink-0 text-blue-600" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </SpotlightCard>
                )}
              </Reveal>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-gradient-to-b from-slate-50 to-blue-50/50 py-24">
          <div className="mx-auto grid max-w-6xl gap-10 px-5 md:px-8 lg:grid-cols-[0.8fr_1.2fr]">
            <Reveal>
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
                Preguntas frecuentes
              </span>
              <h2 className="mb-display mt-3 text-3xl font-extrabold text-slate-900 md:text-4xl">
                Resolvemos tus dudas antes de activar
              </h2>
              <p className="mt-4 text-slate-600">
                ¿No encuentras tu respuesta? Escríbenos y un asesor te responde en minutos.
              </p>
              <a
                href={waAdvisor}
                className="mt-6 inline-flex items-center gap-2 font-semibold text-blue-700 transition-colors hover:text-blue-900"
              >
                <MessageCircle className="size-5" />
                Hablar con un asesor
              </a>
            </Reveal>
            <Reveal delayMs={100}>
              <FaqAccordion />
            </Reveal>
          </div>
        </section>

        {/* Demo CTA */}
        <section className="px-5 py-24 md:px-8">
          <Reveal variant="scale">
            <div className="mb-hero relative mx-auto max-w-6xl overflow-hidden rounded-[2.5rem] px-6 py-16 text-center text-white shadow-[0_50px_100px_-40px_rgba(15,40,100,0.7)] md:px-16 md:py-20">
              <div className="mb-grid-overlay pointer-events-none absolute inset-0" />
              <div className="mb-orb -right-20 -top-20 size-72 bg-blue-500/40" />
              <div className="mb-orb -bottom-24 -left-16 size-72 bg-cyan-400/30" style={{ animationDelay: "-5s" }} />
              <div className="relative mx-auto flex max-w-2xl flex-col items-center gap-6">
                <h2 className="mb-display text-3xl font-extrabold md:text-5xl">
                  Mira cómo se vería <span className="mb-gradient-text">tu propia tienda</span>
                </h2>
                <p className="text-lg text-slate-300">
                  Recorre una tienda real funcionando con MiBidón y agenda una demo
                  de 10 minutos con un especialista en distribución de agua.
                </p>
                <div className="flex w-full flex-col justify-center gap-3 sm:flex-row">
                  <a
                    href={DEMO_HREF}
                    className="mb-cta flex min-h-14 items-center justify-center gap-2 rounded-2xl px-7 text-base font-bold"
                  >
                    <Store className="size-5" />
                    <span>Ver tienda de ejemplo</span>
                  </a>
                  <a
                    href={waAdvisor}
                    className="flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-7 text-base font-bold text-white shadow-[0_12px_30px_-10px_rgba(16,185,129,0.8)] transition-colors hover:bg-emerald-400"
                  >
                    <MessageCircle className="size-5" />
                    Agendar demo por WhatsApp
                  </a>
                </div>
              </div>
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 py-12 md:flex-row md:items-center md:justify-between md:px-8">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 text-white">
                <Droplets className="size-4" />
              </span>
              <span className="mb-display text-lg font-extrabold text-slate-900">MiBidón</span>
            </div>
            <p className="max-w-sm text-sm text-slate-500">
              Plataforma eCommerce white-label para purificadoras y embotelladoras de agua en Chile.
            </p>
          </div>
          <nav className="flex flex-wrap gap-x-7 gap-y-3 text-sm font-semibold text-slate-600">
            <a href="#plataforma" className="hover:text-blue-700">Plataforma</a>
            <a href="#precios" className="hover:text-blue-700">Precios</a>
            <a href={DEMO_HREF} className="hover:text-blue-700">Ejemplo de tienda</a>
            <Link href={CLIENT_LOGIN_HREF} className="hover:text-blue-700">Acceso clientes</Link>
            <a href={CONTACT_MAIL} className="flex items-center gap-1.5 hover:text-blue-700">
              <Mail className="size-4" /> hola@mibidon.cl
            </a>
          </nav>
        </div>
        <div className="border-t border-slate-100 py-5 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} MiBidón Chile
        </div>
      </footer>

      <a
        href={waAdvisor}
        aria-label="Hablar con ventas por WhatsApp"
        className="fixed bottom-5 right-5 z-40 flex size-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-[0_14px_30px_-8px_rgba(16,185,129,0.8)] transition-transform duration-300 hover:scale-110"
      >
        <MessageCircle className="size-6" />
      </a>
    </>
  );
}
