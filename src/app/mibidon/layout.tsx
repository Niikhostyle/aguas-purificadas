import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./landing.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-sv-jakarta",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sv-inter",
});

export const metadata: Metadata = {
  title: {
    absolute: "MiBidón - Multiplica tus Ventas de Agua Purificada en Piloto Automático",
  },
  description:
    "La plataforma eCommerce white-label para embotelladoras de agua: pedidos, rutas de despacho y cobro con WebPay Plus en 2 clics. Lista en menos de 24 horas y con tu propio logo.",
};

export default function MiBidonLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      data-mb-landing="stitch-v2"
      className={`${jakarta.variable} ${inter.variable} sv-shell min-h-screen bg-sv-surface font-sv-body text-sv-on-surface antialiased selection:bg-sv-secondary-fixed selection:text-sv-on-secondary-fixed`}
    >
      <noscript>
        <style>{`.mb-reveal,.mb-word,.mb-fade-up,.mb-pop{opacity:1!important;transform:none!important;filter:none!important}`}</style>
      </noscript>
      {children}
    </div>
  );
}
