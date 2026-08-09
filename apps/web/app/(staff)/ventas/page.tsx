import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { createServerClient } from "@tecni/db";
import { serverEnv } from "@tecni/shared";

export const metadata: Metadata = {
  title: "Panel de ventas — Tecni Equipos y Servicios SAS",
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
    <div className="mx-auto flex max-w-[900px] flex-col gap-6 px-4 py-16">
      <div>
        <h1 className="text-2xl font-bold text-text">Panel de ventas</h1>
        <p className="text-sm text-text-muted">Cotizaciones y pedidos de tus clientes asignados.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link href="/ventas/pedidos" className="flex flex-col gap-1 rounded-lg border border-border p-4 hover:border-brand">
          <span className="text-sm text-text-muted">Cotizaciones por atender</span>
          <span className="text-2xl font-bold text-text">{pendingQuotesCount ?? 0}</span>
        </Link>
        <Link href="/ventas/pedidos" className="flex flex-col gap-1 rounded-lg border border-border p-4 hover:border-brand">
          <span className="text-sm text-text-muted">Cotizaciones enviadas, esperando cliente</span>
          <span className="text-2xl font-bold text-text">{sentQuotesCount ?? 0}</span>
        </Link>
        <Link href="/ventas/pedidos" className="flex flex-col gap-1 rounded-lg border border-border p-4 hover:border-brand">
          <span className="text-sm text-text-muted">Pedidos con pago pendiente</span>
          <span className="text-2xl font-bold text-text">{pendingPaymentOrdersCount ?? 0}</span>
        </Link>
        <Link href="/ventas/pedidos" className="flex flex-col gap-1 rounded-lg border border-border p-4 hover:border-brand">
          <span className="text-sm text-text-muted">Pedidos en preparación</span>
          <span className="text-2xl font-bold text-text">{preparingOrdersCount ?? 0}</span>
        </Link>
        <div className="flex flex-col gap-1 rounded-lg border border-border p-4 sm:col-span-2">
          <span className="text-sm text-text-muted">Clientes a tu cargo</span>
          <span className="text-2xl font-bold text-text">{myCompaniesCount ?? 0}</span>
        </div>
      </div>

      <Link href="/ventas/pedidos" className="text-sm text-brand hover:underline">
        Ver todos los pedidos
      </Link>
    </div>
  );
}
