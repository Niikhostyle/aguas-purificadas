export function Skeleton({ className = "" }: { className?: string }) {
  return <span aria-hidden className={`mb-skeleton block ${className}`} />;
}

export function TableSkeleton({ rows = 8, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="overflow-hidden rounded-xl border border-[#dde7ee] bg-white">
      <div className="flex gap-3 border-b border-[#e8f0f5] bg-[#fafcfd] px-5 py-3">
        <Skeleton className="h-9 w-64 max-w-full" />
        <Skeleton className="hidden h-9 w-32 sm:block" />
        <Skeleton className="hidden h-9 w-24 sm:block" />
      </div>
      <div className="divide-y divide-[#eef3f7]">
        {Array.from({ length: rows }, (_, r) => (
          <div key={r} className="flex items-center gap-4 px-5 py-3.5">
            <Skeleton className="size-9 shrink-0 rounded-lg" />
            {Array.from({ length: cols - 1 }, (_, c) => (
              <Skeleton
                key={c}
                className={`h-3.5 ${c === 0 ? "w-1/3" : "hidden w-1/6 md:block"} ${c === cols - 2 ? "ml-auto" : ""}`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Generic page placeholder: header, optional KPI row and a table. */
export function PageSkeleton({ kpis = 0, rows = 8 }: { kpis?: number; rows?: number }) {
  return (
    <div role="status" aria-live="polite" className="space-y-6">
      <span className="sr-only">Cargando…</span>
      <div className="space-y-3">
        <Skeleton className="h-4 w-40" />
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-7 w-56" />
            <Skeleton className="h-4 w-80 max-w-[70vw]" />
          </div>
          <Skeleton className="h-9 w-36" />
        </div>
      </div>
      {kpis ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: kpis }, (_, i) => (
            <div key={i} className="flex items-center gap-4 rounded-xl border border-[#dde7ee] bg-white p-4">
              <Skeleton className="size-11 shrink-0 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-2/3" />
                <Skeleton className="h-6 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : null}
      {rows ? <TableSkeleton rows={rows} /> : null}
    </div>
  );
}
