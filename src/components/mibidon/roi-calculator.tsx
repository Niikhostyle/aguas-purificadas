"use client";

import { useState } from "react";

const AVG_PRICE = 3500;

export function RoiCalculator() {
  const [qty, setQty] = useState(500);
  const total = qty * AVG_PRICE;

  return (
    <div
      className="relative mt-2 flex flex-col gap-3 rounded-xl border border-[rgba(0,101,141,0.2)] bg-white p-4 shadow-lg"
      id="demo-interactiva"
    >
      <div className="flex items-center justify-between border-b border-[#eaedff] pb-2">
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[20px] text-[#00658d]">
            calculate
          </span>
          <span className="text-xs font-bold text-[#00163d]">
            Simula tus ganancias automáticas
          </span>
        </div>
        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
          Calculadora ROI
        </span>
      </div>

      <div className="flex flex-col gap-2 pt-1">
        <div className="flex items-center justify-between text-[13px] font-medium">
          <span className="text-[#44464f]">Botellones entregados al mes:</span>
          <span className="text-[15px] font-bold text-[#00163d]">
            {qty.toLocaleString("es-CL")} botellones/mes
          </span>
        </div>
        <input
          className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-[#e2e7ff] accent-[#00658d]"
          type="range"
          min={100}
          max={3000}
          step={50}
          value={qty}
          onChange={(e) => setQty(Number(e.target.value))}
          aria-label="Botellones al mes"
        />
        <div className="flex justify-between text-[11px] font-medium text-[#747780]">
          <span>100 unid</span>
          <span>1.500 unid</span>
          <span>3.000 unid</span>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-lg bg-gradient-to-br from-[#0f2b5c] to-[#00163d] p-3 text-white">
        <div className="flex flex-col">
          <span className="text-[11px] font-semibold text-[#41befd]">
            Facturación estimada mensual:
          </span>
          <span className="text-xl font-extrabold tracking-tight">
            +${total.toLocaleString("es-CL")} CLP
          </span>
          <span className="text-[11px] text-slate-300">
            Cobrado 100% automático sin errores manuales
          </span>
        </div>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#41befd]/20 text-[#41befd]">
          <span className="material-symbols-outlined text-[24px]">
            trending_up
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-lg bg-[#f2f3ff] px-3 py-1.5 text-[11px] text-[#44464f]">
        <div className="flex items-center gap-1.5 text-[#00658d]">
          <span className="material-symbols-outlined text-[16px]">
            credit_card
          </span>
          <span className="font-semibold text-[#00163d]">
            WebPay Plus Directo a tu cuenta
          </span>
        </div>
        <span className="font-bold text-emerald-700">2 toques del cliente</span>
      </div>
    </div>
  );
}
