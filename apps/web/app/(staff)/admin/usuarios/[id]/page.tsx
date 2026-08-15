import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { createServerClient } from "@tecni/db";
import { serverEnv } from "@tecni/shared";
import { Icon } from "@tecni/ui";

import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { StatusBadge } from "@/components/status-badge";
import { SubmitButton } from "@/components/submit-button";
import { COMPANY_MEMBER_ROLE_LABEL, ROLE_LABEL } from "@/lib/dashboard-nav";
import { anonymizeProfileAction, changeCompanyMemberRoleAction, changeUserRoleAction } from "../actions";

export const metadata: Metadata = {
  title: "Editar usuario — Panel maestro",
};

const PLATFORM_ROLES = ["customer", "seller", "technician", "master"] as const;
const MEMBER_ROLES = ["owner", "buyer", "accounting", "workshop"] as const;

interface ProfileRow {
  id: string;
  full_name: string;
  phone: string | null;
  role: string;
  is_active: boolean;
}

interface MembershipRow {
  id: string;
  member_role: string;
  companies: { legal_name: string } | null;
}

async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(serverEnv.NEXT_PUBLIC_SUPABASE_URL, serverEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    getAll: () => cookieStore.getAll(),
    setAll: () => {},
  });
}

export default async function EditarUsuarioPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; updated?: string }>;
}) {
  const { id } = await params;
  const { error, updated } = await searchParams;
  const supabase = await getSupabase();

  const [{ data: profileData }, { data: membershipData }] = await Promise.all([
    supabase.from("profiles").select("id,full_name,phone,role,is_active").eq("id", id).maybeSingle(),
    supabase.from("company_members").select("id,member_role,companies(legal_name)").eq("profile_id", id).maybeSingle(),
  ]);
  const profile = profileData as ProfileRow | null;
  const membership = membershipData as unknown as MembershipRow | null;

  if (!profile) {
    return (
      <div className="mx-auto max-w-[700px] px-4 py-16">
        <h1 className="mb-4 text-2xl font-bold text-text">Usuario no encontrado</h1>
        <Link href="/admin/usuarios" className="text-brand hover:underline">
          Ver usuarios
        </Link>
      </div>
    );
  }

  const tabPath = profile.role === "customer" ? "/admin/usuarios/clientes" : "/admin/usuarios";
  const tabLabel = profile.role === "customer" ? "Clientes" : "Equipo";
  const editPath = `/admin/usuarios/${profile.id}`;

  return (
    <div className="mx-auto flex max-w-[700px] flex-col gap-6 px-4 py-16">
      <nav aria-label="Miga de pan" className="flex flex-wrap items-center gap-2 text-sm text-text-muted">
        <Link href={tabPath} className="hover:text-brand">
          {tabLabel}
        </Link>
        <Icon name="chevronRight" size={14} />
        <span className="truncate text-text">{profile.full_name}</span>
      </nav>

      <div className="flex flex-wrap items-start justify-between gap-2">
        <h1 className="text-2xl font-bold text-text">{profile.full_name}</h1>
        {profile.is_active ? (
          <StatusBadge label="Activo" tone="success" icon="checkCircle" />
        ) : (
          <StatusBadge label="Inactivo" tone="muted" icon="close" />
        )}
      </div>

      {updated ? (
        <p className="flex items-center gap-2 rounded-[var(--radius)] border border-success bg-success/10 px-3 py-2 text-sm text-success">
          <Icon name="checkCircle" size={16} />
          Cambios guardados.
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="flex items-center gap-2 rounded-[var(--radius)] border border-danger bg-danger/10 px-3 py-2 text-sm text-danger">
          <Icon name="close" size={16} />
          {error}
        </p>
      ) : null}

      <section className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5">
        <h2 className="flex items-center gap-2 font-bold text-text">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-subtle text-brand">
            <Icon name="user" size={16} />
          </span>
          Rol de plataforma
        </h2>
        {profile.phone ? <p className="text-sm text-text-muted">Teléfono: {profile.phone}</p> : null}
        <form action={changeUserRoleAction} className="flex flex-wrap items-center gap-2">
          <input type="hidden" name="returnTo" value={editPath} />
          <input type="hidden" name="userId" value={profile.id} />
          <input type="hidden" name="previousRole" value={profile.role} />
          <select
            name="newRole"
            defaultValue={profile.role}
            className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2 text-sm focus:border-brand focus:outline-none"
          >
            {PLATFORM_ROLES.map((role) => (
              <option key={role} value={role}>
                {ROLE_LABEL[role]}
              </option>
            ))}
          </select>
          <SubmitButton
            pendingLabel="Guardando…"
            className="rounded-[var(--radius)] bg-brand px-4 py-2 text-sm font-semibold text-text-inverse transition-colors hover:bg-brand-hover disabled:cursor-wait disabled:opacity-70"
          >
            Guardar
          </SubmitButton>
        </form>
      </section>

      {membership ? (
        <section className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5">
          <h2 className="flex items-center gap-2 font-bold text-text">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-subtle text-brand">
              <Icon name="building" size={16} />
            </span>
            Rol interno en {membership.companies?.legal_name ?? "su empresa"}
          </h2>
          <form action={changeCompanyMemberRoleAction} className="flex flex-wrap items-center gap-2">
            <input type="hidden" name="returnTo" value={editPath} />
            <input type="hidden" name="companyMemberId" value={membership.id} />
            <select
              name="memberRole"
              defaultValue={membership.member_role}
              className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2 text-sm focus:border-brand focus:outline-none"
            >
              {MEMBER_ROLES.map((role) => (
                <option key={role} value={role}>
                  {COMPANY_MEMBER_ROLE_LABEL[role]}
                </option>
              ))}
            </select>
            <SubmitButton
              pendingLabel="Guardando…"
              className="rounded-[var(--radius)] bg-brand px-4 py-2 text-sm font-semibold text-text-inverse transition-colors hover:bg-brand-hover disabled:cursor-wait disabled:opacity-70"
            >
              Guardar
            </SubmitButton>
          </form>
        </section>
      ) : null}

      <section className="flex flex-col gap-3 rounded-xl border border-danger/40 bg-danger/5 p-5">
        <h2 className="flex items-center gap-2 font-bold text-danger">
          <Icon name="trash" size={16} />
          Zona de peligro
        </h2>
        <p className="text-sm text-text-muted">
          Elimina el nombre, teléfono y foto de este usuario y lo desactiva — sus pedidos, cotizaciones y auditoría anteriores se mantienen intactos
          (Ley 1581). No se puede deshacer.
        </p>
        <form action={anonymizeProfileAction} className="w-fit">
          <input type="hidden" name="returnTo" value={tabPath} />
          <input type="hidden" name="profileId" value={profile.id} />
          <ConfirmSubmitButton
            confirmMessage={`¿Eliminar a "${profile.full_name}"? No se puede deshacer.`}
            className="rounded-[var(--radius)] border border-danger px-4 py-2 text-sm font-semibold text-danger transition-colors hover:bg-danger/10"
          >
            Eliminar usuario
          </ConfirmSubmitButton>
        </form>
      </section>

      <Link href={tabPath} className="text-sm text-brand hover:underline">
        Ver {tabLabel.toLowerCase()}
      </Link>
    </div>
  );
}
