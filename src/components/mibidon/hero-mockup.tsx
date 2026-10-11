import type { CSSProperties } from "react";
import {
  CheckCircle2,
  Droplets,
  Lock,
  MapPin,
  ShoppingBag,
  TrendingUp,
} from "lucide-react";
import { Parallax } from "@/components/mibidon/landing-motion";

const PRODUCTS = [
  { name: "Recarga 20 L", price: "$3.500", tint: "from-sky-100 to-blue-200" },
  { name: "Bidón nuevo 20 L", price: "$7.990", tint: "from-cyan-100 to-sky-200" },
  { name: "Dispensador", price: "$14.990", tint: "from-blue-100 to-indigo-200" },
];

const BARS = [38, 52, 44, 66, 58, 80, 94];

function v(vars: Record<string, string | number>) {
  return vars as CSSProperties;
}

/** Client storefront mockup with floating order/payment/stats cards. */
export function HeroMockup() {
  return (
    <Parallax className="relative mx-auto w-full max-w-[600px] pb-10 pt-6 lg:pt-0">
      <div
        aria-hidden
        className="absolute inset-x-10 top-10 bottom-0 rounded-full bg-blue-500/30 blur-[90px]"
      />

      {/* Browser frame */}
      <div className="mb-layer" style={v({ "--depth": 6 })}>
        <div className="mb-pop" style={v({ "--d": "250ms" })}>
          <div className="overflow-hidden rounded-2xl border border-white/15 bg-white shadow-[0_50px_100px_-30px_rgba(2,6,23,0.85)] ring-1 ring-white/10">
            <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-100 px-4 py-2.5">
              <span className="size-2.5 rounded-full bg-rose-400" />
              <span className="size-2.5 rounded-full bg-amber-400" />
              <span className="size-2.5 rounded-full bg-emerald-400" />
              <div className="ml-3 flex flex-1 items-center gap-1.5 rounded-md bg-white px-3 py-1 text-[11px] font-medium text-slate-500">
                <Lock className="size-3 text-emerald-600" />
                aguadelvalle.cl
              </div>
            </div>

            <div className="bg-slate-50">
              <div className="flex items-center justify-between bg-white px-5 py-3 shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 text-white">
                    <Droplets className="size-4" />
                  </span>
                  <span className="mb-display text-sm font-extrabold text-slate-900">
                    Agua del Valle
                  </span>
                </div>
                <div className="flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600">
                  <MapPin className="size-3 text-blue-600" />
                  Despacho hoy · Ñuñoa
                </div>
              </div>

              <div className="px-5 pt-4">
                <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 p-4 text-white">
                  <div className="absolute -right-6 -top-8 size-28 rounded-full bg-white/15" />
                  <div className="absolute right-10 -bottom-10 size-20 rounded-full bg-white/10" />
                  <p className="text-[10px] font-bold uppercase tracking-wider text-white/80">
                    Suscríbete y ahorra
                  </p>
                  <p className="mb-display mt-0.5 text-base font-extrabold leading-tight">
                    Agua purificada en tu puerta
                  </p>
                  <span className="mt-2 inline-block rounded-md bg-white px-2.5 py-1 text-[10px] font-bold text-blue-700">
                    Pedir ahora
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 p-5">
                {PRODUCTS.map((p) => (
                  <div key={p.name} className="rounded-xl bg-white p-2 shadow-sm ring-1 ring-slate-200/70">
                    <div
                      className={`flex h-14 items-center justify-center rounded-lg bg-gradient-to-br ${p.tint}`}
                    >
                      <Droplets className="size-6 text-blue-600/80" />
                    </div>
                    <p className="mt-1.5 truncate text-[10px] font-semibold text-slate-700">
                      {p.name}
                    </p>
                    <div className="mt-0.5 flex items-center justify-between">
                      <span className="text-[11px] font-extrabold text-slate-900">{p.price}</span>
                      <span className="flex size-5 items-center justify-center rounded-md bg-blue-600 text-[11px] font-bold text-white">
                        +
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Phone frame */}
      <div
        className="mb-layer absolute -bottom-2 right-0 w-[34%] min-w-[150px] sm:-right-4"
        style={v({ "--depth": 16 })}
      >
        <div className="mb-pop" style={v({ "--d": "550ms" })}>
          <div className="mb-float" style={v({ "--fd": "-2s" })}>
            <div className="rounded-[1.6rem] border-[5px] border-slate-900 bg-white shadow-[0_40px_70px_-25px_rgba(2,6,23,0.9)]">
              <div className="mx-auto mt-1.5 h-1.5 w-12 rounded-full bg-slate-900" />
              <div className="flex flex-col gap-2 p-3">
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  Tu pedido
                </p>
                {[
                  ["3 × Recarga 20 L", "$10.500"],
                  ["Despacho", "Gratis"],
                ].map(([k, val]) => (
                  <div key={k} className="flex justify-between text-[10px]">
                    <span className="text-slate-600">{k}</span>
                    <span className="font-bold text-slate-900">{val}</span>
                  </div>
                ))}
                <div className="flex justify-between border-t border-slate-100 pt-1.5 text-[11px] font-extrabold text-slate-900">
                  <span>Total</span>
                  <span>$10.500</span>
                </div>
                <div className="rounded-lg bg-gradient-to-r from-rose-600 to-red-500 py-1.5 text-center text-[10px] font-bold text-white">
                  Pagar con WebPay
                </div>
                <div className="flex items-center justify-center gap-1 text-[8px] text-slate-400">
                  <Lock className="size-2.5" /> Débito · Crédito · Prepago
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating: new order */}
      <div
        className="mb-layer absolute -left-3 top-[18%] sm:-left-10"
        style={v({ "--depth": 22 })}
      >
        <div className="mb-pop" style={v({ "--d": "800ms" })}>
          <div className="mb-float" style={v({ "--fd": "0s" })}>
            <div className="flex items-center gap-3 rounded-2xl border border-white/60 bg-white/90 py-2.5 pl-2.5 pr-4 shadow-[0_20px_40px_-15px_rgba(2,6,23,0.6)] backdrop-blur-md">
              <span className="relative flex size-9 items-center justify-center rounded-xl bg-blue-600 text-white">
                <ShoppingBag className="size-4" />
                <span className="absolute -right-0.5 -top-0.5 flex size-3">
                  <span className="mb-ping absolute inline-flex size-full rounded-full bg-sky-400" />
                  <span className="relative inline-flex size-3 rounded-full border-2 border-white bg-sky-500" />
                </span>
              </span>
              <div className="leading-tight">
                <p className="text-xs font-bold text-slate-900">Nuevo pedido #1284</p>
                <p className="text-[11px] text-slate-500">3 recargas · Ñuñoa</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating: WebPay approved */}
      <div
        className="mb-layer absolute -right-2 top-[2%] sm:-right-8 lg:top-[-6%]"
        style={v({ "--depth": 28 })}
      >
        <div className="mb-pop" style={v({ "--d": "1050ms" })}>
          <div className="mb-float" style={v({ "--fd": "-3.5s" })}>
            <div className="flex items-center gap-3 rounded-2xl border border-white/60 bg-white/90 py-2.5 pl-2.5 pr-4 shadow-[0_20px_40px_-15px_rgba(2,6,23,0.6)] backdrop-blur-md">
              <span className="flex size-9 items-center justify-center rounded-xl bg-emerald-500 text-white">
                <CheckCircle2 className="size-5" />
              </span>
              <div className="leading-tight">
                <p className="text-xs font-bold text-slate-900">Pago WebPay aprobado</p>
                <p className="text-[11px] font-semibold text-emerald-600">+$10.500 abonado</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating: stats */}
      <div
        className="mb-layer absolute -left-2 bottom-0 hidden w-48 sm:block lg:-left-12"
        style={v({ "--depth": 12 })}
      >
        <div className="mb-pop" style={v({ "--d": "1300ms" })}>
          <div className="mb-float" style={v({ "--fd": "-1.2s" })}>
            <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-3.5 text-white shadow-[0_25px_50px_-20px_rgba(2,6,23,0.9)] backdrop-blur-md">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Ventas hoy
                </span>
                <span className="flex items-center gap-0.5 rounded-full bg-emerald-400/15 px-1.5 py-0.5 text-[10px] font-bold text-emerald-300">
                  <TrendingUp className="size-3" /> 32%
                </span>
              </div>
              <p className="mb-display mt-1 text-xl font-extrabold">$284.000</p>
              <div className="mt-2 flex h-10 items-end gap-1">
                {BARS.map((h, i) => (
                  <span
                    key={i}
                    className="mb-bar flex-1 rounded-sm bg-gradient-to-t from-blue-500 to-cyan-300"
                    style={v({ height: `${h}%`, "--d": `${1500 + i * 70}ms` })}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Parallax>
  );
}
