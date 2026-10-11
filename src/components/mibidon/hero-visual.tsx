import type { CSSProperties } from "react";

const BOTTLE =
  "M104 52 L136 52 L136 62 C136 70 150 74 168 80 C188 87 200 100 200 122 L200 266 C200 288 184 304 162 304 L78 304 C56 304 40 288 40 266 L40 122 C40 100 52 87 72 80 C90 74 104 70 104 62 Z";

function wave(y: number) {
  return `M0 ${y} Q30 ${y - 9} 60 ${y} T120 ${y} T180 ${y} T240 ${y} T300 ${y} T360 ${y} T420 ${y} T480 ${y} V320 H0 Z`;
}

const BUBBLES = [
  { cx: 70, r: 4, d: "0s", sway: "6px" },
  { cx: 98, r: 2.5, d: "1.2s", sway: "-4px" },
  { cx: 128, r: 5, d: "2.4s", sway: "5px" },
  { cx: 156, r: 3, d: "0.6s", sway: "-6px" },
  { cx: 176, r: 2, d: "3.1s", sway: "3px" },
  { cx: 112, r: 3.5, d: "3.8s", sway: "-3px" },
];

const layer = (depth: number) => ({ "--depth": depth }) as CSSProperties;

function Drop({ className, style }: { className: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 24 32" className={className} style={style} aria-hidden="true">
      <path
        d="M12 1 C12 1 2 13.5 2 20.5 A10 10 0 0 0 22 20.5 C22 13.5 12 1 12 1 Z"
        fill="url(#mb-drop)"
      />
      <path d="M7.5 20 a4.5 4.5 0 0 0 3 4.5" stroke="white" strokeWidth="1.6" strokeLinecap="round" fill="none" opacity="0.8" />
    </svg>
  );
}

