import type { Metadata } from "next";
import { Montserrat } from "next/font/google";

import { CompareBar } from "@/components/compare-bar";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import "@/lib/env";

import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-montserrat",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Tecni Equipos y Servicios SAS",
  description: "Soluciones que construyen confianza",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={montserrat.variable}>
      <body className="flex min-h-screen flex-col bg-bg font-sans text-text">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
        <CompareBar />
      </body>
    </html>
  );
}
