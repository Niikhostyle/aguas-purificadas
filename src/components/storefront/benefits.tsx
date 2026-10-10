const BENEFITS = [
  {
    title: "Libre de Sodio",
    body: "El proceso de purificación se logra a través de diversas multietapas, obteniendo agua no mineral y libre de sodio.",
    image: "/brand/rio-claro/destacado-01.jpg",
  },
  {
    title: "Alta Pureza",
    body: "Filtros específicos que logran generar la pureza total del agua tratada bajo este sistema.",
    image: "/brand/rio-claro/destacado-02.jpg",
  },
  {
    title: "Pura Salud",
    body: "Recomendable para hipertensos o embarazadas. Libre de cloro: mejor sabor y sin olor.",
    image: "/brand/rio-claro/destacado-03.jpg",
  },
  {
    title: "Purificación",
    body: "Proceso multi etapas desde agua de red domiciliaria hasta agua purificada lista para envasar.",
    image: "/brand/rio-claro/destacado-04.jpg",
    id: "envasado",
  },
  {
    title: "Envasado",
    body: "Nuestro proceso de envasado es controlado en todo momento, garantizando la óptima calidad.",
    image: "/brand/rio-claro/destacado-05.jpg",
  },
  {
    title: "Garantía de Contacto",
    body: "Política G.C.S.: visita o contacto semanal con día preferencial de atención asignado.",
    image: "/brand/rio-claro/destacado-06.jpg",
  },
] as const;

export function BenefitsSection() {
  return (
    <section id="beneficios" className="bg-[#f7fbfd] py-16">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <h2 className="rc-display text-center text-4xl uppercase text-[var(--brand-deep)] md:text-5xl">
          Agua Purificada
        </h2>
        <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map((item) => (
            <li
              key={item.title}
              id={"id" in item ? item.id : undefined}
              className="overflow-hidden border border-[#e4eef4] bg-white"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.image}
                alt=""
                className="aspect-[16/10] w-full object-cover"
              />
              <div className="p-5">
                <h3 className="rc-display text-2xl uppercase text-[var(--brand)]">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[#5a6578]">
                  {item.body}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
