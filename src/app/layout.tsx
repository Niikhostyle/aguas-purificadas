import type { Metadata } from "next";
import { Roboto_Condensed, Yanone_Kaffeesatz } from "next/font/google";
import "./globals.css";

const display = Yanone_Kaffeesatz({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const body = Roboto_Condensed({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Aguas Purificadas",
    template: "%s · Aguas Purificadas",
  },
  description:
    "Plataforma white-label para tiendas de agua purificada a domicilio.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${display.variable} ${body.variable} h-full antialiased`}
    >
      <body className="rc-body min-h-full flex flex-col">{children}</body>
    </html>
  );
}
