import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@tecni/db";
import { serverEnv } from "@tecni/shared";

import { requestDataDeletionAction } from "./actions";

export const metadata: Metadata = {
  title: "Mis datos personales — Tecni Equipos y Servicios SAS",
};

interface ProfileRow {
  full_name: string;
  phone: string | null;
  consent_accepted_at: string | null;
  consent_ip: string | null;
  consent_policy_version: string | null;
}

async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(serverEnv.NEXT_PUBLIC_SUPABASE_URL, serverEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    getAll: () => cookieStore.getAll(),
    setAll: () => {},
  });
}

export default async function MiCuentaPrivacidadPage({ searchParams }: { searchParams: Promise<{ error?: string; sent?: string }> }) {
  const { error, sent } = await searchParams;
  const supabase = await getSupabase();

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    redirect("/login?next=/mi-cuenta/privacidad");
  }

  const { data: profileData } = await supabase
    .from("profiles")
    .select("full_name,phone,consent_accepted_at,consent_ip,consent_policy_version")
    .eq("id", userData.user.id)
    .maybeSingle();
  const profile = profileData as ProfileRow | null;

  return (
    <div className="mx-auto flex max-w-[700px] flex-col gap-6 px-4 py-16">
      <h1 className="text-2xl font-bold text-text">Mis datos personales</h1>
      <p className="text-sm text-text-muted">
        Ley 1581 de 2012 (habeas data). Ver el detalle completo en{" "}
        <Link href="/politica-de-tratamiento-de-datos" className="text-brand hover:underline">
          la política de tratamiento de datos
        </Link>
        .
      </p>

      <section className="rounded-lg border border-border p-4">
        <h2 className="mb-2 font-semibold text-text">Tus datos y consentimiento</h2>
        <dl className="flex flex-col gap-1 text-sm">
          <div className="flex justify-between">
            <dt className="text-text-muted">Nombre</dt>
            <dd className="text-text">{profile?.full_name ?? "—"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-text-muted">Correo</dt>
            <dd className="text-text">{userData.user.email}</dd>
          </div>
          {profile?.phone ? (
            <div className="flex justify-between">
              <dt className="text-text-muted">Teléfono</dt>
              <dd className="text-text">{profile.phone}</dd>
            </div>
          ) : null}
          <div className="flex justify-between">
            <dt className="text-text-muted">Consentimiento aceptado</dt>
            <dd className="text-text">
              {profile?.consent_accepted_at ? new Date(profile.consent_accepted_at).toLocaleString("es-CO") : "—"}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-text-muted">Versión de la política</dt>
            <dd className="text-text">{profile?.consent_policy_version ?? "—"}</dd>
          </div>
        </dl>
      </section>

      <section className="flex flex-col gap-3 rounded-lg border border-border p-4">
        <h2 className="font-semibold text-text">Solicitar supresión de tus datos</h2>
        <p className="text-sm text-text-muted">
          Puedes solicitar que anonimicemos tu perfil (nombre, teléfono). Los pedidos, cotizaciones y pagos con historial de
          facturación se conservan sin dato personal legible — obligación de conservación fiscal ante la DIAN, no se pueden
          eliminar. Un miembro de nuestro equipo procesa la solicitud manualmente.
        </p>

        {sent ? (
          <p className="rounded-[var(--radius)] border border-success bg-success/10 px-3 py-2 text-sm text-success">
            Solicitud enviada. Te contactaremos para confirmar.
          </p>
        ) : null}
        {error ? (
          <p role="alert" className="rounded-[var(--radius)] border border-danger bg-danger/10 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        ) : null}

        <form action={requestDataDeletionAction} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor="detail" className="text-sm text-text-muted">
              Detalle adicional (opcional)
            </label>
            <textarea id="detail" name="detail" rows={3} className="rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm" />
          </div>
          <button
            type="submit"
            className="self-start rounded-[var(--radius)] bg-brand px-4 py-2 text-sm font-semibold text-text-inverse transition-colors hover:bg-brand-hover"
          >
            Enviar solicitud de supresión
          </button>
        </form>
      </section>

      <Link href="/mi-cuenta" className="text-sm text-brand hover:underline">
        Volver a mi cuenta
      </Link>
    </div>
  );
}
