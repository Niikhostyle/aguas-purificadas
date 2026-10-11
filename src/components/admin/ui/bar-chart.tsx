export type BarDatum = { label: string; value: number; display?: string };

/** Lightweight SSR bar chart (no chart lib); values are also exposed as a list for screen readers. */
export function BarChart({
  data,
  ariaLabel,
  height = 180,
}: {
  data: BarDatum[];
  ariaLabel: string;
  height?: number;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const labelEvery = data.length > 16 ? Math.ceil(data.length / 8) : 1;
  return (
    <figure>
      <div
        aria-hidden
        className="flex items-end gap-[3px] border-b border-[#e8f0f5] sm:gap-1.5"
        style={{ height }}
      >
        {data.map((d) => (
          <div key={d.label} className="group relative flex h-full flex-1 items-end">
            <div
              className="w-full rounded-t-[4px] bg-[linear-gradient(180deg,#00b1e2,#0a6fb0)] opacity-85 transition group-hover:opacity-100"
              style={{ height: `${Math.max(d.value > 0 ? 4 : 1, (d.value / max) * 100)}%` }}
            />
            <span className="pointer-events-none absolute -top-7 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-[#0b1f3a] px-1.5 py-0.5 text-[11px] text-white group-hover:block">
              {d.display ?? d.value}
            </span>
          </div>
        ))}
      </div>
      <div aria-hidden className="mt-1.5 flex gap-[3px] sm:gap-1.5">
        {data.map((d, i) => (
          <span key={d.label} className="flex-1 truncate text-center text-[10px] text-[#8a96a6]">
            {i % labelEvery === 0 ? d.label : ""}
          </span>
        ))}
      </div>
      <figcaption className="sr-only">
        {ariaLabel}
        <ul>
          {data.map((d) => (
            <li key={d.label}>
              {d.label}: {d.display ?? d.value}
            </li>
          ))}
        </ul>
      </figcaption>
    </figure>
  );
}
