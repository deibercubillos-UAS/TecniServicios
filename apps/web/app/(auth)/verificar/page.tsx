import type { Metadata } from "next";
import Link from "next/link";

import { resendVerificationAction } from "./actions";

export const metadata: Metadata = {
  title: "Verifica tu correo — Tecni Equipos y Servicios SAS",
};

export default async function VerificarPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; sent?: string; error?: string }>;
}) {
  const { email, sent, error } = await searchParams;

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-4 py-16 text-center">
      <div>
        <h1 className="text-2xl font-semibold text-text">Verifica tu correo</h1>
        {email ? (
          <p className="mt-2 text-sm text-text-muted">
            Te enviamos un enlace de confirmación a <strong className="text-text">{email}</strong>.
            Abrilo para activar tu cuenta.
          </p>
        ) : (
          <p className="mt-2 text-sm text-text-muted">
            Revisa tu correo y hacé clic en el enlace de confirmación para activar tu cuenta.
          </p>
        )}
      </div>

      {sent ? (
        <p className="rounded-[var(--radius)] border border-success bg-success/10 px-3 py-2 text-sm text-success">
          Te reenviamos el correo de confirmación.
        </p>
      ) : null}

      {error ? (
        <p className="rounded-[var(--radius)] border border-danger bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}

      {email ? (
        <form action={resendVerificationAction} className="flex flex-col items-center gap-2">
          <input type="hidden" name="email" value={email} />
          <button
            type="submit"
            className="rounded-[var(--radius)] border border-border px-4 py-2 text-sm font-medium text-text transition-colors hover:border-brand hover:text-brand"
          >
            Reenviar correo
          </button>
        </form>
      ) : null}

      <p className="text-sm text-text-muted">
        ¿Ya confirmaste?{" "}
        <Link href="/login" className="font-medium text-brand hover:text-brand-hover">
          Inicia sesión
        </Link>
      </p>
    </div>
  );
}
