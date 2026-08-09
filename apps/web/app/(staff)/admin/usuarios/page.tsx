import type { Metadata } from "next";
import { cookies } from "next/headers";
import { createServerClient } from "@tecni/db";
import { serverEnv } from "@tecni/shared";

import { changeCompanyMemberRoleAction, changeUserRoleAction } from "./actions";

export const metadata: Metadata = {
  title: "Usuarios — Panel maestro",
};

const PLATFORM_ROLES = ["customer", "seller", "technician", "master"] as const;
const MEMBER_ROLES = ["owner", "buyer", "accounting", "workshop"] as const;

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

export default async function AdminUsuariosPage({ searchParams }: { searchParams: Promise<{ error?: string; updated?: string }> }) {
  const { error, updated } = await searchParams;
  const supabase = await getSupabase();

  const { data: companiesData } = await supabase
    .from("companies")
    .select("id,legal_name,company_members(id,member_role,profiles(id,full_name,role))")
    .order("legal_name");
  const companies = (companiesData as unknown as CompanyRow[] | null) ?? [];

  return (
    <div className="mx-auto flex max-w-[900px] flex-col gap-6 px-4 py-16">
      <h1 className="text-2xl font-bold text-text">Usuarios</h1>
      <p className="text-sm text-text-muted">
        Cambio de rol de plataforma y de rol interno por empresa. Todo cambio queda en `audit_log` (regla de oro 8 de `CLAUDE.md`).
      </p>

      {updated ? (
        <p className="rounded-[var(--radius)] border border-success bg-success/10 px-3 py-2 text-sm text-success">Rol actualizado.</p>
      ) : null}
      {error ? (
        <p className="rounded-[var(--radius)] border border-danger bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>
      ) : null}

      {companies.length === 0 ? (
        <p className="text-text-muted">Sin empresas.</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {companies.map((company) => (
            <li key={company.id} className="flex flex-col gap-3 rounded-[var(--radius)] border border-border p-4">
              <p className="font-medium text-text">{company.legal_name}</p>

              {company.company_members.length === 0 ? (
                <p className="text-sm text-text-muted">Sin usuarios.</p>
              ) : (
                <ul className="flex flex-col divide-y divide-border">
                  {company.company_members.map((member) =>
                    member.profiles ? (
                      <li key={member.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                        <div>
                          <p className="text-sm font-medium text-text">{member.profiles.full_name}</p>
                          <p className="text-xs text-text-muted">rol de plataforma: {member.profiles.role}</p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                          <form action={changeUserRoleAction} className="flex items-center gap-2">
                            <input type="hidden" name="userId" value={member.profiles.id} />
                            <input type="hidden" name="previousRole" value={member.profiles.role} />
                            <select name="newRole" defaultValue={member.profiles.role} className="rounded-[var(--radius)] border border-border bg-surface px-2 py-1 text-xs">
                              {PLATFORM_ROLES.map((role) => (
                                <option key={role} value={role}>
                                  {role}
                                </option>
                              ))}
                            </select>
                            <button type="submit" className="rounded-[var(--radius)] border border-border px-3 py-1 text-xs font-medium text-text hover:border-brand">
                              Cambiar rol
                            </button>
                          </form>

                          <form action={changeCompanyMemberRoleAction} className="flex items-center gap-2">
                            <input type="hidden" name="companyMemberId" value={member.id} />
                            <select name="memberRole" defaultValue={member.member_role} className="rounded-[var(--radius)] border border-border bg-surface px-2 py-1 text-xs">
                              {MEMBER_ROLES.map((role) => (
                                <option key={role} value={role}>
                                  {role}
                                </option>
                              ))}
                            </select>
                            <button type="submit" className="rounded-[var(--radius)] border border-border px-3 py-1 text-xs font-medium text-text hover:border-brand">
                              Cambiar rol interno
                            </button>
                          </form>
                        </div>
                      </li>
                    ) : null,
                  )}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
