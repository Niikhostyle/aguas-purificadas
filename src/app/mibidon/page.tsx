import Link from "next/link";
import { whatsappHref } from "@/lib/whatsapp";

const PRODUCTS = [
  {
    id: "recarga",
    name: "Recarga 20L",
    price: "$2.500",
    blurb: "Llena tu bidón en casa. Agua purificada lista para beber.",
    message:
      "Hola MiBidón, quiero pedir una Recarga 20L a domicilio en Cauquenes.",
  },
  {
    id: "envase",
    name: "Envase Nuevo",
    price: "$8.990",
    blurb: "Bidón nuevo + primera carga. Ideal si estás partiendo.",
    message:
      "Hola MiBidón, quiero un Envase Nuevo 20L con primera carga en Cauquenes.",
  },
  {
    id: "packs",
    name: "Packs",
    price: "$14.990",
    blurb: "Pack familiar de recargas. Ahorra y mantén el stock en casa.",
    message:
      "Hola MiBidón, quiero información de Packs de agua a domicilio en Cauquenes.",
  },
] as const;

const TRUST = [
  {
    title: "Resolución Sanitaria",
    body: "Agua tratada bajo normativa vigente.",
  },
  {
    title: "Despacho Rápido",
    body: "Entrega a domicilio en Cauquenes.",
  },
  {
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
      <header className="fixed inset-x-0 top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5 md:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-sm font-extrabold text-white shadow-md shadow-blue-600/25">
              MB
            </span>
            <span className="text-lg font-extrabold tracking-tight text-slate-900">
              MiBidón
            </span>
          </Link>
          <a
            href={waOrder}
            className="inline-flex min-h-10 items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-700 active:scale-[0.98]"
          >
            Hacer Pedido
          </a>
        </div>
      </header>

      <main className="bg-slate-50 pt-16">
        {/* Hero */}
        <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 md:grid-cols-2 md:gap-14 md:px-8 md:py-24">
          <div className="mb-reveal flex flex-col gap-6">
            <p className="text-sm font-bold uppercase tracking-wider text-blue-600">
              MiBidón · Cauquenes
            </p>
            <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight text-slate-900 sm:text-5xl lg:text-[3.25rem]">
              Hidratación de Primera, Directo a tu Puerta en Cauquenes
            </h1>
            <p className="max-w-xl text-lg font-medium leading-relaxed text-slate-600">
              Agua purificada para tu hogar o negocio. Pedí por WhatsApp y
              recibe en la puerta, sin vueltas.
            </p>
            <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center">
              <a
                href={waHero}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-base font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 active:scale-[0.98]"
              >
                <WhatsAppIcon className="h-5 w-5" />
                Pedir por WhatsApp
              </a>
              <a
                href="#productos"
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 bg-transparent px-6 py-3 text-base font-bold text-slate-900 transition hover:border-slate-400 hover:bg-white"
              >
                Ver Productos
              </a>
            </div>
          </div>

          <div className="mb-reveal mb-reveal-delay-1 mb-hero-visual relative aspect-[4/3] overflow-hidden rounded-3xl shadow-lg shadow-slate-200/50 md:aspect-square">
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-8 text-center">
              <div className="flex h-28 w-28 items-center justify-center rounded-full bg-white/80 shadow-lg shadow-blue-600/10 backdrop-blur-sm md:h-36 md:w-36">
                <span className="text-4xl font-extrabold text-blue-600 md:text-5xl">
                  20L
                </span>
              </div>
              <p className="text-sm font-bold text-slate-900">
                Bidón premium · Agua purificada
              </p>
              <p className="text-xs font-medium text-slate-600">
                Imagen de producto · placeholder
              </p>
            </div>
          </div>
        </section>

        {/* Trust strip */}
        <section className="border-y border-slate-200 bg-white/70">
          <div className="mx-auto grid max-w-6xl gap-6 px-5 py-10 md:grid-cols-3 md:gap-8 md:px-8 md:py-12">
            {TRUST.map((item) => (
              <div key={item.title} className="flex flex-col gap-1 text-center md:text-left">
                <h2 className="text-base font-extrabold text-slate-900">
                  {item.title}
                </h2>
                <p className="text-sm font-medium text-slate-600">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Products bento */}
        <section id="productos" className="mx-auto max-w-6xl px-5 py-20 md:px-8 md:py-24">
          <div className="mb-reveal mx-auto mb-12 max-w-2xl text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
              Productos
            </h2>
            <p className="mt-3 text-base font-medium text-slate-600">
              Elige tu opción y confirma el pedido por WhatsApp en minutos.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3 md:gap-8">
            {PRODUCTS.map((product, i) => (
              <article
                key={product.id}
                className={`mb-reveal group flex flex-col gap-5 rounded-3xl bg-white p-7 shadow-lg shadow-slate-200/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                  i === 1 ? "mb-reveal-delay-1" : i === 2 ? "mb-reveal-delay-2" : ""
                }`}
              >
                <div className="flex h-36 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50 to-white">
                  <span className="text-2xl font-extrabold text-blue-600">
                    {product.name}
                  </span>
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
                  className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700 active:scale-[0.98]"
                >
                  Pedir por WhatsApp
                </a>
              </article>
            ))}
          </div>
        </section>

        {/* Nosotros */}
        <section className="border-t border-slate-200 bg-white/60 px-5 py-24 md:px-8">
          <div className="mx-auto max-w-2xl text-center">
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
        </section>

        <footer className="border-t border-slate-200 bg-slate-50 px-5 py-10 text-center md:px-8">
          <p className="text-sm font-extrabold text-slate-900">MiBidón</p>
          <p className="mt-1 text-sm font-medium text-slate-600">
            Agua purificada a domicilio · Cauquenes
          </p>
        </footer>
      </main>

      {/* FAB WhatsApp */}
      <a
        href={waOrder}
        aria-label="Pedir por WhatsApp"
        className="mb-fab-pulse fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white shadow-2xl transition hover:scale-110 hover:bg-green-600"
      >
        <WhatsAppIcon className="h-7 w-7" />
      </a>
    </>
  );
}
