import { Archivo_Black, Source_Sans_3 } from "next/font/google";

const display = Archivo_Black({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-mb-display",
});

const body = Source_Sans_3({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-mb-body",
});

export default function MiBidonLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={`${display.variable} ${body.variable} min-h-screen bg-[#f7fbfd] text-[#1d243f] antialiased`}
      style={{
        fontFamily: "var(--font-mb-body), 'Source Sans 3', sans-serif",
      }}
    >
      {children}
    </div>
  );
}
