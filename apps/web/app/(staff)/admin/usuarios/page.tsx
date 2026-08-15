import type { Metadata } from "next";
import { cookies } from "next/headers";
import { createServerClient } from "@tecni/db";
import { serverEnv } from "@tecni/shared";
import { Icon } from "@tecni/ui";

import { AdminUsuariosTabs } from "@/components/admin-usuarios-tabs";
import { StatusBadge } from "@/components/status-badge";
import { ROLE_LABEL, type DashboardRole } from "@/lib/dashboard-nav";
import { anonymizeProfileAction, changeUserRoleAction } from "./actions";

export const metadata: Metadata = {
  title: "Usuarios · Equipo — Panel maestro",
};

const PLATFORM_ROLES = ["customer", "seller", "technician", "master"] as const;
const STAFF_ROLES = ["seller", "technician", "master"] as const;

interface StaffProfileRow {
  id: string;
  full_name: string;
  phone: string | null;
  role: string;
  is_active: boolean;
}

async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(serverEnv.NEXT_PUBLIC_SUPABASE_URL, serverEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    getAll: () => cookieStore.getAll(),
    setAll: () => {},
  });
}

export default async function AdminUsuariosEquipoPage({ searchParams }: { searchParams: Promise<{ error?: string; updated?: string }> }) {
  const { error, updated } = await searchParams;
  const supabase = await getSupabase();

  // Equipo = vendedor/técnico/master, sin importar si pertenecen a una
  // empresa (a diferencia de clientes) — se lee directo de `profiles`,
  // no a través de `company_members` (los clientes usan esa vía en
  // /admin/usuarios/clientes).
  const { data: profilesData } = await supabase
    .from("profiles")
    .select("id,full_name,phone,role,is_active")
    .in("role", STAFF_ROLES)
    .order("full_name");
  const staff = (profilesData as StaffProfileRow[] | null) ?? [];

  return (
    <div className="mx-auto flex max-w-[900px] flex-col gap-6 px-4 py-16">
      <div>
        <h1 className="text-2xl font-bold text-text">Usuarios</h1>
        <p className="text-sm text-text-muted">
          Vendedores, técnicos y masters. Todo cambio de rol queda en `audit_log` (regla de oro 8 de `CLAUDE.md`).
        </p>
      </div>

      <AdminUsuariosTabs active="equipo" />

      {updated ? (
        <p className="flex items-center gap-2 rounded-[var(--radius)] border border-success bg-success/10 px-3 py-2 text-sm text-success">
          <Icon name="checkCircle" size={16} />
          Rol actualizado.
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="flex items-center gap-2 rounded-[var(--radius)] border border-danger bg-danger/10 px-3 py-2 text-sm text-danger">
          <Icon name="close" size={16} />
          {error}
        </p>
      ) : null}

      {staff.length === 0 ? (
        <p className="rounded-[var(--radius)] border border-dashed border-border bg-bg-alt px-4 py-6 text-center text-sm text-text-muted">
          No hay vendedores, técnicos ni masters registrados todavía.
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-border rounded-xl border border-border bg-surface">
          {staff.map((profile) => (
            <li key={profile.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className="flex items-center gap-2 text-sm font-medium text-text">
                  {profile.full_name}
                  {profile.is_active ? null : <StatusBadge label="Inactivo" tone="muted" icon="close" />}
                </p>
                <p className="text-xs text-text-muted">
                  {ROLE_LABEL[profile.role as DashboardRole] ?? profile.role}
                  {profile.phone ? ` · ${profile.phone}` : ""}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <form action={changeUserRoleAction} className="flex items-center gap-2">
                  <input type="hidden" name="returnTo" value="/admin/usuarios" />
                  <input type="hidden" name="userId" value={profile.id} />
                  <input type="hidden" name="previousRole" value={profile.role} />
                  <select name="newRole" defaultValue={profile.role} className="rounded-[var(--radius)] border border-border bg-bg px-2 py-1 text-xs">
                    {PLATFORM_ROLES.map((role) => (
                      <option key={role} value={role}>
                        {ROLE_LABEL[role]}
                      </option>
                    ))}
                  </select>
                  <button type="submit" className="rounded-[var(--radius)] border border-border px-3 py-1 text-xs font-medium text-text hover:border-brand">
                    Cambiar rol
                  </button>
                </form>

                <form action={anonymizeProfileAction}>
                  <input type="hidden" name="returnTo" value="/admin/usuarios" />
                  <input type="hidden" name="profileId" value={profile.id} />
                  <button
                    type="submit"
                    className="rounded-[var(--radius)] border border-danger px-3 py-1 text-xs font-medium text-danger hover:bg-danger/10"
                  >
                    Anonimizar (Ley 1581)
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
