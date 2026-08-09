import type { Metadata } from "next";
import { cookies } from "next/headers";
import { createServerClient } from "@tecni/db";
import { serverEnv } from "@tecni/shared";

export const metadata: Metadata = {
  title: "Métricas — Panel maestro",
};

const ORDER_STATUSES = ["pending_payment", "paid", "preparing", "shipped", "delivered", "cancelled"] as const;
const OPEN_QUOTE_STATUSES = ["requested", "in_progress", "sent"] as const;
const OPEN_TICKET_STATUSES = ["open", "assigned", "waiting_customer"] as const;
const PENDING_MAINTENANCE_STATUSES = ["requested", "confirmed", "rescheduled"] as const;

async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(serverEnv.NEXT_PUBLIC_SUPABASE_URL, serverEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    getAll: () => cookieStore.getAll(),
    setAll: () => {},
  });
}

export default async function AdminMetricasPage() {
  const supabase = await getSupabase();

  const orderCounts = await Promise.all(
    ORDER_STATUSES.map(async (status) => {
      const { count } = await supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", status);
      return { status, count: count ?? 0 };
    }),
  );

  const { count: openQuotesCount } = await supabase.from("quotes").select("id", { count: "exact", head: true }).in("status", OPEN_QUOTE_STATUSES);
  const { count: openTicketsCount } = await supabase.from("support_tickets").select("id", { count: "exact", head: true }).in("status", OPEN_TICKET_STATUSES);
  const { count: pendingMaintenanceCount } = await supabase
    .from("maintenance_requests")
    .select("id", { count: "exact", head: true })
    .in("status", PENDING_MAINTENANCE_STATUSES);

  return (
    <div className="mx-auto flex max-w-[700px] flex-col gap-8 px-4 py-16">
      <div>
        <h1 className="text-2xl font-bold text-text">Métricas</h1>
        <p className="text-sm text-text-muted">Conteos reales sobre la base — sin gráficas fabricadas (fuera de alcance de esta fase).</p>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-text">Pedidos por estado</h2>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {orderCounts.map(({ status, count }) => (
            <li key={status} className="rounded-[var(--radius)] border border-border p-4">
              <p className="text-2xl font-bold text-text">{count}</p>
              <p className="text-xs text-text-muted">{status}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-text">Estado general</h2>
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <li className="rounded-[var(--radius)] border border-border p-4">
            <p className="text-2xl font-bold text-text">{openQuotesCount ?? 0}</p>
            <p className="text-xs text-text-muted">cotizaciones abiertas (requested, in_progress, sent)</p>
          </li>
          <li className="rounded-[var(--radius)] border border-border p-4">
            <p className="text-2xl font-bold text-text">{openTicketsCount ?? 0}</p>
            <p className="text-xs text-text-muted">tickets abiertos (open, assigned, waiting_customer)</p>
          </li>
          <li className="rounded-[var(--radius)] border border-border p-4">
            <p className="text-2xl font-bold text-text">{pendingMaintenanceCount ?? 0}</p>
            <p className="text-xs text-text-muted">mantenimientos pendientes (requested, confirmed, rescheduled)</p>
          </li>
        </ul>
      </section>
    </div>
  );
}
