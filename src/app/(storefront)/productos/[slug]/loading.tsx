export default function ProductLoading() {
  return (
    <div className="bg-[linear-gradient(180deg,var(--mist)_0%,#fff_420px)]" aria-busy="true" aria-label="Cargando producto">
      <div className="bg-[linear-gradient(120deg,var(--brand)_0%,color-mix(in_srgb,var(--brand)_55%,var(--brand-deep))_100%)] px-4 py-8 md:px-6 md:py-10">
        <div className="mx-auto max-w-6xl">
          <div className="h-6 w-28 rounded-full bg-white/20" />
          <div className="mt-3 h-10 w-80 max-w-full rounded-full bg-white/20 md:h-12" />
        </div>
      </div>
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-2 md:gap-14 md:px-6 md:py-16">
        <div className="sf-card aspect-square p-2">
          <div className="sf-skeleton h-full w-full" />
        </div>
        <div className="flex flex-col justify-center gap-4">
          <div className="sf-skeleton h-11 w-40 rounded-full" />
          <div className="sf-skeleton mt-4 h-4 w-full" />
          <div className="sf-skeleton h-4 w-5/6" />
          <div className="sf-skeleton h-4 w-2/3" />
          <div className="mt-6 flex gap-3 border-t border-[var(--sf-line)] pt-8">
            <div className="sf-skeleton h-11 w-24 rounded-full" />
            <div className="sf-skeleton h-11 w-48 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
