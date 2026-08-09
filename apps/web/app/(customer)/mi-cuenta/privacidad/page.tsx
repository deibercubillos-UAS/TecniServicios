import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@tecni/db";
import { serverEnv } from "@tecni/shared";
import { Icon } from "@tecni/ui";

import { deleteAccountAction, updateCompanyAction, updateEmailAction, updatePasswordAction, updateProfileAction } from "./actions";

export const metadata: Metadata = {
  title: "Mis datos personales — Tecni Equipos y Servicios SAS",
};

interface ProfileRow {
  full_name: string;
  phone: string | null;
}

interface CompanyRow {
  id: string;
  legal_name: string;
  trade_name: string | null;
  address: string | null;
  city: string | null;
  department: string | null;
  phone: string | null;
  email: string | null;
}

async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(serverEnv.NEXT_PUBLIC_SUPABASE_URL, serverEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    getAll: () => cookieStore.getAll(),
    setAll: () => {},
  });
}

export default async function MiCuentaPrivacidadPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    profileSaved?: string;
    emailPending?: string;
    companySaved?: string;
    passwordSaved?: string;
    deletionSent?: string;
  }>;
}) {
  const { error, profileSaved, emailPending, companySaved, passwordSaved, deletionSent } = await searchParams;
  const supabase = await getSupabase();

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    redirect("/login?next=/mi-cuenta/privacidad");
  }

  const { data: profileData } = await supabase.from("profiles").select("full_name,phone").eq("id", userData.user.id).maybeSingle();
  const profile = profileData as ProfileRow | null;

  const { data: membership } = await supabase
    .from("company_members")
    .select("member_role,companies(id,legal_name,trade_name,address,city,department,phone,email)")
    .eq("profile_id", userData.user.id)
    .order("is_primary", { ascending: false })
    .limit(1)
    .maybeSingle();
  const company = (membership?.companies as unknown as CompanyRow | null) ?? null;
  const canEditCompany = membership?.member_role === "owner" || membership?.member_role === "accounting";

  return (
    <div className="mx-auto flex max-w-[700px] flex-col gap-6 px-4 py-12 sm:py-16">
      <div>
        <h1 className="text-2xl font-bold text-text">Mis datos personales</h1>
        <p className="text-sm text-text-muted">
          Ley 1581 de 2012 (habeas data). Ver el detalle completo en{" "}
          <Link href="/politica-de-tratamiento-de-datos" className="font-medium text-brand hover:underline">
            la política de tratamiento de datos
          </Link>
          .
        </p>
      </div>

      {profileSaved ? (
        <p className="flex items-center gap-2 rounded-[var(--radius)] border border-success bg-success/10 px-3 py-2 text-sm text-success">
          <Icon name="checkCircle" size={16} />
          Datos actualizados.
        </p>
      ) : null}
      {emailPending ? (
        <p className="flex items-center gap-2 rounded-[var(--radius)] border border-warning bg-warning/10 px-3 py-2 text-sm text-warning">
          <Icon name="mail" size={16} />
          Revisa tu correo para confirmar el cambio de dirección de email.
        </p>
      ) : null}
      {companySaved ? (
        <p className="flex items-center gap-2 rounded-[var(--radius)] border border-success bg-success/10 px-3 py-2 text-sm text-success">
          <Icon name="checkCircle" size={16} />
          Datos de la empresa actualizados.
        </p>
      ) : null}
      {passwordSaved ? (
        <p className="flex items-center gap-2 rounded-[var(--radius)] border border-success bg-success/10 px-3 py-2 text-sm text-success">
          <Icon name="checkCircle" size={16} />
          Contraseña actualizada.
        </p>
      ) : null}
      {deletionSent ? (
        <p className="flex items-center gap-2 rounded-[var(--radius)] border border-success bg-success/10 px-3 py-2 text-sm text-success">
          <Icon name="checkCircle" size={16} />
          Solicitud de eliminación enviada. Te contactaremos para confirmar.
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="flex items-center gap-2 rounded-[var(--radius)] border border-danger bg-danger/10 px-3 py-2 text-sm text-danger">
          <Icon name="close" size={16} />
          {error}
        </p>
      ) : null}

      <section className="rounded-xl border border-border bg-surface p-5">
        <h2 className="mb-4 flex items-center gap-2 font-bold text-text">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-subtle text-brand">
            <Icon name="user" size={16} />
          </span>
          Nombre y teléfono
        </h2>
        <form action={updateProfileAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="fullName" className="text-sm font-medium text-text-muted">
              Nombre completo
            </label>
            <input
              id="fullName"
              name="fullName"
              defaultValue={profile?.full_name ?? ""}
              required
              autoComplete="name"
              className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="phone" className="text-sm font-medium text-text-muted">
              Teléfono de contacto
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              defaultValue={profile?.phone ?? ""}
              autoComplete="tel"
              className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="flex w-fit items-center gap-2 rounded-[var(--radius)] bg-brand px-5 py-2.5 text-sm font-semibold text-text-inverse transition-colors hover:bg-brand-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            Guardar cambios
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-border bg-surface p-5">
        <h2 className="mb-4 flex items-center gap-2 font-bold text-text">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-subtle text-brand">
            <Icon name="mail" size={16} />
          </span>
          Correo electrónico
        </h2>
        <form action={updateEmailAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="email" className="text-sm font-medium text-text-muted">
              Correo
            </label>
            <input
              id="email"
              name="email"
              type="email"
              defaultValue={userData.user.email ?? ""}
              required
              autoComplete="email"
              className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
            />
          </div>
          <p className="text-xs text-text-muted">Al cambiarlo te enviamos un correo de confirmación antes de aplicarlo.</p>
          <button
            type="submit"
            className="flex w-fit items-center gap-2 rounded-[var(--radius)] bg-brand px-5 py-2.5 text-sm font-semibold text-text-inverse transition-colors hover:bg-brand-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            Actualizar correo
          </button>
        </form>
      </section>

      {company ? (
        <section className="rounded-xl border border-border bg-surface p-5">
          <h2 className="mb-4 flex items-center gap-2 font-bold text-text">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-subtle text-brand">
              <Icon name="building" size={16} />
            </span>
            Datos de {company.trade_name ?? company.legal_name}
          </h2>
          {canEditCompany ? (
            <form action={updateCompanyAction} className="flex flex-col gap-4">
              <input type="hidden" name="companyId" value={company.id} />
              <div className="flex flex-col gap-1">
                <label htmlFor="address" className="text-sm font-medium text-text-muted">
                  Dirección
                </label>
                <input
                  id="address"
                  name="address"
                  defaultValue={company.address ?? ""}
                  autoComplete="street-address"
                  className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <label htmlFor="city" className="text-sm font-medium text-text-muted">
                    Ciudad
                  </label>
                  <input
                    id="city"
                    name="city"
                    defaultValue={company.city ?? ""}
                    autoComplete="address-level2"
                    className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label htmlFor="department" className="text-sm font-medium text-text-muted">
                    Departamento
                  </label>
                  <input
                    id="department"
                    name="department"
                    defaultValue={company.department ?? ""}
                    autoComplete="address-level1"
                    className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <label htmlFor="companyPhone" className="text-sm font-medium text-text-muted">
                    Teléfono
                  </label>
                  <input
                    id="companyPhone"
                    name="phone"
                    type="tel"
                    defaultValue={company.phone ?? ""}
                    autoComplete="tel"
                    className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label htmlFor="companyEmail" className="text-sm font-medium text-text-muted">
                    Correo de la empresa
                  </label>
                  <input
                    id="companyEmail"
                    name="email"
                    type="email"
                    defaultValue={company.email ?? ""}
                    autoComplete="email"
                    className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="flex w-fit items-center gap-2 rounded-[var(--radius)] bg-brand px-5 py-2.5 text-sm font-semibold text-text-inverse transition-colors hover:bg-brand-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                Guardar datos de la empresa
              </button>
            </form>
          ) : (
            <p className="text-sm text-text-muted">
              Solo el propietario o el perfil de contabilidad de la empresa pueden editar estos datos.
            </p>
          )}
        </section>
      ) : null}

      <section className="rounded-xl border border-border bg-surface p-5">
        <h2 className="mb-4 flex items-center gap-2 font-bold text-text">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-subtle text-brand">
            <Icon name="shield" size={16} />
          </span>
          Cambiar contraseña
        </h2>
        <form action={updatePasswordAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="currentPassword" className="text-sm font-medium text-text-muted">
              Contraseña actual
            </label>
            <input
              id="currentPassword"
              name="currentPassword"
              type="password"
              required
              autoComplete="current-password"
              className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label htmlFor="newPassword" className="text-sm font-medium text-text-muted">
                Contraseña nueva
              </label>
              <input
                id="newPassword"
                name="newPassword"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="confirmPassword" className="text-sm font-medium text-text-muted">
                Confirmar contraseña nueva
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
              />
            </div>
          </div>
          <p className="text-xs text-text-muted">Mínimo 8 caracteres.</p>
          <button
            type="submit"
            className="flex w-fit items-center gap-2 rounded-[var(--radius)] bg-brand px-5 py-2.5 text-sm font-semibold text-text-inverse transition-colors hover:bg-brand-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            Actualizar contraseña
          </button>
        </form>
      </section>

      <section className="flex flex-col gap-3 rounded-xl border border-danger/40 bg-surface p-5">
        <h2 className="flex items-center gap-2 font-bold text-danger">
          <Icon name="close" size={16} />
          Eliminar cuenta
        </h2>
        <p className="text-sm text-text-muted">
          Anonimizamos tu perfil (nombre, teléfono) y lo desactivamos. Los pedidos, cotizaciones y pagos con historial de
          facturación se conservan sin dato personal legible — obligación de conservación fiscal ante la DIAN, no se pueden
          eliminar. Un miembro de nuestro equipo procesa la solicitud manualmente.
        </p>

        <form action={deleteAccountAction} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor="detail" className="text-sm font-medium text-text-muted">
              Motivo (opcional)
            </label>
            <textarea
              id="detail"
              name="detail"
              rows={3}
              className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="self-start rounded-[var(--radius)] border-2 border-danger px-5 py-2.5 text-sm font-semibold text-danger transition-colors hover:bg-danger/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-danger"
          >
            Solicitar eliminación de mi cuenta
          </button>
        </form>
      </section>
    </div>
  );
}
