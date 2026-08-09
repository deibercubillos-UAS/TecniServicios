import type { Metadata } from "next";

import { contactAction } from "./actions";

export const metadata: Metadata = {
  title: "Contacto — Tecni Equipos y Servicios SAS",
  description: "Escríbenos y un asesor de Tecni Equipos y Servicios SAS te responderá por correo.",
};

const inputClass =
  "w-full rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-text " +
  "placeholder:text-text-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-subtle";

export default async function ContactoPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sent?: string }>;
}) {
  const { error, sent } = await searchParams;

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6 px-4 py-16">
      <div>
        <h1 className="text-2xl font-semibold text-text">Contacto</h1>
        <p className="mt-1 text-sm text-text-muted">
          Cuéntanos qué necesitas — equipo, repuesto o soporte técnico — y te respondemos por correo.
        </p>
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
        <div className="flex flex-col gap-1">
          <label htmlFor="name" className="text-sm font-medium text-text">
            Nombre
          </label>
          <input id="name" name="name" type="text" required className={inputClass} />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="email" className="text-sm font-medium text-text">
            Correo
          </label>
          <input id="email" name="email" type="email" required className={inputClass} />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="phone" className="text-sm font-medium text-text">
            Teléfono (opcional)
          </label>
          <input id="phone" name="phone" type="tel" className={inputClass} />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="message" className="text-sm font-medium text-text">
            Mensaje
          </label>
          <textarea id="message" name="message" required rows={5} className={inputClass} />
        </div>
        <button
          type="submit"
          className="mt-2 rounded-[var(--radius)] bg-brand px-4 py-2 font-medium text-text-inverse transition-colors hover:bg-brand-hover"
        >
          Enviar mensaje
        </button>
      </form>
    </div>
  );
}
