import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@tecni/db";
import { serverEnv } from "@tecni/shared";

import { DashboardShell } from "@/components/dashboard-shell";
import { ROLE_LABEL, getDashboardNav } from "@/lib/dashboard-nav";
import { signOutAction } from "@/app/actions/auth";

async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(serverEnv.NEXT_PUBLIC_SUPABASE_URL, serverEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    getAll: () => cookieStore.getAll(),
    setAll: () => {},
  });
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await getSupabase();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect("/login?next=/admin");
  }

  const { data: profileData } = await supabase.from("profiles").select("full_name").eq("id", userData.user.id).maybeSingle();
  const accountLabel = (profileData?.full_name as string | undefined) ?? "Administrador";

  return (
    <DashboardShell sections={getDashboardNav("master")} accountLabel={accountLabel} roleLabel={ROLE_LABEL.master} logoutAction={signOutAction}>
      {children}
    </DashboardShell>
  );
}
