import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Ban,
  BadgeCheck,
  Calculator,
  ChevronDown,
  CircleCheck,
  CirclePlay,
  CreditCard,
  House,
  Lock,
  MapPin,
  MessageCircle,
  MessageSquareMore,
  Pointer,
  ReceiptText,
  RefreshCw,
  Rocket,
  ShieldCheck,
  Star,
  Store,
  Tag,
  TrendingUp,
  Truck,
  Zap,
} from "lucide-react";
import {
  CountUp,
  Parallax,
  Reveal,
  ScrollHeader,
  SpotlightCard,
} from "@/components/mibidon/landing-motion";
import { RevenueSimulator } from "@/components/mibidon/revenue-simulator";
import { whatsappHref } from "@/lib/whatsapp";

const DEMO_HREF = "https://demo.mibidon.cl";
const CLIENT_LOGIN_HREF = "/admin/login?tenant=plataforma";
const CONTACT_MAIL = "mailto:hola@mibidon.cl";

function d(ms: number) {
  return { "--d": `${ms}ms` } as CSSProperties;
}

const HEADLINE = ["Multiplica", "tus", "ventas", "de", "agua", "purificada", "en"];

const STATS = [
  { label: "Embotelladoras activas", icon: Store, value: 120, prefix: "+", suffix: "", trend: "+45% en 2024" },
  { label: "Retención mensual promedio", icon: RefreshCw, value: 85, prefix: "", suffix: "%", trend: "+18% recompra recurrente" },
  { label: "Nuevas tiendas esta semana", icon: Rocket, value: 3, prefix: "", suffix: "", trend: "+100% velocidad onboarding" },
];

const WHATSAPP_PAINS = [
  ["Comprobantes falsos o sin verificar:", "Pérdidas constantes por transferencias dudosas que nadie alcanza a revisar en el banco."],
  ["Clientes olvidados en el chat:", "Mensajes que quedan abajo en la lista y clientes que terminan pidiéndole al camión vecino."],
  ["Rutas desordenadas:", "Choferes dando vueltas en círculos por la ciudad sin orden por sector ni franjas horarias."],
  ["Cero recurrencia garantizada:", "Dependes de que el cliente se acuerde de pedirte cuando ya se quedó sin agua."],
];

const MIBIDON_WINS = [
  ["Cobro WebPay Plus al instante:", "El cliente paga con débito o crédito en 2 clics antes de despachar. Cero cheques o transferencias manuales."],
  ["Ruta de despacho inteligente:", "El sistema agrupa pedidos por sector, comuna y día de entrega automáticamente para tus choferes."],
  ["Recordatorios y suscripción automática:", "Notificaciones SMS/WhatsApp para recargas quincenales. Retención del 85%."],
  ["Control de envases retornables:", "Registro exacto de quién tiene tus bidones vacíos para no perder inventario caro."],
];

const FEATURES = [
  { icon: CreditCard, title: "WebPay Plus Directo", body: "Sin enredos. El dinero va a tu cuenta bancaria. Acepta Débito, Crédito y Mach al segundo." },
  { icon: RefreshCw, title: "Recargas Recurrentes", body: "Tus clientes se suscriben a 2, 4 u 8 bidones mensuales. Ingreso fijo y predecible todos los meses." },
  { icon: MapPin, title: "Zonas y Despachos", body: "Configura comunas, días de reparto específicos y tarifas de envío según distancia en segundos." },
  { icon: Pointer, title: "Compra en 2 Toques", body: "Optimizada para celulares. Tus clientes no descargan apps pesadas: entran, tocan 'Repetir pedido' y listo." },
];

const TESTIMONIALS = [
  {
    quote: (
      <>
        &ldquo;Aumentamos un <strong>45% las recargas el primer mes</strong> sin contratar más personal de
        oficina. Antes pasaba 4 horas al día respondiendo mensajes de WhatsApp y confirmando si la
        transferencia había caído. Ahora solo despachamos.&rdquo;
      </>
    ),
    name: "Carlos Muñoz",
    role: "Fundador, Agua Manantial del Valle (Rancagua)",
    photo: "/brand/stitch/carlos-munoz.jpg",
  },
  {
    quote: (
      <>
        &ldquo;Los clientes pagan con tarjeta al tiro y <strong>las rutas salen ordenadas cada mañana</strong>.
        Ya no tenemos pérdidas de envases porque el sistema le cobra automáticamente garantía al cliente
        que pide bidón nuevo.&rdquo;
      </>
    ),
    name: "Andrea Valenzuela",
    role: "Gerenta de Operaciones, Purificadora Aconcagua",
    photo: "/brand/stitch/andrea-valenzuela.jpg",
  },
];

