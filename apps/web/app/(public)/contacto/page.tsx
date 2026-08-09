import type { Metadata } from "next";
import { cookies } from "next/headers";
import { createServerClient } from "@tecni/db";
import { serverEnv } from "@tecni/shared";
import { Badge, Icon } from "@tecni/ui";

import { contactAction } from "./actions";

export const metadata: Metadata = {
  title: "Contacto — Tecni Equipos y Servicios SAS",
  description: "Escríbenos y un asesor de Tecni Equipos y Servicios SAS te responderá por correo.",
};

const inputClass =
  "w-full rounded-[var(--radius)] border border-border bg-bg px-3 py-2 text-text " +
  "placeholder:text-text-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-subtle";

interface SettingRow {
  key: string;
  value: unknown;
}

async function getContactSettings(): Promise<Record<string, string>> {
  const cookieStore = await cookies();
  const supabase = createServerClient(serverEnv.NEXT_PUBLIC_SUPABASE_URL, serverEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    getAll: () => cookieStore.getAll(),
    setAll: () => {},
  });
  const { data } = await supabase.from("settings").select("key,value").like("key", "contact_%");
  const rows = (data as SettingRow[] | null) ?? [];
  return Object.fromEntries(rows.map((r) => [r.key, typeof r.value === "string" ? r.value : ""]));
}

