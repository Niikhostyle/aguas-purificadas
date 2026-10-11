"use client";

import { useState } from "react";

const AVG_PRICE = 3500;

export function RoiCalculator() {
  const [qty, setQty] = useState(500);
  const total = qty * AVG_PRICE;

  return (
    <div
      className="relative flex flex-col gap-3 rounded-2xl border border-[#00a3e0]/35 bg-[#f2f8fc]/96 p-4 shadow-[0_20px_50px_-20px_rgba(4,16,31,0.55)] ring-1 ring-[#06b6d4]/20 md:p-5"
      id="demo-interactiva"
    >
      <div className="pointer-events-none absolute inset-y-3 left-0 w-1 rounded-r-full bg-gradient-to-b from-[#00a3e0] to-[#06b6d4]" />
      <div className="flex items-center justify-between border-b border-[#b8d9eb] pb-2">
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[20px] text-[#00a3e0]">
            calculate
          </span>
          <span className="text-xs font-bold text-[#071a36]">
            Simula tus ganancias automáticas
          </span>
        </div>
        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
          Calculadora ROI
        </span>
      </div>

      <div className="flex flex-col gap-2 pt-1">
        <div className="flex items-center justify-between text-[13px] font-medium">
          <span className="text-[#3d566e]">Botellones entregados al mes:</span>
          <span className="text-[15px] font-bold text-[#071a36]">
            {qty.toLocaleString("es-CL")} botellones/mes
          </span>
        </div>
        <input
          className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-[#b8d9eb] accent-[#00a3e0]"
          type="range"
          min={100}
          max={3000}
          step={50}
          value={qty}
          onChange={(e) => setQty(Number(e.target.value))}
          aria-label="Botellones al mes"
        />
        <div className="flex justify-between text-[11px] font-medium text-[#3d566e]">
          <span>100 unid</span>
          <span>1.500 unid</span>
          <span>3.000 unid</span>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-xl bg-gradient-to-br from-[#071a36] via-[#0c274f] to-[#04101f] p-3 text-white shadow-[inset_0_1px_0_rgba(56,189,248,0.15)]">
        <div className="flex flex-col">
          <span className="text-[11px] font-semibold text-[#38bdf8]">
            Facturación estimada mensual:
          </span>
          <span className="text-xl font-extrabold tracking-tight">
            +${total.toLocaleString("es-CL")} CLP
          </span>
          <span className="text-[11px] text-slate-300">
            Cobrado 100% automático sin errores manuales
          </span>
        </div>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#38bdf8]/20 text-[#38bdf8]">
          <span className="material-symbols-outlined text-[24px]">
            trending_up
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-lg bg-[#d4ebf5] px-3 py-1.5 text-[11px] text-[#3d566e]">
        <div className="flex items-center gap-1.5 text-[#00a3e0]">
          <span className="material-symbols-outlined text-[16px]">
            credit_card
          </span>
          <span className="font-semibold text-[#071a36]">
            WebPay Plus Directo a tu cuenta
          </span>
        </div>
        <span className="font-bold text-emerald-700">2 toques del cliente</span>
      </div>
    </div>
  );
}
