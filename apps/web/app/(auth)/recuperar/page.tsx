import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { createServerClient } from "@tecni/db";
import { serverEnv } from "@tecni/shared";

import { requestResetAction, confirmPasswordAction } from "./actions";

export const metadata: Metadata = {
  title: "Recuperar contraseña",
};

const inputClass =
  "w-full rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-text " +
  "placeholder:text-text-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-subtle";

async function hasRecoverySession(): Promise<boolean> {
  const cookieStore = await cookies();
  const authClient = createServerClient(
    serverEnv.NEXT_PUBLIC_SUPABASE_URL,
    serverEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { getAll: () => cookieStore.getAll(), setAll: () => {} },
  );
  const { data } = await authClient.auth.getUser();
  return data.user !== null;
}

export default async function RecuperarPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sent?: string }>;
}) {
  const { error, sent } = await searchParams;
  const confirming = await hasRecoverySession();

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-4 py-16">
      <div>
        <h1 className="text-2xl font-semibold text-text">
          {confirming ? "Elige una nueva contraseña" : "Recuperar contraseña"}
        </h1>
        {!confirming ? (
          <p className="mt-1 text-sm text-text-muted">
            Te enviamos un enlace para restablecer al correo registrado.
          </p>
        ) : null}
      </div>

      {sent ? (
        <p className="rounded-[var(--radius)] border border-success bg-success/10 px-3 py-2 text-sm text-success">
          Si el correo está registrado, te enviamos un enlace para restablecer la contraseña.
        </p>
      ) : null}

      {error ? (
        <p role="alert" className="rounded-[var(--radius)] border border-danger bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}

      {confirming ? (
        <form action={confirmPasswordAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="password" className="text-sm font-medium text-text">
              Nueva contraseña
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
          <button
            type="submit"
            className="mt-2 rounded-[var(--radius)] bg-brand px-4 py-2 font-medium text-text-inverse transition-colors hover:bg-brand-hover"
          >
            Guardar contraseña
          </button>
        </form>
      ) : (
        <form action={requestResetAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="email" className="text-sm font-medium text-text">
              Correo
            </label>
            <input id="email" name="email" type="email" required className={inputClass} />
          </div>
          <button
            type="submit"
            className="mt-2 rounded-[var(--radius)] bg-brand px-4 py-2 font-medium text-text-inverse transition-colors hover:bg-brand-hover"
          >
            Enviar enlace
          </button>
        </form>
      )}

      <p className="text-sm text-text-muted">
        <Link href="/login" className="font-medium text-brand hover:text-brand-hover">
          Volver a iniciar sesión
        </Link>
      </p>
    </div>
  );
}