export default async function ContactoPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sent?: string }>;
}) {
  const { error, sent } = await searchParams;
  const settings = await getContactSettings();

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="bg-bg-inverse py-16 md:py-20">
        <div className="mx-auto grid max-w-[1280px] grid-cols-1 items-center gap-10 px-4 md:grid-cols-2 md:px-6">
          <div>
            <Badge>Estamos para ayudarte</Badge>
            <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-text-inverse md:text-5xl">Hablemos de tu proyecto</h1>
            <p className="mt-4 max-w-lg text-text-inverse-muted">
              Ya sea una pregunta rápida o una cotización para tu taller, nuestro equipo está listo para ayudarte a encontrar la
              solución correcta.
            </p>
            {settings["contact_response_time"] ? (
              <div className="mt-6 inline-flex items-center gap-2 rounded-[var(--radius)] border border-border-inverse bg-bg-inverse px-4 py-2 text-sm text-text-inverse-muted">
                <Icon name="bolt" size={16} className="text-brand" />
                Tiempo de respuesta promedio: {settings["contact_response_time"]}
              </div>
            ) : null}
          </div>
          <div className="flex aspect-[4/3] items-center justify-center rounded-lg border border-border-inverse bg-surface-inverse">
            <div className="flex flex-col items-center gap-2 text-text-inverse-muted">
              <Icon name="mapPin" size={32} className="text-brand" />
              <span className="text-sm">Mapa de la sede</span>
            </div>
          </div>
        </div>
      </section>

      {/* Métodos de contacto rápido */}
      <section className="border-b border-border bg-surface py-10">
        <div className="mx-auto grid max-w-[1280px] grid-cols-1 gap-4 px-4 sm:grid-cols-2 md:px-6 lg:grid-cols-4">
          {settings["contact_whatsapp"] ? (
            <div className="flex flex-col gap-3 rounded-lg border border-border bg-bg p-5">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-success/10">
                <Icon name="chat" size={20} className="text-success" />
              </span>
              <h3 className="font-semibold text-text">WhatsApp</h3>
              <p className="text-sm text-text-muted">Respuesta directa para consultas rápidas.</p>
              <span className="font-semibold text-text">{settings["contact_whatsapp"]}</span>
            </div>
          ) : null}

          {settings["contact_phone"] ? (
            <div className="flex flex-col gap-3 rounded-lg border border-border bg-bg p-5">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-subtle">
                <Icon name="phone" size={20} className="text-brand" />
              </span>
              <h3 className="font-semibold text-text">Llámanos</h3>
              <p className="text-sm text-text-muted">{settings["contact_phone_hours"] || "Horario de atención."}</p>
              <span className="font-semibold text-text">{settings["contact_phone"]}</span>
            </div>
          ) : null}

          {settings["contact_email"] ? (
            <div className="flex flex-col gap-3 rounded-lg border border-border bg-bg p-5">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-subtle">
                <Icon name="mail" size={20} className="text-brand" />
              </span>
              <h3 className="font-semibold text-text">Correo electrónico</h3>
              <p className="text-sm text-text-muted">Envíanos documentación técnica o listados.</p>
              <span className="font-semibold text-text">{settings["contact_email"]}</span>
            </div>
          ) : null}

          {settings["contact_address_line"] ? (
            <div className="flex flex-col gap-3 rounded-lg border border-border bg-bg p-5">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-subtle">
                <Icon name="mapPin" size={20} className="text-brand" />
              </span>
              <h3 className="font-semibold text-text">Visítanos</h3>
              <p className="text-sm text-text-muted">Conoce nuestros equipos en exhibición.</p>
              <span className="font-semibold text-text">{settings["contact_address_line"]}</span>
            </div>
          ) : null}
        </div>
      </section>

      {/* Formulario + sidebar */}
      <section className="bg-bg-alt py-16">
        <div className="mx-auto grid max-w-[1280px] grid-cols-1 gap-8 px-4 md:grid-cols-3 md:px-6">
          <div className="flex flex-col gap-6 rounded-lg border border-border bg-surface p-6 shadow-sm md:col-span-2 md:p-8">
            <div>
              <h2 className="text-2xl font-bold text-text">Envíanos un mensaje</h2>
              <p className="mt-1 text-sm text-text-muted">Cuéntanos qué necesitas y te respondemos por correo.</p>
            </div>

            {sent ? (
              <p className="rounded-[var(--radius)] border border-success bg-success/10 px-3 py-2 text-sm text-success">
                Mensaje enviado. Te responderemos al correo que dejaste.
              </p>
            ) : null}
            {error ? (
              <p role="alert" className="rounded-[var(--radius)] border border-danger bg-danger/10 px-3 py-2 text-sm text-danger">
                {error}
              </p>
            ) : null}

            <form action={contactAction} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <label htmlFor="name" className="text-sm font-medium text-text">
                    Nombre completo *
                  </label>
                  <input id="name" name="name" type="text" required className={inputClass} />
                </div>
                <div className="flex flex-col gap-1">
                  <label htmlFor="email" className="text-sm font-medium text-text">
                    Correo electrónico *
                  </label>
                  <input id="email" name="email" type="email" required className={inputClass} />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="phone" className="text-sm font-medium text-text">
                  Teléfono / WhatsApp (opcional)
                </label>
                <input id="phone" name="phone" type="tel" className={inputClass} />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="message" className="text-sm font-medium text-text">
                  Mensaje *
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={5}
                  placeholder="Cuéntanos qué necesitas para tu taller..."
                  className={inputClass}
                />
              </div>
              <button
                type="submit"
                className="mt-2 flex items-center justify-center gap-2 rounded-[var(--radius)] bg-brand px-4 py-3 font-semibold text-text-inverse transition-colors hover:bg-brand-hover"
              >
                Enviar mensaje
                <Icon name="arrowRight" size={18} />
              </button>
              {settings["contact_response_time"] ? (
                <p className="flex items-center gap-2 text-xs text-text-muted">
                  <Icon name="clock" size={14} />
                  Te responderemos en {settings["contact_response_time"]}.
                </p>
              ) : null}
            </form>
          </div>

          <div className="flex flex-col gap-6">
            <div className="rounded-lg border border-border bg-surface p-6">
              <h3 className="mb-3 flex items-center gap-2 font-semibold text-text">
                <Icon name="mapPin" size={18} className="text-brand" />
                Nuestra sede
              </h3>
              <p className="text-sm text-text">{settings["contact_address_line"] || "Pendiente de definir"}</p>
              <p className="text-sm text-text-muted">{settings["contact_address_city"] || ""}</p>
              {settings["contact_map_link"] ? (
                <a
                  href={settings["contact_map_link"]}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-block text-sm font-semibold text-brand hover:underline"
                >
                  Cómo llegar en Google Maps
                </a>
              ) : null}
            </div>

            <div className="rounded-lg border border-border bg-surface p-6">
              <h3 className="mb-3 flex items-center gap-2 font-semibold text-text">
                <Icon name="clock" size={18} className="text-brand" />
                Horario de atención
              </h3>
              <dl className="flex flex-col gap-2 text-sm">
                <div className="flex justify-between border-b border-border pb-2">
                  <dt className="text-text-muted">Lunes a viernes</dt>
                  <dd className="font-medium text-text">{settings["contact_hours_weekday"] || "Pendiente de definir"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-text-muted">Sábados</dt>
                  <dd className="font-medium text-text">{settings["contact_hours_saturday"] || "Pendiente de definir"}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
