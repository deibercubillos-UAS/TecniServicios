import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { createServerClient } from "@tecni/db";
import { serverEnv } from "@tecni/shared";
import { Icon } from "@tecni/ui";

import { AdminUsuariosTabs } from "@/components/admin-usuarios-tabs";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { StatusBadge } from "@/components/status-badge";
import { ROLE_LABEL, type DashboardRole } from "@/lib/dashboard-nav";
import { anonymizeProfileAction } from "./actions";

export const metadata: Metadata = {
  title: "Usuarios · Equipo — Panel maestro",
};

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
        <p className="text-sm text-text-muted">Vendedores, técnicos y masters.</p>
      </div>

      <AdminUsuariosTabs active="equipo" />

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

      {staff.length === 0 ? (
        <p className="rounded-[var(--radius)] border border-dashed border-border bg-bg-alt px-4 py-6 text-center text-sm text-text-muted">
          No hay vendedores, técnicos ni masters registrados todavía.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-surface">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs font-medium text-text-muted">
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">Rol</th>
                <th className="px-4 py-3 font-medium">Teléfono</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {staff.map((profile) => (
                <tr key={profile.id}>
                  <td className="px-4 py-3 font-medium text-text">{profile.full_name}</td>
                  <td className="px-4 py-3 text-text-muted">{ROLE_LABEL[profile.role as DashboardRole] ?? profile.role}</td>
                  <td className="px-4 py-3 text-text-muted">{profile.phone ?? "—"}</td>
                  <td className="px-4 py-3">
                    {profile.is_active ? (
                      <StatusBadge label="Activo" tone="success" icon="checkCircle" />
                    ) : (
                      <StatusBadge label="Inactivo" tone="muted" icon="close" />
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/usuarios/${profile.id}`}
                        className="rounded-[var(--radius)] border border-border px-3 py-1 text-xs font-medium text-text transition-colors hover:border-brand"
                      >
                        Editar
                      </Link>
                      <form action={anonymizeProfileAction}>
                        <input type="hidden" name="returnTo" value="/admin/usuarios" />
                        <input type="hidden" name="profileId" value={profile.id} />
                        <ConfirmSubmitButton
                          confirmMessage={`¿Eliminar a "${profile.full_name}"? No se puede deshacer.`}
                          className="flex h-7 w-7 items-center justify-center rounded-[var(--radius)] text-text-muted transition-colors hover:bg-danger/10 hover:text-danger"
                          title="Eliminar"
                          aria-label={`Eliminar ${profile.full_name}`}
                        >
                          <Icon name="trash" size={14} />
                        </ConfirmSubmitButton>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
