import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import { serverEnv } from "@tecni/shared";

import { AnnouncementBar } from "@/components/announcement-bar";
import { CartDrawer } from "@/components/cart-drawer/cart-drawer";
import { CartDrawerProvider } from "@/components/cart-drawer/cart-drawer-context";
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

const siteUrl = serverEnv.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const SITE_NAME = "Tecni Equipos y Servicios SAS";
const SITE_DESCRIPTION =
  "Maquinaria, herramientas, repuestos y consumibles para el sector automotriz — alineación, balanceo, elevación, diagnóstico y lubricación. Soluciones que construyen confianza.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: SITE_NAME, template: `%s — ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  icons: {
    icon: "/brand/logo-mark.png",
    shortcut: "/brand/logo-mark.png",
    apple: "/brand/logo-mark.png",
  },
  openGraph: {
    type: "website",
    locale: "es_CO",
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: siteUrl,
    images: [{ url: "/brand/logo-full-dark.png", width: 1536, height: 1024, alt: SITE_NAME }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: ["/brand/logo-full-dark.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={montserrat.variable}>
      <head>
        {/* Fotos de producto/categoría/marca/banner/blog se sirven desde
            acá (R2) — adelanta la conexión TLS antes de que el navegador
            descubra las URLs de imagen. */}
        <link rel="preconnect" href="https://assets.tecnisas.co" />
        <link rel="dns-prefetch" href="https://assets.tecnisas.co" />
      </head>
      <body className="flex min-h-screen flex-col bg-bg font-sans text-text">
        <CartDrawerProvider>
          <AnnouncementBar />
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
          <CompareBar />
          <CartDrawer />
        </CartDrawerProvider>
      </body>
    </html>
  );
}