const PLAN_FEATURES = [
  <>
    <strong>0% de comisión</strong> por venta o botellón vendido
  </>,
  <>
    Tu propio dominio y logo (ej: <em>pedidos.tuagua.cl</em>)
  </>,
  <>Integración Transbank WebPay Plus directa a tu banco</>,
  <>Módulo de gestión de envases y bidones en préstamo</>,
  <>Rutas automáticas ordenadas por comuna y chofer</>,
  <>Soporte prioritario por WhatsApp en Chile</>,
];

const FAQS = [
  {
    q: "¿El dinero de las ventas va directo a mi cuenta bancaria?",
    a: "Sí, 100%. MiBidón se conecta directamente con tu código de comercio de WebPay Plus (Transbank). Los pagos se abonan en tu cuenta corriente o vista registrada sin pasar por cuentas intermedias.",
  },
  {
    q: "¿Qué necesito para empezar a vender hoy mismo?",
    a: "Solo necesitas el nombre de tu purificadora, las comunas donde repartes y tus precios por bidón (recarga y bidón con envase nuevo). Nuestro equipo te entrega la tienda configurada en menos de 24 horas.",
  },
  {
    q: "¿Puedo usar mi propio dominio web (ej: www.miagua.cl)?",
    a: "Por supuesto. Puedes enlazar tu propio dominio .cl o .com sin costo extra. La tienda llevará únicamente tus logos, colores y datos de contacto; no aparece la marca MiBidón ante tus clientes.",
  },
  {
    q: "¿Cómo resuelven el tema de los bidones retornables?",
    a: "El sistema tiene una lógica específica para purificadoras: el cliente selecciona si ya tiene envase vacío para intercambiar o si necesita comprar el botellón completo. Además, queda registrado en su ficha de cliente.",
  },
];

function DropLogo({ className = "" }: { className?: string }) {
  return (
    <svg fill="currentColor" viewBox="0 0 256 256" className={className} aria-hidden>
      <path d="M174,47.75a254.19,254.19,0,0,0-41.45-38.3,8,8,0,0,0-9.18,0A254.19,254.19,0,0,0,82,47.75C54.51,79.32,40,112.6,40,144a88,88,0,0,0,176,0C216,112.6,201.49,79.32,174,47.75ZM128,216a72.08,72.08,0,0,1-72-72c0-57.23,55.47-105,72-118,16.53,13,72,60.75,72,118A72.08,72.08,0,0,1,128,216Zm55.89-62.66a57.6,57.6,0,0,1-46.56,46.55A8.75,8.75,0,0,1,136,200a8,8,0,0,1-1.32-15.89c16.57-2.79,30.63-16.85,33.44-33.45a8,8,0,0,1,15.78,2.68Z" />
    </svg>
  );
}

function SectionIntro({
  eyebrow,
  title,
  body,
  className = "mb-12 max-w-3xl",
}: {
  eyebrow: string;
  title: string;
  body: string;
  className?: string;
}) {
  return (
    <Reveal className={`mx-auto text-center ${className}`}>
      <span className="text-xs font-bold uppercase tracking-widest text-sv-secondary">{eyebrow}</span>
      <h2 className="sv-display mt-1 text-2xl font-black text-sv-primary sm:text-4xl">{title}</h2>
      <p className="mt-3 text-base text-sv-on-surface-variant">{body}</p>
    </Reveal>
  );
}

