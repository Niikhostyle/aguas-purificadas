"use client";

import { useState } from "react";

const FAQS = [
  {
    q: "¿Cuánto tardan en dejar mi tienda lista?",
    a: "En menos de 24 horas hábiles. Nuestro equipo configura tu catálogo de botellones, define tus comunas de reparto y conecta tu pasarela para que comiences a recibir pedidos al día siguiente.",
  },
  {
    q: "¿El dinero de las ventas va directo a mi cuenta bancaria?",
    a: "Sí, 100%. Conectamos tu código de comercio de WebPay / Transbank directamente. Nosotros no retenemos ni tocamos tu dinero, se abona directamente en tu cuenta corriente o vista.",
  },
  {
    q: "¿Puedo usar mi propio dominio (.cl o .com)?",
    a: "Exactamente. Puedes usar tu propio dominio como tubotellon.cl o un subdominio inmediato gratuito (tuempresa.mibidon.cl). Tu cliente siempre ve únicamente tu marca corporativa.",
  },
  {
    q: "¿Mis clientes deben descargar alguna aplicación?",
    a: "No, cero fricción. Es una tienda web ultrarrápida optimizada para teléfonos móviles. Compran desde cualquier enlace o WhatsApp sin descargar apps que ocupen memoria en su celular.",
  },
  {
    q: "¿Hay contratos de permanencia o amarre?",
    a: "Ninguno. Puedes pausar o cancelar el servicio en cualquier momento con un solo clic. Además tienes 14 días de prueba gratis para comprobar cómo aumentan tus ventas.",
  },
];

export function FaqAccordion() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="flex flex-col gap-2">
      {FAQS.map((item, i) => {
        const isOpen = open === i;
        return (
          <button
            key={item.q}
            type="button"
            onClick={() => setOpen(isOpen ? null : i)}
            className="flex flex-col gap-1 rounded-xl border border-[#071a36]/10 bg-[#f2f8fc]/90 p-3 text-left shadow-sm transition-colors hover:border-[#00a3e0]/40 hover:bg-[#d4ebf5]"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-[#071a36]">{item.q}</span>
              <span
                className={`material-symbols-outlined shrink-0 text-[20px] text-[#00a3e0] transition-transform duration-200 ${
                  isOpen ? "rotate-180" : ""
                }`}
              >
                expand_more
              </span>
            </div>
            {isOpen ? (
              <p className="mt-1 text-[13px] leading-5 text-[#3d566e]">
                {item.a}
              </p>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
