"use client";

import { useState, type CSSProperties } from "react";
import { Clock, CreditCard, Repeat, TrendingUp } from "lucide-react";
import { AnimatedNumber } from "@/components/mibidon/landing-motion";

const MIN_QTY = 100;
const MAX_QTY = 3000;
const PLAN_PRICE = 29990;
/** Share of orders that become recurring subscriptions once online. */
const RECURRING_SHARE = 0.35;
/** Minutes of manual WhatsApp + transfer reconciliation per order. */
const MANUAL_MIN_PER_ORDER = 4;

export function RoiCalculator() {
  const [qty, setQty] = useState(600);
  const [price, setPrice] = useState(3500);

  const revenue = qty * price;
  const recurring = Math.round(qty * RECURRING_SHARE);
  const hoursSaved = Math.round((qty * MANUAL_MIN_PER_ORDER) / 60);
  const roi = Math.round(revenue / PLAN_PRICE);
  const fill = ((qty - MIN_QTY) / (MAX_QTY - MIN_QTY)) * 100;

  return (
    <div
      id="roi"
      className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.06] p-6 text-white shadow-[0_40px_80px_-40px_rgba(2,6,23,0.9)] backdrop-blur-xl md:p-8"
    >
      <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-sky-400/20 blur-3xl" />

      <div className="relative flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between gap-3">
            <label htmlFor="roi-qty" className="text-sm font-semibold text-slate-300">
              Bidones vendidos al mes
            </label>
            <span className="mb-display text-2xl font-extrabold text-white">
              <AnimatedNumber value={qty} durationMs={260} />
            </span>
          </div>
          <input
            id="roi-qty"
            className="mb-range w-full cursor-pointer"
            style={{ "--fill": `${fill}%` } as CSSProperties}
            type="range"
            min={MIN_QTY}
            max={MAX_QTY}
            step={50}
            value={qty}
            onChange={(e) => setQty(Number(e.target.value))}
          />
          <div className="flex justify-between text-xs font-medium text-slate-400">
            <span>100</span>
            <span>1.500</span>
            <span>3.000</span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-slate-300">
            Precio promedio por recarga
          </span>
          <div className="grid grid-cols-4 gap-2">
            {[2500, 3000, 3500, 4500].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPrice(p)}
                aria-pressed={price === p}
                className={`rounded-xl border px-2 py-2 text-sm font-bold transition-colors duration-300 ${
                  price === p
                    ? "border-sky-300/60 bg-sky-400/20 text-white"
                    : "border-white/10 bg-white/[0.04] text-slate-300 hover:border-white/25 hover:text-white"
                }`}
              >
                ${p.toLocaleString("es-CL")}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-blue-600/90 via-sky-500/80 to-cyan-500/80 p-5 shadow-[0_20px_40px_-20px_rgba(14,165,233,0.8)]">
          <span className="text-xs font-bold uppercase tracking-wider text-white/80">
            Ventas online estimadas / mes
          </span>
          <div className="mb-display mt-1 text-4xl font-extrabold tracking-tight md:text-5xl">
            <AnimatedNumber value={revenue} prefix="$" />
          </div>
          <span className="mt-1 flex items-center gap-1.5 text-sm text-white/85">
            <CreditCard className="size-4" />
            Cobrado con WebPay, directo a tu cuenta
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Repeat, value: recurring, suffix: "", label: "clientes en recarga automática" },
            { icon: Clock, value: hoursSaved, suffix: " h", label: "ahorradas en WhatsApp y transferencias" },
            { icon: TrendingUp, value: roi, suffix: "x", label: "retorno sobre el plan Pro" },
          ].map((s) => (
            <div
              key={s.label}
              className="flex flex-col gap-1 rounded-2xl border border-white/10 bg-white/[0.04] p-3"
            >
              <s.icon className="size-4 text-sky-300" />
              <span className="mb-display text-xl font-extrabold text-white">
                <AnimatedNumber value={s.value} suffix={s.suffix} />
              </span>
              <span className="text-[11px] leading-tight text-slate-400">{s.label}</span>
            </div>
          ))}
        </div>

        <p className="text-[11px] leading-relaxed text-slate-500">
          Estimación referencial: {Math.round(RECURRING_SHARE * 100)}% de recompra
          programada y {MANUAL_MIN_PER_ORDER} minutos de gestión manual por pedido.
        </p>
      </div>
    </div>
  );
}
