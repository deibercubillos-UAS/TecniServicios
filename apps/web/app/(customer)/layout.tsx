import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@tecni/db";
import { serverEnv } from "@tecni/shared";
import { Icon } from "@tecni/ui";

import { CustomerNav, type CustomerNavItem } from "@/components/customer-nav";
import { signOutAction } from "@/app/actions/auth";

const NAV_ITEMS: CustomerNavItem[] = [
  { href: "/mi-cuenta", label: "Panel", icon: "home" },
  { href: "/pedidos", label: "Pedidos", icon: "truck" },
  { href: "/cotizaciones", label: "Cotizaciones", icon: "handshake" },
  { href: "/mi-cuenta/equipos", label: "Mis equipos", icon: "box" },
  { href: "/mi-cuenta/mantenimientos", label: "Mantenimientos", icon: "wrench" },
  { href: "/mi-cuenta/manuales", label: "Manuales", icon: "document" },
  { href: "/mi-cuenta/tickets", label: "Soporte", icon: "chat" },
  { href: "/contacto", label: "Contáctanos", icon: "headset" },
  { href: "/mi-cuenta/privacidad", label: "Mis datos", icon: "shield" },
];

async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(serverEnv.NEXT_PUBLIC_SUPABASE_URL, serverEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    getAll: () => cookieStore.getAll(),
    setAll: () => {},
  });
}

export default async function CustomerLayout({ children }: { children: React.ReactNode }) {
  const supabase = await getSupabase();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect("/login?next=/mi-cuenta");
  }

  const { data: profileData } = await supabase.from("profiles").select("full_name").eq("id", userData.user.id).maybeSingle();
  const { data: membership } = await supabase
    .from("company_members")
    .select("companies(trade_name,legal_name)")
    .eq("profile_id", userData.user.id)
    .order("is_primary", { ascending: false })
    .limit(1)
    .maybeSingle();

  const company = membership?.companies as unknown as { trade_name: string | null; legal_name: string } | null;
  const accountLabel = company ? (company.trade_name ?? company.legal_name) : ((profileData?.full_name as string | undefined) ?? "Mi cuenta");

  const logoutButton = (
    <form action={signOutAction}>
      <button
        type="submit"
        className="flex w-full items-center gap-3 rounded-[var(--radius)] px-3 py-2.5 text-sm font-medium text-text-muted transition-colors hover:bg-bg-alt hover:text-danger focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        <Icon name="logOut" size={18} />
        Cerrar sesión
      </button>
    </form>
  );

  return (
    <div className="mx-auto flex max-w-[1200px] flex-col lg:flex-row">
      <CustomerNav items={NAV_ITEMS} accountLabel={accountLabel} onLogout={logoutButton} />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