export default function MiBidonLanding() {
  const waTrial = whatsappHref(
    "Hola MiBidón, quiero comenzar mi prueba gratis de 14 días para mi purificadora.",
  );
  const waPlan = whatsappHref(
    "Hola MiBidón, quiero mi tienda con el Plan Pro Despegue ($34.990/mes).",
  );
  const waAdvisor = whatsappHref(
    "Hola MiBidón, quiero hablar con un asesor comercial y ver una demo para mi planta.",
  );

  return (
    <div className="pb-32 sm:pb-20 md:pb-0">
      {/* Announcement bar */}
      <div className="flex flex-wrap items-center justify-center gap-2 border-b border-sv-surface-tint/30 sv-label bg-sv-primary-container px-4 py-2.5 text-center text-xs font-medium text-sv-surface">
        <span className="inline-flex items-center rounded-full bg-sv-secondary-container px-2 py-0.5 text-[10px] font-bold text-sv-on-secondary-container">
          OFERTA ACTIVA
        </span>
        <span>Asegura 14 días gratis + integración WebPay Plus sin costo de instalación este mes</span>
        <a className="font-bold underline transition-colors hover:text-sv-secondary-fixed" href="#precios">
          Ver Plan Despegue →
        </a>
      </div>

      {/* Header */}
      <ScrollHeader className="sticky top-0 z-40 border-b border-sv-surface-high bg-sv-surface/95 px-4 backdrop-blur-md sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link href="/" className="mb-nav-logo flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-sv-surface-high text-sv-secondary">
              <DropLogo className="size-6" />
            </div>
            <div>
              <p className="sv-display text-xl font-bold leading-none tracking-tight text-sv-primary">MiBidón</p>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-sv-secondary">
                ECommerce Purificadoras
              </span>
            </div>
          </Link>
          <nav className="sv-label hidden items-center gap-8 text-sm font-medium text-sv-on-surface-variant lg:flex">
            <a className="transition-colors hover:text-sv-primary" href="#beneficios">Ventajas Clave</a>
            <a className="transition-colors hover:text-sv-primary" href="#comparativa">WhatsApp vs MiBidón</a>
            <a className="transition-colors hover:text-sv-primary" href="#simulador">Simulador de ROI</a>
            <a className="transition-colors hover:text-sv-primary" href="#testimonios">Casos de Éxito</a>
            <a className="transition-colors hover:text-sv-primary" href="#precios">Planes</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link
              className="hidden rounded-lg px-3 py-2 text-sm font-semibold text-sv-primary transition-colors hover:bg-sv-surface-container sm:inline-block"
              href={CLIENT_LOGIN_HREF}
            >
              Ingresar
            </Link>
            <a
              className="sv-shine flex items-center gap-1.5 rounded-lg bg-sv-primary px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-sv-primary-container sm:text-sm"
              href="#precios"
            >
              <span>Probar Gratis</span>
              <ArrowRight className="sv-arrow size-4" aria-hidden />
            </a>
          </div>
        </div>
      </ScrollHeader>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-sv-surface-low via-sv-surface to-sv-surface pb-16 pt-8 lg:pb-24 lg:pt-16">
        <div className="sv-blob -left-24 top-10 h-72 w-72 bg-sv-secondary-container/20" />
        <div className="sv-blob -right-20 bottom-0 h-80 w-80 bg-sv-surface-highest/70" style={{ animationDelay: "-6s" }} />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
            <div className="flex flex-col gap-6 text-left lg:col-span-7">
              <div
                className="mb-fade-up inline-flex items-center gap-2 self-start rounded-full border border-sv-secondary/20 bg-sv-secondary-fixed/50 px-3.5 py-1.5"
                style={d(80)}
              >
                <span className="relative flex h-2 w-2">
                  <span className="mb-ping absolute inline-flex h-full w-full rounded-full bg-sv-secondary opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-sv-secondary" />
                </span>
                <span className="text-xs font-bold uppercase tracking-wide text-sv-on-secondary-fixed-variant">
                  Software Oficial para Embotelladoras de Agua
                </span>
              </div>
              <h1 className="sv-display text-3xl font-black leading-tight tracking-tight text-sv-primary sm:text-4xl lg:text-5xl">
                {HEADLINE.map((w, i) => (
                  <span key={w + i}>
                    <span className="mb-word" style={{ "--i": i } as CSSProperties}>
                      {w}
                    </span>{" "}
                  </span>
                ))}
                <span
                  className="mb-word text-sv-secondary underline decoration-sv-secondary-container decoration-4 underline-offset-4"
                  style={{ "--i": HEADLINE.length } as CSSProperties}
                >
                  piloto automático
                </span>
              </h1>
              <p
                className="mb-fade-up max-w-2xl text-base leading-relaxed text-sv-on-surface-variant sm:text-lg"
                style={d(650)}
              >
                La plataforma eCommerce white-label que digitaliza pedidos, optimiza rutas y cobra con{" "}
                <strong>WebPay Plus en 2 clics</strong>. Lista en menos de 24 horas y con tu propio logo.
              </p>
              <div className="mb-fade-up flex flex-col gap-3 pt-2 sm:flex-row" style={d(800)}>
                <a
                  className="sv-shine inline-flex items-center justify-center gap-2 rounded-xl bg-sv-primary-container px-6 py-4 text-base font-semibold text-white shadow-lg hover:bg-sv-primary hover:shadow-xl"
                  href={waTrial}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span>Comenzar gratis 14 días</span>
                  <Rocket className="sv-arrow size-5" aria-hidden />
                </a>
                <a
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-sv-outline-variant bg-sv-surface-lowest px-6 py-4 text-base font-semibold text-sv-on-surface transition-all hover:-translate-y-0.5 hover:bg-sv-surface-container"
                  href={DEMO_HREF}
                >
                  <CirclePlay className="size-5 text-sv-secondary" aria-hidden />
                  <span>Ver demostración en vivo (2 min)</span>
                </a>
              </div>
              <div
                className="mb-fade-up sv-label flex flex-wrap items-center gap-x-4 gap-y-2 pt-1 text-xs text-sv-on-surface-variant"
                style={d(950)}
              >
                <span className="inline-flex items-center gap-1 font-bold text-sv-on-secondary-fixed-variant">
                  <Zap className="size-3.5" aria-hidden /> Sin comisiones por recarga
                </span>
                <span className="inline-flex items-center gap-1 font-semibold">
                  <BadgeCheck className="size-3.5 text-sv-secondary" aria-hidden /> 100% bajo tu marca
                </span>
                <span className="inline-flex items-center gap-1 font-semibold">
                  <Ban className="size-3.5 text-sv-secondary" aria-hidden /> Sin tarjeta de crédito
                </span>
              </div>
              <div
                className="mb-fade-up mt-4 flex max-w-md items-center justify-between rounded-xl border border-sv-surface-highest bg-sv-surface-container p-3"
                style={d(1100)}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base" aria-hidden>🔥</span>
                  <p className="text-xs font-semibold text-sv-primary">
                    <strong>3 nuevas plantas activadas</strong> esta semana en Chile
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded bg-sv-surface-lowest px-2 py-1 text-[11px] font-bold text-sv-secondary">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="mb-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-70" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  </span>
                  En Vivo
                </span>
              </div>
            </div>

            <Parallax className="relative lg:col-span-5">
              <div className="mb-pop" style={d(450)}>
                <div className="mb-layer" style={{ "--depth": 10 } as CSSProperties}>
                  <div className="mb-float">
                    <RevenueSimulator />
                  </div>
                </div>
              </div>
              <div
                className="mb-layer pointer-events-none absolute -top-8 right-20 hidden xl:block"
                style={{ "--depth": -22 } as CSSProperties}
              >
                <div className="mb-pop" style={d(1200)}>
                  <div className="mb-float flex items-center gap-2 rounded-xl border border-sv-surface-high bg-white/95 px-3 py-2 shadow-lg" style={{ "--fd": "-2s" } as CSSProperties}>
                    <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                      <CircleCheck className="size-4" aria-hidden />
                    </span>
                    <div className="leading-tight">
                      <p className="text-[11px] font-bold text-sv-primary">Pago WebPay aprobado</p>
                      <p className="text-[10px] text-sv-on-surface-variant">2 bidones · $7.000</p>
                    </div>
                  </div>
                </div>
              </div>
              <div
                className="mb-layer pointer-events-none absolute -bottom-6 -right-6 hidden xl:block"
                style={{ "--depth": -16 } as CSSProperties}
              >
                <div className="mb-pop" style={d(1400)}>
                  <div className="mb-float flex items-center gap-2 rounded-xl border border-sv-surface-high bg-white/95 px-3 py-2 shadow-lg" style={{ "--fd": "-4s" } as CSSProperties}>
                    <span className="flex size-7 items-center justify-center rounded-lg bg-sv-secondary-fixed text-sv-secondary">
                      <Truck className="size-4" aria-hidden />
                    </span>
                    <div className="leading-tight">
                      <p className="text-[11px] font-bold text-sv-primary">Ruta del día lista</p>
                      <p className="text-[10px] text-sv-on-surface-variant">18 entregas · 3 comunas</p>
                    </div>
                  </div>
                </div>
              </div>
            </Parallax>
          </div>
        </div>
      </section>

      {/* Social proof & trust badges */}
      <section className="border-y border-sv-surface-high bg-sv-surface py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <Reveal className="text-center md:text-left">
              <p className="text-xs font-bold uppercase tracking-widest text-sv-secondary">Ecosistema Validado</p>
              <p className="text-base font-bold text-sv-primary">
                +120 embotelladoras y distribuidores ya escalaron sus ventas en Chile
              </p>
            </Reveal>
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8">
              {[
                { icon: ShieldCheck, label: "WebPay Plus Transbank", tone: "text-sv-secondary" },
                { icon: ReceiptText, label: "Boleta Electrónica SII", tone: "text-emerald-600" },
                { icon: Lock, label: "Seguridad SSL 256-Bit", tone: "text-sv-secondary" },
              ].map((b, i) => (
                <Reveal key={b.label} delayMs={i * 90} variant="scale">
                  <div className="flex items-center gap-2 rounded-lg border border-sv-surface-container bg-sv-surface-low px-3 py-2 text-xs font-bold text-sv-on-surface transition-transform duration-300 hover:-translate-y-0.5">
                    <b.icon className={`size-[18px] ${b.tone}`} aria-hidden />
                    <span>{b.label}</span>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Metrics */}
      <section className="bg-sv-surface-low py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal className="mx-auto mb-8 max-w-2xl text-center">
            <h2 className="sv-display text-2xl font-extrabold text-sv-primary sm:text-3xl">
              Crecimiento real medible desde el primer mes
            </h2>
            <p className="mt-2 text-sm text-sv-on-surface-variant">
              Nuestras plantas purificadoras asociadas reportan resultados inmediatos tras reemplazar notas de WhatsApp.
            </p>
          </Reveal>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {STATS.map((s, i) => (
              <Reveal key={s.label} delayMs={i * 110}>
                <SpotlightCard className="mb-lift flex h-full flex-col gap-2 rounded-xl border border-sv-surface-high bg-sv-surface-lowest p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-sv-on-surface">{s.label}</p>
                    <s.icon className="size-[18px] text-sv-secondary" aria-hidden />
                  </div>
                  <p className="sv-display text-3xl font-extrabold tracking-tight text-sv-primary">
                    <CountUp value={s.value} prefix={s.prefix} suffix={s.suffix} />
                  </p>
                  <div className="flex w-fit items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-600">
                    <TrendingUp className="size-3.5" aria-hidden />
                    <span>{s.trend}</span>
                  </div>
                </SpotlightCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* WhatsApp vs MiBidón */}
      <section className="scroll-mt-20 bg-sv-surface py-16" id="comparativa">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionIntro
            eyebrow="El Diagnóstico del Negocio"
            title="El alto costo de vender solo por WhatsApp vs. MiBidón"
            body="Seguir anotando pedidos a mano te hace perder hasta un 30% de clientes que se van con la competencia que sí tiene web."
          />
          <div className="grid grid-cols-1 items-stretch gap-8 md:grid-cols-2">
            <Reveal variant="left" className="h-full">
              <div className="flex h-full flex-col justify-between rounded-2xl border border-red-200/60 bg-red-50/50 p-6 sm:p-8">
                <div>
                  <div className="flex items-center gap-3 border-b border-red-200/50 pb-4">
                    <div className="flex size-10 items-center justify-center rounded-full bg-red-100 text-xl font-bold text-sv-error">✕</div>
                    <div>
                      <h3 className="sv-display text-lg font-bold text-sv-primary">Vender Manual por WhatsApp</h3>
                      <p className="text-xs font-semibold text-sv-error">Caos operativo y fuga de dinero</p>
                    </div>
                  </div>
                  <ul className="my-6 space-y-4 text-sm font-medium text-sv-on-surface-variant">
                    {WHATSAPP_PAINS.map(([t, b], i) => (
                      <Reveal as="li" key={t} delayMs={150 + i * 90} className="flex items-start gap-3">
                        <span className="font-bold text-sv-error">✗</span>
                        <span>
                          <strong>{t}</strong> {b}
                        </span>
                      </Reveal>
                    ))}
                  </ul>
                </div>
                <div className="rounded-xl bg-red-100/60 p-3 text-center text-xs font-bold text-sv-error">
                  Resultado: Estrés diario y tope de crecimiento
                </div>
              </div>
            </Reveal>
            <Reveal variant="right" delayMs={120} className="h-full">
              <div className="relative flex h-full flex-col justify-between rounded-2xl border-2 border-sv-secondary bg-sv-surface-low p-6 shadow-lg transition-shadow duration-500 hover:shadow-2xl sm:p-8">
                <div className="absolute -top-3.5 right-6 rounded-full bg-sv-secondary px-3 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-sm">
                  Sistema MiBidón
                </div>
                <div>
                  <div className="flex items-center gap-3 border-b border-sv-surface-high pb-4">
                    <div className="flex size-10 items-center justify-center rounded-full bg-sv-secondary-fixed text-xl font-bold text-sv-secondary">✓</div>
                    <div>
                      <h3 className="sv-display text-lg font-bold text-sv-primary">Tu eCommerce con MiBidón</h3>
                      <p className="text-xs font-bold text-sv-secondary">100% automatizado y profesional</p>
                    </div>
                  </div>
                  <ul className="my-6 space-y-4 text-sm font-medium text-sv-on-surface">
                    {MIBIDON_WINS.map(([t, b], i) => (
                      <Reveal as="li" key={t} delayMs={250 + i * 90} className="flex items-start gap-3">
                        <span className="font-bold text-emerald-600">✓</span>
                        <span>
                          <strong>{t}</strong> {b}
                        </span>
                      </Reveal>
                    ))}
                  </ul>
                </div>
                <div className="rounded-xl bg-sv-secondary-fixed/50 p-3 text-center text-xs font-bold text-sv-on-secondary-fixed-variant">
                  Resultado: +40% pedidos con la mitad del tiempo operativo
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="scroll-mt-20 bg-sv-surface-low py-16" id="beneficios">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionIntro
            className="mb-14 max-w-3xl"
            eyebrow="Herramientas Diseñadas para Agua"
            title="Funcionalidades hechas para embotelladoras"
            body="No uses Shopify o WooCommerce genéricos. MiBidón resuelve el retorno de botellones, la logística local y el pago rápido."
          />
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} delayMs={i * 100}>
                <SpotlightCard className="mb-lift h-full rounded-2xl border border-sv-surface-high bg-sv-surface-lowest p-6 shadow-sm">
                  <div className="sv-icon-tile mb-4 flex size-12 items-center justify-center rounded-xl bg-sv-surface-container text-sv-secondary">
                    <f.icon className="size-6" aria-hidden />
                  </div>
                  <h3 className="sv-display mb-2 text-lg font-bold text-sv-primary">{f.title}</h3>
                  <p className="text-sm leading-relaxed text-sv-on-surface-variant">{f.body}</p>
                </SpotlightCard>
              </Reveal>
            ))}
          </div>

          <Reveal variant="scale" className="mt-12">
            <div className="flex flex-col items-center gap-8 rounded-2xl border border-sv-surface-high bg-sv-surface-lowest p-6 shadow-md sm:p-10 lg:flex-row">
              <div className="w-full space-y-4 lg:w-1/2">
                <span className="text-xs font-bold uppercase tracking-wider text-sv-secondary">
                  Control Total en Tiempo Real
                </span>
                <h3 className="sv-display text-2xl font-bold text-sv-primary">
                  Un panel de despachos que tu chofer entenderá en 5 minutos
                </h3>
                <p className="text-sm leading-relaxed text-sv-on-surface-variant">
                  Cada mañana el sistema genera la hoja de ruta con direcciones verificadas en Waze y Google Maps,
                  número de envases a retirar y estado de pago confirmado.
                </p>
                <div className="pt-2">
                  <a className="inline-flex items-center gap-2 text-sm font-bold text-sv-secondary hover:underline" href="#precios">
                    <span>Probar el panel de control gratis</span>
                    <ArrowRight className="sv-arrow size-4" aria-hidden />
                  </a>
                </div>
              </div>
              <Parallax className="w-full lg:w-1/2">
                <div className="mb-layer" style={{ "--depth": 8 } as CSSProperties}>
                  <div className="mb-float" style={{ "--fd": "-3s" } as CSSProperties}>
                    <Image
                      src="/brand/stitch/panel-despachos.jpg"
                      alt="Panel de despachos MiBidón en una tablet con mapa de rutas, inventario de bidones y estado de pagos WebPay"
                      width={512}
                      height={279}
                      sizes="(min-width: 1024px) 560px, 100vw"
                      className="h-64 w-full rounded-xl border border-sv-surface-high object-cover shadow-sm sm:h-72"
                    />
                  </div>
                </div>
              </Parallax>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Testimonials */}
      <section className="scroll-mt-20 bg-sv-surface py-16" id="testimonios">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionIntro
            className="mb-12 max-w-2xl"
            eyebrow="Testimonios Reales"
            title="Lo que dicen los dueños de purificadoras"
            body="Empresas en Santiago, Valparaíso, Concepción y regiones ya transformaron su operación diaria."
          />
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {TESTIMONIALS.map((t, i) => (
              <Reveal key={t.name} delayMs={i * 140} className="h-full">
                <SpotlightCard className="mb-lift flex h-full flex-col justify-between rounded-2xl border border-sv-surface-high bg-sv-surface-low p-6 sm:p-8">
                  <div>
                    <div className="mb-4 flex items-center gap-1 text-amber-500">
                      {Array.from({ length: 5 }).map((_, k) => (
                        <Star key={k} className="size-[18px] fill-current" aria-hidden />
                      ))}
                    </div>
                    <p className="text-base italic leading-relaxed text-sv-on-surface sm:text-lg">{t.quote}</p>
                  </div>
                  <div className="mt-6 flex items-center gap-4 border-t border-sv-surface-container pt-6">
                    <Image
                      src={t.photo}
                      alt={t.name}
                      width={96}
                      height={96}
                      className="size-12 rounded-full border border-sv-outline-variant object-cover"
                    />
                    <div>
                      <p className="text-sm font-bold text-sv-primary">{t.name}</p>
                      <p className="text-xs text-sv-on-surface-variant">{t.role}</p>
                    </div>
                  </div>
                </SpotlightCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="relative scroll-mt-20 overflow-hidden bg-sv-surface-low py-16" id="precios">
        <div className="sv-blob left-1/2 top-1/3 h-96 w-96 -translate-x-1/2 bg-sv-secondary-container/15" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionIntro
            eyebrow="Inversión Simple y Clara"
            title="Empieza hoy y recupera tu inversión en los primeros 10 bidones"
            body="Sin comisiones por venta. Lo que vendes es 100% tuyo."
          />
          <Reveal variant="scale" className="mx-auto max-w-lg">
            <div className="relative rounded-3xl border-2 border-sv-secondary bg-sv-surface-lowest p-8 shadow-2xl transition-transform duration-500 hover:-translate-y-1 sm:p-10">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-sv-secondary px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-md sm:text-xs">
                PLAN PRO DESPEGUE • MÁS ELEGIDO
              </div>
              <div className="border-b border-sv-surface-container pb-6 text-center">
                <h3 className="sv-display text-2xl font-black text-sv-primary">Plataforma White-Label Completa</h3>
                <p className="mt-1 text-sm text-sv-on-surface-variant">Todo incluido para embotelladoras y distribuidores</p>
                <div className="mt-4 flex items-baseline justify-center gap-1">
                  <span className="sv-display text-4xl font-black text-sv-primary sm:text-5xl">
                    <CountUp value={34990} prefix="$" durationMs={1400} />
                  </span>
                  <span className="text-sm font-semibold text-sv-on-surface-variant">CLP / mes</span>
                </div>
                <p className="mt-1 text-xs font-bold text-sv-secondary">
                  14 días de prueba sin costo • Cancela cuando quieras
                </p>
              </div>
              <ul className="space-y-3.5 py-6 text-sm text-sv-on-surface">
                {PLAN_FEATURES.map((f, i) => (
                  <Reveal as="li" key={i} delayMs={120 + i * 70} className="flex items-center gap-3">
                    <CircleCheck className="size-[18px] shrink-0 text-emerald-600" aria-hidden />
                    <span>{f}</span>
                  </Reveal>
                ))}
              </ul>
              <a
                className="sv-shine flex w-full items-center justify-center gap-1.5 rounded-xl bg-sv-primary px-6 py-4 text-center text-base font-bold text-white shadow-lg hover:bg-sv-primary-container hover:shadow-xl"
                href={waPlan}
                target="_blank"
                rel="noopener noreferrer"
                style={{ "--shine-delay": "0.6s" } as CSSProperties}
              >
                <span>Quiero mi tienda ahora</span>
                <ArrowRight className="sv-arrow size-5" aria-hidden />
              </a>
              <p className="mt-3 flex items-center justify-center gap-1 text-center text-xs text-sv-outline">
                <BadgeCheck className="size-4 text-emerald-600" aria-hidden />
                <span>Garantía de activación en 24 horas hábiles</span>
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-sv-surface py-16" id="faq">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <SectionIntro
            eyebrow="Respuestas Claras"
            title="Preguntas Frecuentes"
            body="Derribamos todas tus dudas antes de empezar tu prueba gratuita."
          />
          <div className="space-y-4">
            {FAQS.map((f, i) => (
              <Reveal key={f.q} delayMs={i * 80}>
                <details className="sv-faq group cursor-pointer rounded-xl border border-sv-surface-high bg-sv-surface-low p-5">
                  <summary className="flex list-none items-center justify-between gap-4 text-base font-bold text-sv-primary">
                    <span>{f.q}</span>
                    <ChevronDown className="sv-faq-icon size-5 shrink-0 text-sv-secondary" aria-hidden />
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-sv-on-surface-variant">{f.a}</p>
                </details>
              </Reveal>
            ))}
          </div>

          <Reveal variant="scale" className="mt-12">
            <div className="flex flex-col items-center justify-between gap-6 rounded-2xl border border-sv-surface-highest bg-sv-surface-container p-6 text-center sm:flex-row sm:p-8">
              <div className="text-left">
                <h4 className="text-lg font-bold text-sv-primary">¿Prefieres conversar con una persona antes de decidir?</h4>
                <p className="mt-1 text-sm text-sv-on-surface-variant">
                  Un asesor comercial te muestra una demo personalizada de 10 minutos para tu planta.
                </p>
              </div>
              <a
                className="sv-shine flex items-center gap-2 whitespace-nowrap rounded-xl bg-emerald-600 px-6 py-3.5 font-semibold text-white shadow-md hover:bg-emerald-700"
                href={waAdvisor}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle className="size-5" aria-hidden />
                <span>Hablar con un asesor comercial</span>
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      <footer className="border-t border-sv-surface-high bg-sv-surface-low py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 text-xs text-sv-on-surface-variant sm:flex-row sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <DropLogo className="size-4 text-sv-secondary" />
            <span>© {new Date().getFullYear()} MiBidón · ECommerce Purificadoras</span>
          </div>
          <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 font-medium">
            <a href={DEMO_HREF} className="hover:text-sv-primary">Ver tienda demo</a>
            <Link href={CLIENT_LOGIN_HREF} className="hover:text-sv-primary">Acceso clientes</Link>
            <a href={CONTACT_MAIL} className="hover:text-sv-primary">hola@mibidon.cl</a>
          </nav>
        </div>
      </footer>

      {/* Mobile sticky CTA */}
      <div className="fixed inset-x-0 bottom-14 z-30 border-t border-sv-surface-high bg-sv-surface/95 p-3 backdrop-blur-md sm:hidden">
        <a
          className="sv-shine flex w-full items-center justify-center gap-2 rounded-lg bg-sv-primary py-3 text-xs font-bold text-white shadow-md"
          href={waTrial}
          target="_blank"
          rel="noopener noreferrer"
        >
          <span>Comenzar gratis 14 días</span>
          <Rocket className="size-4" aria-hidden />
        </a>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-50 md:hidden" aria-label="Navegación rápida">
        <div className="flex gap-2 border-t border-[#e8ecf2] bg-[#f8fafb] px-4 pb-3 pt-2">
          {[
            { href: "#", label: "Inicio", icon: House, active: true },
            { href: "#simulador", label: "Simulador", icon: Calculator },
            { href: "#precios", label: "Planes", icon: Tag },
            { href: waAdvisor, label: "WhatsApp", icon: MessageSquareMore },
          ].map((item) => (
            <a
              key={item.label}
              href={item.href}
              className={`flex flex-1 flex-col items-center justify-end gap-1 transition-transform active:scale-95 ${item.active ? "text-[#0e131a]" : "text-[#516a94]"}`}
            >
              <span className="flex h-8 items-center justify-center">
                <item.icon className="size-6" strokeWidth={item.active ? 2.5 : 2} aria-hidden />
              </span>
              <span className="text-xs font-medium leading-normal tracking-[0.015em]">{item.label}</span>
            </a>
          ))}
        </div>
      </nav>
    </div>
  );
}
