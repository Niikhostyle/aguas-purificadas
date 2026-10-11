import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./landing.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-mb-jakarta",
});

export const metadata: Metadata = {
  title: "MiBidón · Agua purificada a domicilio en Cauquenes",
  description:
    "Hidratación de primera, directo a tu puerta en Cauquenes. Recargas 20L, envases nuevos y packs. Pedí por WhatsApp.",
};

export default function MiBidonLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={`${jakarta.variable} mb-shell min-h-screen antialiased`}
      style={{
        fontFamily: "var(--font-mb-jakarta), 'Plus Jakarta Sans', sans-serif",
      }}
    >
      {children}
    </div>
  );
}
