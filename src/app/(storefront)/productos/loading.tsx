export default function ProductsLoading() {
  return (
    <div className="bg-[linear-gradient(180deg,var(--mist)_0%,#fff_520px)]" aria-busy="true" aria-label="Cargando productos">
      <div className="bg-[linear-gradient(120deg,var(--brand)_0%,color-mix(in_srgb,var(--brand)_55%,var(--brand-deep))_100%)] px-4 py-12 md:py-14">
        <div className="mx-auto h-12 w-72 max-w-full rounded-full bg-white/20 md:h-14" />
        <div className="mx-auto mt-4 h-4 w-40 rounded-full bg-white/15" />
      </div>
      <ul className="mx-auto grid max-w-6xl gap-5 px-4 py-12 sm:grid-cols-2 sm:gap-6 md:px-6 md:py-16 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <li key={i} className="sf-card flex flex-col overflow-hidden p-2">
            <div className="sf-skeleton aspect-square" />
            <div className="flex flex-col items-center gap-3 px-3 pb-3 pt-4">
              <div className="sf-skeleton h-5 w-3/4" />
              <div className="sf-skeleton h-6 w-24 rounded-full" />
              <div className="sf-skeleton h-3 w-full" />
              <div className="sf-skeleton mt-2 h-9 w-full rounded-full" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
