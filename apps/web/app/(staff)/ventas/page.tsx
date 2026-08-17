import type { Metadata } from "next";
import { cookies } from "next/headers";
import { createServerClient } from "@tecni/db";
import { serverEnv } from "@tecni/shared";

import { greeting } from "@/lib/greeting";
import { StatCard } from "@/components/stat-card";

export const metadata: Metadata = {
  title: "Panel de ventas",
};

async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(serverEnv.NEXT_PUBLIC_SUPABASE_URL, serverEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    getAll: () => cookieStore.getAll(),
    setAll: () => {},
  });
}

export default async function VentasDashboardPage() {
  const supabase = await getSupabase();
  const { data: userData } = await supabase.auth.getUser();
  const { data: profileData } = userData.user
    ? await supabase.from("profiles").select("full_name").eq("id", userData.user.id).maybeSingle()
    : { data: null };
  const firstName = ((profileData?.full_name as string | undefined) ?? "").trim().split(" ")[0] || null;

  // El middleware ya exige seller/master para llegar a /ventas. Las cuentas
  // que se ven acá las decide RLS (`quotes_read`/`orders_read`, docs/05):
  // seller ve solo lo suyo por `seller_id`, master lo ve todo — nunca se
  // decide el alcance en el componente.
  const { count: pendingQuotesCount } = await supabase
    .from("quotes")
    .select("id", { count: "exact", head: true })
    .in("status", ["requested", "in_progress"]);
  const { count: sentQuotesCount } = await supabase
    .from("quotes")
    .select("id", { count: "exact", head: true })
    .eq("status", "sent");
  const { count: pendingPaymentOrdersCount } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending_payment");
  const { count: preparingOrdersCount } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .in("status", ["paid", "preparing"]);
  const { count: myCompaniesCount } = await supabase
    .from("companies")
    .select("id", { count: "exact", head: true })
    .eq("assigned_seller_id", userData.user?.id ?? "");

  return (
    <div className="mx-auto flex max-w-[1000px] flex-col gap-8 px-4 py-12 sm:py-16">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-extrabold text-text">
          {greeting()}
          {firstName ? `, ${firstName}` : ""}
        </h1>
        <p className="text-sm text-text-muted">Cotizaciones y pedidos de tus clientes asignados.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard href="/ventas/pedidos" label="Cotizaciones por atender" value={pendingQuotesCount ?? 0} icon="handshake" tone="warning" />
        <StatCard href="/ventas/pedidos" label="Cotizaciones enviadas, esperando cliente" value={sentQuotesCount ?? 0} icon="handshake" />
        <StatCard href="/ventas/pedidos" label="Pedidos con pago pendiente" value={pendingPaymentOrdersCount ?? 0} icon="truck" tone="warning" />
        <StatCard href="/ventas/pedidos" label="Pedidos en preparación" value={preparingOrdersCount ?? 0} icon="box" />
        <StatCard href="/ventas/pedidos" label="Clientes a tu cargo" value={myCompaniesCount ?? 0} icon="building" />
      </div>
    </div>
  );
}
