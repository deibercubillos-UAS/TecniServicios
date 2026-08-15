import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { createServerClient } from "@tecni/db";
import { serverEnv } from "@tecni/shared";
import { Icon } from "@tecni/ui";

import { AdminUsuariosTabs } from "@/components/admin-usuarios-tabs";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { COMPANY_MEMBER_ROLE_LABEL, ROLE_LABEL, type DashboardRole } from "@/lib/dashboard-nav";
import { anonymizeProfileAction } from "../actions";

export const metadata: Metadata = {
  title: "Usuarios · Clientes — Panel maestro",
};

interface MemberRow {
  id: string;
  member_role: string;
  profiles: { id: string; full_name: string; role: string } | null;
}

interface CompanyRow {
  id: string;
  legal_name: string;
  company_members: MemberRow[];
}

async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(serverEnv.NEXT_PUBLIC_SUPABASE_URL, serverEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    getAll: () => cookieStore.getAll(),
    setAll: () => {},
  });
}

export default async function AdminUsuariosClientesPage({ searchParams }: { searchParams: Promise<{ error?: string; updated?: string }> }) {
  const { error, updated } = await searchParams;
  const supabase = await getSupabase();

  const { data: companiesData } = await supabase
    .from("companies")
    .select("id,legal_name,company_members(id,member_role,profiles(id,full_name,role))")
    .order("legal_name");
  const companies = (companiesData as unknown as CompanyRow[] | null) ?? [];

  return (
    <div className="mx-auto flex max-w-[900px] flex-col gap-6 px-4 py-16">
      <div>
        <h1 className="text-2xl font-bold text-text">Usuarios</h1>
      </div>

      <AdminUsuariosTabs active="clientes" />

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

      {companies.length === 0 ? (
        <p className="rounded-[var(--radius)] border border-dashed border-border bg-bg-alt px-4 py-6 text-center text-sm text-text-muted">
          Sin empresas.
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {companies.map((company) => (
            <li key={company.id} className="overflow-hidden rounded-xl border border-border bg-surface">
              <p className="border-b border-border bg-bg-alt px-4 py-2.5 font-medium text-text">{company.legal_name}</p>

              {company.company_members.length === 0 ? (
                <p className="px-4 py-4 text-sm text-text-muted">Sin usuarios.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-border text-xs font-medium text-text-muted">
                        <th className="px-4 py-2.5 font-medium">Nombre</th>
                        <th className="px-4 py-2.5 font-medium">Rol interno</th>
                        <th className="px-4 py-2.5 font-medium">Rol plataforma</th>
                        <th className="px-4 py-2.5 font-medium">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {company.company_members.map((member) =>
                        member.profiles ? (
                          <tr key={member.id}>
                            <td className="px-4 py-2.5 font-medium text-text">{member.profiles.full_name}</td>
                            <td className="px-4 py-2.5 text-text-muted">{COMPANY_MEMBER_ROLE_LABEL[member.member_role] ?? member.member_role}</td>
                            <td className="px-4 py-2.5 text-text-muted">{ROLE_LABEL[member.profiles.role as DashboardRole] ?? member.profiles.role}</td>
                            <td className="px-4 py-2.5">
                              <div className="flex items-center gap-2">
                                <Link
                                  href={`/admin/usuarios/${member.profiles.id}`}
                                  className="rounded-[var(--radius)] border border-border px-3 py-1 text-xs font-medium text-text transition-colors hover:border-brand"
                                >
                                  Editar
                                </Link>
                                <form action={anonymizeProfileAction}>
                                  <input type="hidden" name="returnTo" value="/admin/usuarios/clientes" />
                                  <input type="hidden" name="profileId" value={member.profiles.id} />
                                  <ConfirmSubmitButton
                                    confirmMessage={`¿Eliminar a "${member.profiles.full_name}"? No se puede deshacer.`}
                                    className="flex h-7 w-7 items-center justify-center rounded-[var(--radius)] text-text-muted transition-colors hover:bg-danger/10 hover:text-danger"
                                    title="Eliminar"
                                    aria-label={`Eliminar ${member.profiles.full_name}`}
                                  >
                                    <Icon name="trash" size={14} />
                                  </ConfirmSubmitButton>
                                </form>
                              </div>
                            </td>
                          </tr>
                        ) : null,
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