export function HeroVisual() {
  return (
    <div
      data-parallax
      className="mb-enter-visual mb-hero-visual relative aspect-[4/3] overflow-hidden rounded-3xl shadow-lg shadow-slate-200/50 md:aspect-square"
    >
      <svg width="0" height="0" className="absolute" aria-hidden="true">
        <defs>
          <linearGradient id="mb-drop" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#93c5fd" />
            <stop offset="1" stopColor="#2563eb" />
          </linearGradient>
        </defs>
      </svg>

      <div className="mb-layer absolute inset-0" style={layer(-6)} aria-hidden="true">
        <span className="mb-ripple" />
        <span className="mb-ripple" />
        <span className="mb-ripple" />
      </div>

      <div className="mb-layer absolute left-[12%] top-[18%]" style={layer(-16)}>
        <div className="mb-float-slow">
          <Drop className="h-7 w-6 opacity-80" />
        </div>
      </div>
      <div className="mb-layer absolute right-[14%] top-[30%]" style={layer(20)}>
        <div className="mb-float">
          <Drop className="h-5 w-4 opacity-60" />
        </div>
      </div>
      <div className="mb-layer absolute bottom-[22%] left-[18%]" style={layer(14)}>
        <div className="mb-float">
          <Drop className="h-4 w-3 opacity-50" />
        </div>
      </div>

      <div
        className="mb-layer absolute bottom-[9%] left-1/2 h-5 w-[38%] -translate-x-1/2"
        style={layer(4)}
        aria-hidden="true"
      >
        <div className="mb-shadow-pulse h-full w-full rounded-[50%] bg-blue-900/25 blur-md" />
      </div>

      <div className="mb-layer absolute inset-0 flex items-center justify-center" style={layer(10)}>
        <div className="mb-float h-[74%]">
          <svg
            viewBox="0 0 240 320"
            className="h-full w-auto drop-shadow-[0_24px_32px_rgba(30,64,175,0.22)]"
            role="img"
            aria-label="Bidón MiBidón de 20 litros con agua purificada"
          >
            <defs>
              <clipPath id="mb-bottle-clip">
                <path d={BOTTLE} />
              </clipPath>
              <linearGradient id="mb-glass" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#ffffff" stopOpacity="0.95" />
                <stop offset="0.5" stopColor="#dbeafe" stopOpacity="0.55" />
                <stop offset="1" stopColor="#ffffff" stopOpacity="0.9" />
              </linearGradient>
              <linearGradient id="mb-water" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#60a5fa" />
                <stop offset="0.55" stopColor="#2563eb" />
                <stop offset="1" stopColor="#1d4ed8" />
              </linearGradient>
              <linearGradient id="mb-cap" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#2563eb" />
                <stop offset="1" stopColor="#1e40af" />
              </linearGradient>
            </defs>

            <path d={BOTTLE} fill="url(#mb-glass)" stroke="#bfdbfe" strokeWidth="2" />
            <g clipPath="url(#mb-bottle-clip)">
              <path className="mb-wave-back" d={wave(126)} fill="#93c5fd" opacity="0.65" />
              <path className="mb-wave" d={wave(134)} fill="url(#mb-water)" />
              {BUBBLES.map((b) => (
                <circle
                  key={b.cx}
                  className="mb-bubble"
                  cx={b.cx}
                  cy={292}
                  r={b.r}
                  fill="white"
                  style={{ "--d": b.d, "--sway": b.sway } as CSSProperties}
                />
              ))}
              <path d="M40 160 Q120 172 200 160" stroke="white" strokeOpacity="0.5" strokeWidth="2" fill="none" />
              <path d="M40 252 Q120 264 200 252" stroke="white" strokeOpacity="0.4" strokeWidth="2" fill="none" />
            </g>
            <rect className="mb-glint" x="56" y="104" width="11" height="168" rx="5.5" fill="white" />
            <rect x="76" y="186" width="88" height="58" rx="14" fill="white" fillOpacity="0.92" />
            <text x="120" y="219" textAnchor="middle" fontSize="27" fontWeight="800" fill="#1d4ed8">
              20L
            </text>
            <text x="120" y="235" textAnchor="middle" fontSize="8.5" fontWeight="700" letterSpacing="1.6" fill="#475569">
              PURIFICADA
            </text>
            <rect x="104" y="38" width="32" height="24" rx="4" fill="#e0f2fe" stroke="#bfdbfe" strokeWidth="2" />
            <rect x="96" y="12" width="48" height="30" rx="8" fill="url(#mb-cap)" />
            <path d="M106 18 V36 M114 18 V36 M122 18 V36 M130 18 V36" stroke="white" strokeOpacity="0.22" strokeWidth="2" />
          </svg>
        </div>
      </div>

      <div className="mb-layer absolute left-[7%] top-[8%]" style={layer(24)}>
        <div className="mb-float-slow flex items-center gap-2 rounded-2xl bg-white/85 px-3.5 py-2.5 shadow-lg shadow-blue-900/10 ring-1 ring-white backdrop-blur-md">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m5 12 5 5L20 7" />
            </svg>
          </span>
          <span className="text-xs font-bold text-slate-900">Agua purificada</span>
        </div>
      </div>
      <div className="mb-layer absolute bottom-[8%] right-[7%]" style={layer(-20)}>
        <div className="mb-float flex items-center gap-2 rounded-2xl bg-white/85 px-3.5 py-2.5 shadow-lg shadow-blue-900/10 ring-1 ring-white backdrop-blur-md">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-60" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
          </span>
          <span className="text-xs font-bold text-slate-900">Despacho en Cauquenes</span>
        </div>
      </div>
    </div>
  );
}

const MINI =
  "M24 6 H36 V14 C36 17 42 18 46 20 C51 23 54 27 54 33 V68 C54 73 50 77 45 77 H15 C10 77 6 73 6 68 V33 C6 27 9 23 14 20 C18 18 24 17 24 14 Z";

export function MiniBottle({
  id,
  fillOffset,
  className = "h-24 w-auto",
}: {
  id: string;
  fillOffset: number;
  className?: string;
}) {
  return (
    <svg viewBox="0 0 60 80" className={`mb-mini ${className}`} aria-hidden="true">
      <defs>
        <clipPath id={`${id}-clip`}>
          <path d={MINI} />
        </clipPath>
        <linearGradient id={`${id}-water`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#60a5fa" />
          <stop offset="1" stopColor="#1d4ed8" />
        </linearGradient>
      </defs>
      <path d={MINI} fill="#ffffff" stroke="#bfdbfe" strokeWidth="1.5" />
      <g clipPath={`url(#${id}-clip)`}>
        <rect
          className="mb-mini-water"
          x="0"
          y="30"
          width="60"
          height="50"
          fill={`url(#${id}-water)`}
          style={{ "--fill-off": `${fillOffset}px` } as CSSProperties}
        />
      </g>
      <rect x="13" y="30" width="3" height="38" rx="1.5" fill="white" opacity="0.6" />
      <rect x="21" y="1" width="18" height="8" rx="2.5" fill="#2563eb" />
    </svg>
  );
}
