import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./landing.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-mb-display",
});

export const metadata: Metadata = {
  title: {
    absolute: "MiBidón · Tiendas online para purificadoras y embotelladoras de agua",
  },
  description:
    "Tu propia tienda online de agua purificada con tu marca: pedidos, despachos por comuna, suscripciones de recarga y cobro con WebPay. Activa en 24 horas, 0% comisión.",
};

export default function MiBidonLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={`${jakarta.variable} mb-shell min-h-screen antialiased`}
      style={{ fontFamily: "var(--font-mb-display), 'Plus Jakarta Sans', sans-serif" }}
    >
      <noscript>
        <style>{`.mb-reveal,.mb-word,.mb-fade-up,.mb-pop,.mb-bar{opacity:1!important;transform:none!important;filter:none!important}`}</style>
      </noscript>
      {children}
    </div>
  );
}
