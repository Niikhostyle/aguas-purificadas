"use client";

import { useState, type CSSProperties } from "react";
import { ArrowRight, Calculator, SendHorizontal } from "lucide-react";
import { AnimatedNumber } from "@/components/mibidon/landing-motion";
import { whatsappHref } from "@/lib/whatsapp";

const PRICE_PER_BOTTLE = 3500;
const MIN = 100;
const MAX = 3000;
const HOURS_SAVED_PER_BOTTLE = 28 / 500;

export function RevenueSimulator() {
  const [bottles, setBottles] = useState(500);
  const revenue = bottles * PRICE_PER_BOTTLE;
  const hoursSaved = Math.max(4, Math.round(bottles * HOURS_SAVED_PER_BOTTLE));
  const fill = ((bottles - MIN) / (MAX - MIN)) * 100;
  const ctaHref = whatsappHref(
    `Hola MiBidón, entrego ~${bottles.toLocaleString("es-CL")} bidones al mes y quiero conocer la plataforma.`,
  );

  return (
    <div className="relative overflow-hidden rounded-2xl border border-sv-surface-high bg-sv-surface-lowest p-6 shadow-xl sm:p-8">
      <div className="pointer-events-none absolute right-0 top-0 h-32 w-32 rounded-full bg-sv-secondary-container/20 blur-2xl" />
      <div className="flex items-center justify-between border-b border-sv-surface-container pb-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-sv-secondary">
            Calculadora Interactiva
          </span>
          <h3 className="sv-display text-lg font-bold text-sv-primary">
            Simula tus Ingresos MiBidón
          </h3>
        </div>
        <div className="rounded-lg bg-sv-surface-low p-2 text-sv-secondary">
          <Calculator className="size-6" aria-hidden />
        </div>
      </div>
      <div className="space-y-5 py-5" id="simulador">
        <div>
          <div className="mb-2 flex justify-between text-sm font-semibold">
            <label htmlFor="bottlesSlider" className="text-sv-on-surface-variant">
              Botellones entregados al mes:
            </label>
            <span className="text-base font-bold text-sv-primary">
              {bottles.toLocaleString("es-CL")} bidones
            </span>
          </div>
          <input
            id="bottlesSlider"
            type="range"
            min={MIN}
            max={MAX}
            step={50}
            value={bottles}
            onChange={(e) => setBottles(Number(e.target.value))}
            className="sv-range w-full cursor-pointer"
            style={{ "--fill": `${fill}%` } as CSSProperties}
          />
          <div className="mt-1 flex justify-between font-mono text-[11px] text-sv-outline">
            <span>100</span>
            <span>1.500</span>
            <span>3.000+</span>
          </div>
        </div>
        <div className="space-y-2 rounded-xl border border-sv-surface-highest bg-sv-surface-low p-4">
          <p className="text-xs font-medium text-sv-on-surface-variant">
            Facturación mensual estimada:
          </p>
          <p className="sv-display text-3xl font-black tracking-tight text-sv-primary">
            <AnimatedNumber value={revenue} prefix="$" suffix=" CLP" />
          </p>
          <div className="flex items-center justify-between border-t border-sv-surface-container pt-2 text-xs font-medium text-sv-on-secondary-fixed-variant">
            <span>Ahorro administrativo:</span>
            <span className="rounded bg-emerald-50 px-2 py-0.5 font-bold text-emerald-600">
              ~<AnimatedNumber value={hoursSaved} suffix=" hrs/mes" />
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-sv-surface-highest/60 p-3 text-xs text-sv-on-surface-variant">
          <SendHorizontal className="size-4 shrink-0 text-sv-secondary" aria-hidden />
          <span>Los cobros van directo a tu cuenta bancaria vía Transbank sin intermediarios.</span>
        </div>
        <a
          href={ctaHref}
          target="_blank"
          rel="noopener noreferrer"
          className="sv-shine flex w-full items-center justify-center gap-1.5 rounded-xl bg-sv-primary py-3.5 text-center text-sm font-bold text-white shadow-md hover:bg-sv-primary-container"
        >
          <span>Comenzar con mi capacidad actual</span>
          <ArrowRight className="sv-arrow size-4" aria-hidden />
        </a>
      </div>
    </div>
  );
}
