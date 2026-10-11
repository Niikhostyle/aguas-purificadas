"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const FAQS = [
  {
    q: "¿Cuánto tardan en dejar mi tienda lista?",
    a: "En menos de 24 horas hábiles. Nuestro equipo configura tu catálogo de bidones, define tus comunas de reparto y conecta tu pasarela para que comiences a recibir pedidos al día siguiente.",
  },
  {
    q: "¿El dinero de las ventas va directo a mi cuenta bancaria?",
    a: "Sí, 100%. Conectamos tu código de comercio de WebPay / Transbank directamente. Nosotros no retenemos ni tocamos tu dinero: se abona en tu cuenta corriente o vista.",
  },
  {
    q: "¿Puedo usar mi propio dominio (.cl o .com)?",
    a: "Sí. Puedes usar tu propio dominio, como tubotellon.cl, o un subdominio gratuito inmediato (tuempresa.mibidon.cl). Tu cliente siempre ve únicamente tu marca.",
  },
  {
    q: "¿Mis clientes deben descargar alguna aplicación?",
    a: "No, cero fricción. Es una tienda web ultrarrápida optimizada para celulares. Compran desde cualquier enlace o WhatsApp sin descargar apps.",
  },
  {
    q: "¿Hay contratos de permanencia?",
    a: "Ninguno. Puedes pausar o cancelar el servicio cuando quieras. Además tienes 14 días de prueba gratis para comprobar cómo aumentan tus ventas.",
  },
];

export function FaqAccordion() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="flex flex-col gap-3">
      {FAQS.map((item, i) => {
        const isOpen = open === i;
        return (
          <div
            key={item.q}
            className={`rounded-2xl border bg-white transition-[border-color,box-shadow] duration-300 ${
              isOpen
                ? "border-blue-200 shadow-[0_16px_36px_-20px_rgba(37,99,235,0.45)]"
                : "border-slate-200 hover:border-slate-300"
            }`}
          >
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => setOpen(isOpen ? null : i)}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
            >
              <span className="font-semibold text-slate-900">{item.q}</span>
              <ChevronDown
                className={`size-5 shrink-0 text-blue-600 transition-transform duration-300 ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            <div
              className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              }`}
            >
              <div className="overflow-hidden">
                <p className="px-5 pb-5 leading-relaxed text-slate-600">{item.a}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
