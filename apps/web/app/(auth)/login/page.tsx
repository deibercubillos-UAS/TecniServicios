import type { Metadata } from "next";
import Link from "next/link";

import { loginAction } from "./actions";

export const metadata: Metadata = {
  title: "Iniciar sesión — Tecni Equipos y Servicios SAS",
};

const inputClass =
  "w-full rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-text " +
  "placeholder:text-text-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-subtle";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string; message?: string }>;
}) {
  const { error, next, message } = await searchParams;
  const nextValue = next && next.startsWith("/") && !next.startsWith("//") ? next : "/";

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-4 py-16">
      <div>
        <h1 className="text-2xl font-semibold text-text">Iniciar sesión</h1>
        <p className="mt-1 text-sm text-text-muted">
          Accedé a precios, cotizaciones, pedidos y el seguimiento de tus equipos.
        </p>
      </div>

      {message ? (
        <p className="rounded-[var(--radius)] border border-success bg-success/10 px-3 py-2 text-sm text-success">
          {message}
        </p>
      ) : null}

      {error ? (
        <p className="rounded-[var(--radius)] border border-danger bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}

      <form action={loginAction} className="flex flex-col gap-4">
        <input type="hidden" name="next" value={nextValue} />

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
          <input id="password" name="password" type="password" required className={inputClass} />
        </div>

        <button
          type="submit"
          className="mt-2 rounded-[var(--radius)] bg-brand px-4 py-2 font-medium text-text-inverse transition-colors hover:bg-brand-hover"
        >
          Iniciar sesión
        </button>
      </form>

      <div className="flex flex-col gap-1 text-sm text-text-muted">
        <Link href="/recuperar" className="font-medium text-brand hover:text-brand-hover">
          ¿Olvidaste tu contraseña?
        </Link>
        <p>
          ¿No estas aun registrado?{" "}
          <Link href="/registro" className="font-medium text-brand hover:text-brand-hover">
            Regístrate
          </Link>
        </p>
      </div>
    </div>
  );
}
