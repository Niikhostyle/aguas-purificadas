import type { LandingContent } from "@/lib/landing/schema";

/**
 * Stitch v2 copy. Used to seed `platform_landing_sections` and as the
 * per-section fallback whenever the DB row is missing, invalid or unreachable.
 * Inline formatting: **negrita** and _cursiva_. Tokens: {dias}, {prueba}.
 */
export const LANDING_DEFAULTS: LandingContent = {
  trial: {
    enabled: true,
    content: {
      days: 14,
      label: "días gratis",
      ctaLabel: "Comenzar gratis {dias} días",
      headerCtaLabel: "Probar Gratis",
      pricingNote: "{dias} días de prueba sin costo • Cancela cuando quieras",
      whatsappMessage:
        "Hola MiBidón, quiero comenzar mi prueba gratis de {dias} días para mi purificadora.",
      noTrialCtaLabel: "Quiero mi tienda",
    },
  },
  announcement: {
    enabled: true,
    content: {
      badge: "OFERTA ACTIVA",
      text: "Asegura {prueba} + integración WebPay Plus sin costo de instalación este mes",
      textNoTrial: "Integración WebPay Plus sin costo de instalación este mes",
      linkLabel: "Ver Plan Despegue →",
      linkHref: "#precios",
    },
  },
  hero: {
    enabled: true,
    content: {
      badge: "Software Oficial para Embotelladoras de Agua",
      headline: "Multiplica tus ventas de agua purificada en",
      headlineAccent: "piloto automático",
      body: "La plataforma eCommerce white-label que digitaliza pedidos, optimiza rutas y cobra con **WebPay Plus en 2 clics**. Lista en menos de 24 horas y con tu propio logo.",
      secondaryCtaLabel: "Ver demostración en vivo (2 min)",
      secondaryCtaHref: "https://demo.mibidon.cl/",
      chips: [
        { id: "chip-1", label: "Sin comisiones por recarga" },
        { id: "chip-2", label: "100% bajo tu marca" },
        { id: "chip-3", label: "Sin tarjeta de crédito" },
      ],
      liveText: "**3 nuevas plantas activadas** esta semana en Chile",
      showSimulator: true,
      simulatorNavLabel: "Simulador de ROI",
    },
  },
  trust: {
    enabled: true,
    content: {
      eyebrow: "Ecosistema Validado",
      text: "+120 embotelladoras y distribuidores ya escalaron sus ventas en Chile",
      badges: [
        { id: "badge-1", icon: "ShieldCheck", label: "WebPay Plus Transbank" },
        { id: "badge-2", icon: "ReceiptText", label: "Boleta Electrónica SII" },
        { id: "badge-3", icon: "Lock", label: "Seguridad SSL 256-Bit" },
      ],
    },
  },
  stats: {
    enabled: true,
    content: {
      title: "Crecimiento real medible desde el primer mes",
      body: "Nuestras plantas purificadoras asociadas reportan resultados inmediatos tras reemplazar notas de WhatsApp.",
      items: [
        { id: "stat-1", icon: "Store", label: "Embotelladoras activas", value: 120, prefix: "+", suffix: "", trend: "+45% en 2024" },
        { id: "stat-2", icon: "RefreshCw", label: "Retención mensual promedio", value: 85, prefix: "", suffix: "%", trend: "+18% recompra recurrente" },
        { id: "stat-3", icon: "Rocket", label: "Nuevas tiendas esta semana", value: 3, prefix: "", suffix: "", trend: "+100% velocidad onboarding" },
      ],
    },
  },
  comparison: {
    enabled: true,
    content: {
      navLabel: "WhatsApp vs MiBidón",
      eyebrow: "El Diagnóstico del Negocio",
      title: "El alto costo de vender solo por WhatsApp vs. MiBidón",
      body: "Seguir anotando pedidos a mano te hace perder hasta un 30% de clientes que se van con la competencia que sí tiene web.",
      badge: "Sistema MiBidón",
      manual: {
        title: "Vender Manual por WhatsApp",
        subtitle: "Caos operativo y fuga de dinero",
        items: [
          { id: "pain-1", title: "Comprobantes falsos o sin verificar:", body: "Pérdidas constantes por transferencias dudosas que nadie alcanza a revisar en el banco." },
          { id: "pain-2", title: "Clientes olvidados en el chat:", body: "Mensajes que quedan abajo en la lista y clientes que terminan pidiéndole al camión vecino." },
          { id: "pain-3", title: "Rutas desordenadas:", body: "Choferes dando vueltas en círculos por la ciudad sin orden por sector ni franjas horarias." },
          { id: "pain-4", title: "Cero recurrencia garantizada:", body: "Dependes de que el cliente se acuerde de pedirte cuando ya se quedó sin agua." },
        ],
        result: "Resultado: Estrés diario y tope de crecimiento",
        bars: [
          { id: "bar-m1", label: "Clientes que se van a la competencia", percent: 30 },
          { id: "bar-m2", label: "Jornada perdida en chats y transferencias", percent: 50 },
        ],
      },
      mibidon: {
        title: "Tu eCommerce con MiBidón",
        subtitle: "100% automatizado y profesional",
        items: [
          { id: "win-1", title: "Cobro WebPay Plus al instante:", body: "El cliente paga con débito o crédito en 2 clics antes de despachar. Cero cheques o transferencias manuales." },
          { id: "win-2", title: "Ruta de despacho inteligente:", body: "El sistema agrupa pedidos por sector, comuna y día de entrega automáticamente para tus choferes." },
          { id: "win-3", title: "Recordatorios y suscripción automática:", body: "Notificaciones SMS/WhatsApp para recargas quincenales. Retención del 85%." },
          { id: "win-4", title: "Control de envases retornables:", body: "Registro exacto de quién tiene tus bidones vacíos para no perder inventario caro." },
        ],
        result: "Resultado: +40% pedidos con la mitad del tiempo operativo",
        bars: [
          { id: "bar-b1", label: "Más pedidos", percent: 40 },
          { id: "bar-b2", label: "Retención mensual", percent: 85 },
        ],
      },
    },
  },
  features: {
    enabled: true,
    content: {
      navLabel: "Ventajas Clave",
      eyebrow: "Herramientas Diseñadas para Agua",
      title: "Funcionalidades hechas para embotelladoras",
      body: "No uses Shopify o WooCommerce genéricos. MiBidón resuelve el retorno de botellones, la logística local y el pago rápido.",
      items: [
        { id: "feat-1", icon: "CreditCard", title: "WebPay Plus Directo", body: "Sin enredos. El dinero va a tu cuenta bancaria. Acepta Débito, Crédito y Mach al segundo." },
        { id: "feat-2", icon: "RefreshCw", title: "Recargas Recurrentes", body: "Tus clientes se suscriben a 2, 4 u 8 bidones mensuales. Ingreso fijo y predecible todos los meses." },
        { id: "feat-3", icon: "MapPin", title: "Zonas y Despachos", body: "Configura comunas, días de reparto específicos y tarifas de envío según distancia en segundos." },
        { id: "feat-4", icon: "Pointer", title: "Compra en 2 Toques", body: "Optimizada para celulares. Tus clientes no descargan apps pesadas: entran, tocan 'Repetir pedido' y listo." },
      ],
    },
  },
  showcase: {
    enabled: true,
    content: {
      eyebrow: "Control Total en Tiempo Real",
      title: "Un panel de despachos que tu chofer entenderá en 5 minutos",
      body: "Cada mañana el sistema genera la hoja de ruta con direcciones verificadas en Waze y Google Maps, número de envases a retirar y estado de pago confirmado.",
      linkLabel: "Probar el panel de control gratis",
      imageUrl: "/brand/stitch/panel-despachos.jpg",
      imageAlt:
        "Panel de despachos MiBidón en una tablet con mapa de rutas, inventario de bidones y estado de pagos WebPay",
    },
  },
  testimonials: {
    enabled: true,
    content: {
      navLabel: "Casos de Éxito",
      eyebrow: "Testimonios Reales",
      title: "Lo que dicen los dueños de purificadoras",
      body: "Empresas en Santiago, Valparaíso, Concepción y regiones ya transformaron su operación diaria.",
      items: [
        {
          id: "testi-1",
          name: "Carlos Muñoz",
          role: "Fundador, Agua Manantial del Valle (Rancagua)",
          quote:
            "Aumentamos un **45% las recargas el primer mes** sin contratar más personal de oficina. Antes pasaba 4 horas al día respondiendo mensajes de WhatsApp y confirmando si la transferencia había caído. Ahora solo despachamos.",
          avatarUrl: "/brand/stitch/carlos-munoz.jpg",
        },
        {
          id: "testi-2",
          name: "Andrea Valenzuela",
          role: "Gerenta de Operaciones, Purificadora Aconcagua",
          quote:
            "Los clientes pagan con tarjeta al tiro y **las rutas salen ordenadas cada mañana**. Ya no tenemos pérdidas de envases porque el sistema le cobra automáticamente garantía al cliente que pide bidón nuevo.",
          avatarUrl: "/brand/stitch/andrea-valenzuela.jpg",
        },
      ],
    },
  },
  pricing: {
    enabled: true,
    content: {
      navLabel: "Planes",
      eyebrow: "Inversión Simple y Clara",
      title: "Empieza hoy y recupera tu inversión en los primeros 10 bidones",
      body: "Sin comisiones por venta. Lo que vendes es 100% tuyo.",
      footnote: "Garantía de activación en 24 horas hábiles",
      plans: [
        {
          id: "plan-pro",
          active: true,
          highlighted: true,
          name: "Plan Pro Despegue",
          badge: "Más elegido",
          headline: "Plataforma White-Label Completa",
          description: "Todo incluido para embotelladoras y distribuidores",
          price: 34990,
          period: "CLP / mes",
          features: [
            { id: "pf-1", text: "**0% de comisión** por venta o botellón vendido" },
            { id: "pf-2", text: "Tu propio dominio y logo (ej: _pedidos.tuagua.cl_)" },
            { id: "pf-3", text: "Integración Transbank WebPay Plus directa a tu banco" },
            { id: "pf-4", text: "Módulo de gestión de envases y bidones en préstamo" },
            { id: "pf-5", text: "Rutas automáticas ordenadas por comuna y chofer" },
            { id: "pf-6", text: "Soporte prioritario por WhatsApp en Chile" },
          ],
          ctaLabel: "Quiero mi tienda ahora",
          ctaUrl: "https://billing.mibidon.cl/order/plan-mibidon",
        },
      ],
    },
  },
  faq: {
    enabled: true,
    content: {
      eyebrow: "Respuestas Claras",
      title: "Preguntas Frecuentes",
      body: "Derribamos todas tus dudas antes de empezar tu prueba gratuita.",
      items: [
        {
          id: "faq-1",
          q: "¿El dinero de las ventas va directo a mi cuenta bancaria?",
          a: "Sí, 100%. MiBidón se conecta directamente con tu código de comercio de WebPay Plus (Transbank). Los pagos se abonan en tu cuenta corriente o vista registrada sin pasar por cuentas intermedias.",
        },
        {
          id: "faq-2",
          q: "¿Qué necesito para empezar a vender hoy mismo?",
          a: "Solo necesitas el nombre de tu purificadora, las comunas donde repartes y tus precios por bidón (recarga y bidón con envase nuevo). Nuestro equipo te entrega la tienda configurada en menos de 24 horas.",
        },
        {
          id: "faq-3",
          q: "¿Puedo usar mi propio dominio web (ej: www.miagua.cl)?",
          a: "Por supuesto. Puedes enlazar tu propio dominio .cl o .com sin costo extra. La tienda llevará únicamente tus logos, colores y datos de contacto; no aparece la marca MiBidón ante tus clientes.",
        },
        {
          id: "faq-4",
          q: "¿Cómo resuelven el tema de los bidones retornables?",
          a: "El sistema tiene una lógica específica para purificadoras: el cliente selecciona si ya tiene envase vacío para intercambiar o si necesita comprar el botellón completo. Además, queda registrado en su ficha de cliente.",
        },
      ],
    },
  },
  advisor: {
    enabled: true,
    content: {
      title: "¿Prefieres conversar con una persona antes de decidir?",
      body: "Un asesor comercial te muestra una demo personalizada de 10 minutos para tu planta.",
      ctaLabel: "Hablar con un asesor comercial",
      whatsappMessage:
        "Hola MiBidón, quiero hablar con un asesor comercial y ver una demo para mi planta.",
    },
  },
  footer: {
    enabled: true,
    content: {
      brandText: "MiBidón · ECommerce Purificadoras",
      demoLabel: "Ver tienda demo",
      loginLabel: "Acceso clientes",
      contactEmail: "hola@mibidon.cl",
    },
  },
};
