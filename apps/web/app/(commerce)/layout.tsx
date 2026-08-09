import { cookies } from "next/headers";
import { createServerClient } from "@tecni/db";
import { serverEnv } from "@tecni/shared";

import { DashboardShell } from "@/components/dashboard-shell";
import { ROLE_LABEL, getDashboardNav, type DashboardRole } from "@/lib/dashboard-nav";
import { signOutAction } from "@/app/actions/auth";

async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(serverEnv.NEXT_PUBLIC_SUPABASE_URL, serverEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    getAll: () => cookieStore.getAll(),
    setAll: () => {},
  });
}

/**
 * Pedidos, cotizaciones y carrito los usa cualquier rol autenticado (RLS
 * decide qué filas ve cada uno) — por eso este layout no exige un rol
 * fijo. Si no hay sesión, deja pasar sin el shell: cada página ya
 * redirige a /login con su propio `next`, y duplicar esa redirección acá
 * perdería el destino exacto.
 */
export default async function CommerceLayout({ children }: { children: React.ReactNode }) {
  const supabase = await getSupabase();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    return <>{children}</>;
  }

  const { data: profileData } = await supabase.from("profiles").select("full_name,role").eq("id", userData.user.id).maybeSingle();
  const role = (profileData?.role as DashboardRole | undefined) ?? "customer";

  let accountLabel = (profileData?.full_name as string | undefined) ?? "Mi cuenta";
  if (role === "customer") {
    const { data: membership } = await supabase
      .from("company_members")
      .select("companies(trade_name,legal_name)")
      .eq("profile_id", userData.user.id)
      .order("is_primary", { ascending: false })
      .limit(1)
      .maybeSingle();
    const company = membership?.companies as unknown as { trade_name: string | null; legal_name: string } | null;
    if (company) accountLabel = company.trade_name ?? company.legal_name;
  }

  return (
    <DashboardShell sections={getDashboardNav(role)} accountLabel={accountLabel} roleLabel={ROLE_LABEL[role]} logoutAction={signOutAction}>
      {children}
    </DashboardShell>
  );
}
