import type { Metadata } from "next";

import "./globals.css";

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
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
