import type { Metadata } from "next";
import { cookies } from "next/headers";
import { createServerClient } from "@tecni/db";
import { serverEnv } from "@tecni/shared";
import { Badge, Icon } from "@tecni/ui";

import { contactAction } from "./actions";
import { ContactSubmitButton } from "@/components/contact-submit-button";

export const metadata: Metadata = {
  title: "Contacto — Tecni Equipos y Servicios SAS",
  description: "Escríbenos y un asesor de Tecni Equipos y Servicios SAS te responderá por correo.",
};

const inputClass =
  "w-full rounded-[var(--radius)] border border-border bg-bg px-3 py-2 text-text " +
  "placeholder:text-text-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-subtle";

const linkFocusClass = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

const PLACEHOLDER = "Pendiente de definir";

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

/** Muestra el valor real o, si todavía es el placeholder de
 * configuración, un texto en cursiva que no se confunde con un dato de
 * contacto real. */
function ContactValue({ value }: { value: string }) {
  if (value === PLACEHOLDER) {
    return <span className="italic text-text-muted">{value}</span>;
  }
  return <span className="font-semibold text-text">{value}</span>;
}

export default async function ContactoPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sent?: string }>;
}) {
  const { error, sent } = await searchParams;
  const settings = await getContactSettings();

  const whatsapp = settings["contact_whatsapp"] ?? "";
  const phone = settings["contact_phone"] ?? "";
  const email = settings["contact_email"] ?? "";
  const whatsappHref = whatsapp && whatsapp !== PLACEHOLDER ? `https://wa.me/${whatsapp.replace(/\D/g, "")}` : null;
  const phoneHref = phone && phone !== PLACEHOLDER ? `tel:${phone.replace(/[^\d+]/g, "")}` : null;
  const emailHref = email && email !== PLACEHOLDER ? `mailto:${email}` : null;

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
                Tiempo de respuesta promedio: <ContactValue value={settings["contact_response_time"]} />
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
          {whatsapp ? (
            <ContactCard
              icon="chat"
              iconBg="bg-success/10"
              iconColor="text-success"
              title="WhatsApp"
              description="Respuesta directa para consultas rápidas."
              value={whatsapp}
              href={whatsappHref}
            />
          ) : null}

          {phone ? (
            <ContactCard
              icon="phone"
              title="Llámanos"
              description={settings["contact_phone_hours"] || "Horario de atención."}
              value={phone}
              href={phoneHref}
            />
          ) : null}

          {email ? (
            <ContactCard
              icon="mail"
              title="Correo electrónico"
              description="Envíanos documentación técnica o listados."
              value={email}
              href={emailHref}
            />
          ) : null}

          {settings["contact_address_line"] ? (
            <ContactCard
              icon="mapPin"
              title="Visítanos"
              description="Conoce nuestros equipos en exhibición."
              value={settings["contact_address_line"]}
              href={null}
            />
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
              <p className="text-xs text-text-muted">Los campos marcados con * son obligatorios.</p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <label htmlFor="name" className="text-sm font-medium text-text">
                    Nombre completo *
                  </label>
                  <input id="name" name="name" type="text" required autoComplete="name" className={inputClass} />
                </div>
                <div className="flex flex-col gap-1">
                  <label htmlFor="email" className="text-sm font-medium text-text">
                    Correo electrónico *
                  </label>
                  <input id="email" name="email" type="email" required autoComplete="email" className={inputClass} />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="phone" className="text-sm font-medium text-text">
                  Teléfono / WhatsApp (opcional)
                </label>
                <input id="phone" name="phone" type="tel" autoComplete="tel" className={inputClass} />
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
              <ContactSubmitButton />
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
              <p className="text-sm text-text">
                <ContactValue value={settings["contact_address_line"] || PLACEHOLDER} />
              </p>
              <p className="text-sm text-text-muted">{settings["contact_address_city"] || ""}</p>
              {settings["contact_map_link"] ? (
                <a
                  href={settings["contact_map_link"]}
                  target="_blank"
                  rel="noreferrer"
                  className={`mt-3 inline-block rounded text-sm font-semibold text-brand hover:underline ${linkFocusClass}`}
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
                  <dd>
                    <ContactValue value={settings["contact_hours_weekday"] || PLACEHOLDER} />
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-text-muted">Sábados</dt>
                  <dd>
                    <ContactValue value={settings["contact_hours_saturday"] || PLACEHOLDER} />
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function ContactCard({
  icon,
  iconBg = "bg-brand-subtle",
  iconColor = "text-brand",
  title,
  description,
  value,
  href,
}: {
  icon: "chat" | "phone" | "mail" | "mapPin";
  iconBg?: string;
  iconColor?: string;
  title: string;
  description: string;
  value: string;
  href: string | null;
}) {
  const body = (
    <>
      <span className={`flex h-11 w-11 items-center justify-center rounded-full ${iconBg}`}>
        <Icon name={icon} size={20} className={iconColor} />
      </span>
      <h3 className="font-semibold text-text">{title}</h3>
      <p className="text-sm text-text-muted">{description}</p>
      <ContactValue value={value} />
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        className={`flex flex-col gap-3 rounded-lg border border-border bg-bg p-5 transition-colors hover:border-brand ${linkFocusClass}`}
      >
        {body}
      </a>
    );
  }

  return <div className="flex flex-col gap-3 rounded-lg border border-border bg-bg p-5">{body}</div>;
}
