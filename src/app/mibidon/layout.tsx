import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Source_Sans_3 } from "next/font/google";

const display = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-mb-display",
});

const body = Source_Sans_3({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-mb-body",
});

export const metadata: Metadata = {
  title: "MiBidón · Tienda white-label para embotelladoras de agua",
  description:
    "Multiplica tus ventas de agua purificada. eCommerce white-label con WebPay, rutas por comuna y activación en 24 horas.",
};

export default function MiBidonLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Material Symbols used by Stitch landing icons */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
        rel="stylesheet"
      />
      <div
        className={`${display.variable} ${body.variable} min-h-screen bg-[#faf8ff] text-[#131b2e] antialiased`}
        style={{
          fontFamily: "var(--font-mb-body), 'Source Sans 3', sans-serif",
        }}
      >
        {children}
      </div>
    </>
  );
}
