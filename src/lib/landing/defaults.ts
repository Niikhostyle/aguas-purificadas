import type { LandingContent } from "@/lib/landing/schema";

export const DEMO_STORE_URL = "https://demo.mibidon.cl";
export const DEMO_ADMIN_URL = "https://demo.mibidon.cl/admin/demo-access";

/**
 * Concise landing copy. Used to seed `platform_landing_sections`, as the
 * per-section fallback whenever the DB row is missing, invalid or unreachable,
 * and by scripts/landing-apply-concise.ts to update existing rows.
 * Inline formatting: **negrita** and _cursiva_. Tokens: {dias}, {prueba}.
 * Disabled sections keep editable content so they can be re-enabled from the CMS.
 */
export const LANDING_DEFAULTS: LandingContent = {
  trial: {
    enabled: false,
    content: {
      days: 14,
      label: "días gratis",
      ctaLabel: "Comenzar gratis {dias} días",
      headerCtaLabel: "Probar gratis",
      pricingNote: "{dias} días de prueba sin costo",
      whatsappMessage:
        "Hola MiBidón, quiero comenzar mi prueba gratis de {dias} días para mi purificadora.",
      noTrialCtaLabel: "Ver planes",
    },
  },
  announcement: {
    enabled: false,
    content: {
      badge: "",
      text: "Explora la demo en vivo, sin registro",
      textNoTrial: "Explora la demo en vivo, sin registro",
      linkLabel: "Ver demo →",
      linkHref: DEMO_STORE_URL,
    },
  },
  hero: {
    enabled: true,
    content: {
      badge: "Plataforma para distribuidoras de agua",
      headline: "Vende agua purificada online",
      headlineAccent: "con tu propia marca",
      body: "Pedidos, pagos con **WebPay Plus** y despachos en una sola plataforma. Tu tienda lista en 24 horas.",
      secondaryCtaLabel: "Probar la demo en vivo",
      secondaryCtaHref: DEMO_STORE_URL,
      whatsappLabel: "¿Dudas? Escríbenos por WhatsApp",
      chips: [
        { id: "chip-1", label: "Demo sin registro" },
        { id: "chip-2", label: "0% comisión por venta" },
        { id: "chip-3", label: "100% bajo tu marca" },
      ],
      liveText: "",
      showSimulator: false,
      simulatorNavLabel: "",
    },
  },
  demo: {
    enabled: true,
    content: {
      navLabel: "Ver demo",
      badge: "Demo en vivo",
      title: "Explora una tienda real y su panel admin, sin registro",
      body: "",
      storeLabel: "Ver tienda demo",
      storeHref: DEMO_STORE_URL,
      adminLabel: "Ver panel admin demo",
      adminHref: DEMO_ADMIN_URL,
      imageUrl: "/brand/stitch/panel-despachos.jpg",
      imageAlt: "Panel de despachos MiBidón con rutas del día, envases y estado de pagos",
    },
  },
  trust: {
    enabled: true,
    content: {
      eyebrow: "",
      text: "",
      badges: [
        { id: "badge-1", icon: "CreditCard", label: "Pagos con WebPay Plus" },
        { id: "badge-2", icon: "BadgeCheck", label: "0% comisión por venta" },
        { id: "badge-3", icon: "Clock", label: "Tienda lista en 24 horas" },
        { id: "badge-4", icon: "Headset", label: "Soporte por WhatsApp" },
      ],
    },
  },
  steps: {
    enabled: true,
    content: {
      navLabel: "Cómo funciona",
      eyebrow: "Cómo funciona",
      title: "Tu tienda online en 3 pasos",
      body: "",
      items: [
        { id: "step-1", title: "Elige tu plan", body: "Contrata en línea y cuéntanos tus comunas y precios." },
        { id: "step-2", title: "Configuramos tu tienda", body: "Tu logo, colores y productos, listos en 24 horas." },
        { id: "step-3", title: "Empieza a vender", body: "Recibe pedidos pagados y organiza tus despachos." },
      ],
    },
  },
  stats: {
    enabled: false,
    content: {
      title: "Crecimiento real medible desde el primer mes",
      body: "",
      items: [],
    },
  },
  comparison: {
    enabled: false,
    content: {
      navLabel: "",
      eyebrow: "",
      title: "Vender por WhatsApp vs. MiBidón",
      body: "",
      badge: "MiBidón",
      manual: {
        title: "Venta manual por WhatsApp",
        subtitle: "",
        items: [
          { id: "pain-1", title: "Transferencias sin verificar.", body: "" },
          { id: "pain-2", title: "Pedidos perdidos en el chat.", body: "" },
          { id: "pain-3", title: "Rutas sin orden.", body: "" },
        ],
        result: "",
        bars: [],
      },
      mibidon: {
        title: "Tu tienda con MiBidón",
        subtitle: "",
        items: [
          { id: "win-1", title: "Pago WebPay antes de despachar.", body: "" },
          { id: "win-2", title: "Pedidos ordenados en tu panel.", body: "" },
          { id: "win-3", title: "Rutas por comuna y sector.", body: "" },
        ],
        result: "",
        bars: [],
      },
    },
  },
  features: {
    enabled: true,
    content: {
      navLabel: "Funcionalidades",
      eyebrow: "Funcionalidades",
      title: "Hecho para distribuidoras de agua",
      body: "",
      items: [
        { id: "feat-1", icon: "CreditCard", title: "WebPay Plus", body: "Débito y crédito, abonados directo a tu cuenta." },
        { id: "feat-2", icon: "Smartphone", title: "Compra en 2 toques", body: "Pensada para celular, sin descargar apps." },
        { id: "feat-3", icon: "MapPin", title: "Zonas de despacho", body: "Comunas, días de reparto y costos de envío a tu medida." },
        { id: "feat-4", icon: "Route", title: "Rutas del día", body: "Pedidos agrupados por comuna y sector para tus repartidores." },
        { id: "feat-5", icon: "Recycle", title: "Envases retornables", body: "Controla qué cliente tiene tus bidones y cuántos debe." },
        { id: "feat-6", icon: "Bell", title: "Recordatorios", body: "Avisa por WhatsApp a tus clientes cuando les toca reponer." },
      ],
    },
  },
  showcase: {
    enabled: false,
    content: {
      eyebrow: "",
      title: "Un panel de despachos simple para tu equipo",
      body: "",
      linkLabel: "",
      imageUrl: "/brand/stitch/panel-despachos.jpg",
      imageAlt: "Panel de despachos MiBidón con rutas del día, envases y estado de pagos",
    },
  },
  testimonials: {
    enabled: false,
    content: {
      navLabel: "",
      eyebrow: "",
      title: "Lo que dicen nuestros clientes",
      body: "",
      items: [],
    },
  },
  pricing: {
    enabled: true,
    content: {
      navLabel: "Precios",
      eyebrow: "Precio",
      title: "Un plan simple, todo incluido",
      body: "Sin comisiones por venta. Lo que vendes es 100% tuyo.",
      footnote: "Activación en 24 horas hábiles",
      plans: [
        {
          id: "plan-pro",
          active: true,
          highlighted: true,
          name: "Plan MiBidón",
          badge: "Tienda Online",
          headline: "Todo incluido",
          description: "Para distribuidoras y plantas purificadoras",
          price: 34990,
          period: "CLP / mes",
          features: [
            { id: "pf-1", text: "**0% comisión** por venta" },
            { id: "pf-2", text: "Tienda con tu logo y colores" },
            { id: "pf-3", text: "WebPay Plus directo a tu cuenta" },
            { id: "pf-4", text: "Despachos y rutas por comuna" },
            { id: "pf-5", text: "Control de envases retornables" },
            { id: "pf-6", text: "Soporte por WhatsApp" },
          ],
          ctaLabel: "Comenzar",
          ctaUrl: "https://billing.mibidon.cl/order/plan-mibidon",
        },
      ],
    },
  },
  faq: {
    enabled: true,
    content: {
      eyebrow: "",
      title: "Preguntas frecuentes",
      body: "",
      items: [
        {
          id: "faq-1",
          q: "¿Puedo probar antes de contratar?",
          a: "Sí. La tienda y el panel admin de demo.mibidon.cl están abiertos, sin registro.",
        },
        {
          id: "faq-2",
          q: "¿El dinero de las ventas llega directo a mi cuenta?",
          a: "Sí. Los pagos se procesan con tu comercio WebPay Plus (Transbank) y se abonan en tu cuenta, sin intermediarios.",
        },
        {
          id: "faq-3",
          q: "¿Qué necesito para empezar?",
          a: "Tu logo, las comunas donde repartes y tus precios. Nosotros configuramos la tienda en 24 horas hábiles.",
        },
        {
          id: "faq-4",
          q: "¿Cómo funcionan los bidones retornables?",
          a: "El cliente indica si tiene envase para intercambiar o compra uno nuevo. Cada entrega y devolución queda registrada.",
        },
      ],
    },
  },
  advisor: {
    enabled: true,
    content: {
      title: "¿Listo para vender online?",
      body: "Prueba la demo o conversa con nuestro equipo.",
      ctaLabel: "Hablar por WhatsApp",
      whatsappMessage: "Hola MiBidón, quiero conocer la plataforma para mi distribuidora de agua.",
    },
  },
  footer: {
    enabled: true,
    content: {
      logoUrl: "/brand/mibidon/logo.png",
      brandText: "MiBidón · Plataforma para distribuidoras de agua",
      demoLabel: "Demo",
      loginLabel: "Acceso clientes",
      contactEmail: "hola@mibidon.cl",
    },
  },
};
