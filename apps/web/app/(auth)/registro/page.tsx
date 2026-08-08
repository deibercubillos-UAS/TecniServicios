import type { Metadata } from "next";
import Link from "next/link";

import { registerAction } from "./actions";

export const metadata: Metadata = {
  title: "Crear cuenta — Tecni Equipos y Servicios SAS",
};

const inputClass =
  "w-full rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-text " +
  "placeholder:text-text-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-subtle";

export default async function RegistroPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-4 py-16">
      <div>
        <h1 className="text-2xl font-semibold text-text">Crear cuenta</h1>
        <p className="mt-1 text-sm text-text-muted">
          Registra tu empresa para ver precios, cotizar y hacer seguimiento a tus pedidos.
        </p>
      </div>

      {error ? (
        <p className="rounded-[var(--radius)] border border-danger bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}

      <form action={registerAction} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="fullName" className="text-sm font-medium text-text">
            Nombre completo
          </label>
          <input id="fullName" name="fullName" type="text" required className={inputClass} />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="email" className="text-sm font-medium text-text">
            Correo
          </label>
          <input id="email" name="email" type="email" required className={inputClass} />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="password" className="text-sm font-medium text-text">
            Contraseña
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="phone" className="text-sm font-medium text-text">
            Teléfono <span className="text-text-muted">(opcional)</span>
          </label>
          <input id="phone" name="phone" type="tel" className={inputClass} />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="documentNumber" className="text-sm font-medium text-text">
            NIT de la empresa
          </label>
          <input id="documentNumber" name="documentNumber" type="text" required className={inputClass} />
          <p className="text-xs text-text-muted">
            Si el NIT ya está registrado, te unís como comprador de esa empresa.
          </p>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="companyLegalName" className="text-sm font-medium text-text">
            Razón social <span className="text-text-muted">(si el NIT es nuevo)</span>
          </label>
          <input id="companyLegalName" name="companyLegalName" type="text" className={inputClass} />
        </div>

        <label className="flex items-start gap-2 text-sm text-text-muted">
          <input
            type="checkbox"
            name="acceptsDataConsent"
            required
            className="mt-1 h-4 w-4 rounded border-border"
          />
          <span>
            Autorizo el tratamiento de mis datos personales conforme a la Ley 1581 de 2012 y la
            política de privacidad de Tecni Equipos y Servicios SAS.
          </span>
        </label>

        <button
          type="submit"
          className="mt-2 rounded-[var(--radius)] bg-brand px-4 py-2 font-medium text-text-inverse transition-colors hover:bg-brand-hover"
        >
          Crear cuenta
        </button>
      </form>

      <p className="text-sm text-text-muted">
        ¿Ya tenés cuenta?{" "}
        <Link href="/login" className="font-medium text-brand hover:text-brand-hover">
          Inicia sesión
        </Link>
      </p>
    </div>
  );
}
