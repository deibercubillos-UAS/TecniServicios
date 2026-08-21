import type { Metadata } from "next";
import Link from "next/link";
import { Icon, type IconName } from "@tecni/ui";

const TITLE = "Tecnisas × Bitafly — Aliados estratégicos";
const DESCRIPTION =
  "Alianza comercial entre Tecni Equipos y Servicios SAS y Bitafly, plataforma de gestión aeronáutica para operadores de drones en Colombia (RAC 100).";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/tecnisas-bitafly-aliados-estrategicos" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "/tecnisas-bitafly-aliados-estrategicos",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: TITLE,
    description: DESCRIPTION,
  },
};

const MODULES: { icon: IconName; title: string; description: string }[] = [
  {
    icon: "document",
    title: "Bitácora digital RAC 100",
    description: "Registro de cada vuelo con los campos exigidos por la AeroCivil, con suma automática de horas.",
  },
  {
    icon: "box",
    title: "Gestión de flota",
    description: "Registro de aeronaves, estado operativo y horas de vuelo en tiempo real.",
  },
  {
    icon: "wrench",
    title: "Mantenimiento programado",
    description: "Alertas por horas de vuelo o fecha, con trazabilidad de componentes cambiados.",
  },
  {
    icon: "shield",
    title: "SMS aeronáutico",
    description: "Sistema de Gestión de Seguridad Operacional: matriz de riesgo, indicadores y auditoría interna.",
  },
  {
    icon: "history",
    title: "Reportes y auditoría",
    description: "Más de 20 formatos en PDF y Excel listos para una auditoría de la AeroCivil.",
  },
  {
    icon: "user",
    title: "Gestión de pilotos",
    description: "Expediente digital por tripulante: certificados, licencias y alertas de vencimiento.",
  },
];

const bitaflyOrganizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Bitafly",
  url: "https://bitafly.com",
  description: "Software de gestión aeronáutica para operadores de drones (UAS) en Colombia, con cumplimiento RAC 100.",
  sameAs: ["https://www.linkedin.com/company/bitafly", "https://www.instagram.com/bitafly.co"],
};

/** Página pública sobre una alianza comercial real (Bitafly construyó el
 * sitio de Tecnisas; a cambio hay descuento cruzado en la plataforma y
 * drones de Bitafly para clientes de Tecnisas). Contenido honesto y
 * visible — nunca oculto ni enlazado desde la navegación principal
 * (pedido explícito del usuario de mantenerla de bajo perfil, sin
 * cruzar a cloaking: sigue en el sitemap y en el footer). */
export default function AlianzaBitaflyPage() {
  return (
    <div className="flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(bitaflyOrganizationJsonLd).replace(/</g, "\\u003c") }}
      />

      <section className="bg-bg-inverse py-16 md:py-20">
        <div className="mx-auto flex max-w-[900px] flex-col gap-4 px-4 text-center md:px-6">
          <span className="mx-auto flex items-center gap-2 rounded-full border border-border-inverse px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-text-inverse-muted">
            <Icon name="handshake" size={14} className="text-brand" />
            Aliados estratégicos
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-text-inverse md:text-5xl">Tecnisas × Bitafly</h1>
          <p className="mx-auto max-w-2xl text-text-inverse-muted md:text-lg">
            Bitafly construyó el sitio web de Tecni Equipos y Servicios SAS. Como parte de esa alianza, ofrecemos a nuestros
            clientes un descuento en la plataforma y los drones de Bitafly.
          </p>
        </div>
      </section>

      <section className="mx-auto flex max-w-[800px] flex-col gap-4 px-4 py-16 md:px-6">
        <h2 className="text-2xl font-bold text-text">Qué es Bitafly</h2>
        <p className="text-text-muted">
          Bitafly es una plataforma SaaS de gestión aeronáutica para operadores de drones (UAS) en Colombia, diseñada
          para el cumplimiento de la RAC 100 desde el primer vuelo. Centraliza la bitácora digital de vuelo, la
          programación de misiones con evaluación de riesgo (SORA), el mantenimiento de flota y baterías, el Sistema
          de Gestión de Seguridad Operacional (SMS) y los reportes exigidos por la AeroCivil, todo en la nube.
        </p>
        <p className="text-text-muted">
          Está pensada para operadores que necesitan llevar su operación con trazabilidad completa — desde un piloto
          independiente hasta empresas con flotas de varias aeronaves — sin depender de planillas sueltas ni archivos
          dispersos.
        </p>
      </section>

      <section className="bg-bg-alt py-16">
        <div className="mx-auto flex max-w-[900px] flex-col gap-6 px-4 md:px-6">
          <h2 className="text-2xl font-bold text-text">La alianza</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-border bg-surface p-5">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-subtle text-brand">
                <Icon name="document" size={18} />
              </span>
              <h3 className="mt-3 font-semibold text-text">Para Tecnisas</h3>
              <p className="mt-1 text-sm text-text-muted">
                Bitafly diseñó y construyó el sitio web de Tecni Equipos y Servicios SAS que estás visitando.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface p-5">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-subtle text-brand">
                <Icon name="bolt" size={18} />
              </span>
              <h3 className="mt-3 font-semibold text-text">Para clientes de Tecnisas</h3>
              <p className="mt-1 text-sm text-text-muted">
                Descuento comercial en la plataforma y los drones de Bitafly para clientes de Tecni Equipos y
                Servicios SAS interesados en operación de drones.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto flex max-w-[1100px] flex-col gap-6 px-4 py-16 md:px-6">
        <h2 className="text-2xl font-bold text-text">Módulos de Bitafly</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MODULES.map((mod) => (
            <div key={mod.title} className="rounded-xl border border-border bg-surface p-5">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-subtle text-brand">
                <Icon name={mod.icon} size={18} />
              </span>
              <h3 className="mt-3 font-semibold text-text">{mod.title}</h3>
              <p className="mt-1 text-sm text-text-muted">{mod.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-bg-inverse py-16">
        <div className="mx-auto flex max-w-[700px] flex-col items-center gap-4 px-4 text-center md:px-6">
          <h2 className="text-2xl font-bold text-text-inverse">¿Operas drones y quieres el descuento?</h2>
          <p className="text-text-inverse-muted">Conoce Bitafly directamente o escríbenos y te ponemos en contacto.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <a
              href="https://bitafly.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-[var(--radius)] bg-brand px-6 py-3 text-sm font-semibold text-text-inverse transition-colors hover:bg-brand-hover"
            >
              Conocer Bitafly
              <Icon name="arrowRight" size={18} />
            </a>
            <Link
              href="/contacto"
              className="flex items-center gap-2 rounded-[var(--radius)] border border-text-inverse px-6 py-3 text-sm font-semibold text-text-inverse transition-colors hover:bg-text-inverse hover:text-bg-inverse"
            >
              <Icon name="headset" size={18} />
              Hablar con Tecnisas
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
