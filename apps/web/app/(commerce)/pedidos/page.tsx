import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@tecni/db";
import { formatCop, serverEnv } from "@tecni/shared";
import { Icon } from "@tecni/ui";

import { StatusBadge } from "@/components/status-badge";
import { ORDER_STATUS_LABEL, ORDER_STATUS_ORDER, ORDER_STATUS_TONE } from "@/lib/order-status";

export const metadata: Metadata = {
  title: "Mis pedidos — Tecni Equipos y Servicios SAS",
};

interface OrderRow {
  order_number: string;
  status: string;
  total_cop: number;
  created_at: string;
}

async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(serverEnv.NEXT_PUBLIC_SUPABASE_URL, serverEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    getAll: () => cookieStore.getAll(),
    setAll: () => {},
  });
}

export default async function PedidosPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status: statusFilter } = await searchParams;
  const supabase = await getSupabase();

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    redirect("/login?next=/pedidos");
  }

  const { data: ordersData } = await supabase
    .from("orders")
    .select("order_number,status,total_cop,created_at")
    .order("created_at", { ascending: false });
  const orders = (ordersData as OrderRow[] | null) ?? [];

  const countByStatus = new Map<string, number>();
  for (const order of orders) {
    countByStatus.set(order.status, (countByStatus.get(order.status) ?? 0) + 1);
  }
  const presentStatuses = ORDER_STATUS_ORDER.filter((status) => countByStatus.has(status));
  const filteredOrders = statusFilter ? orders.filter((order) => order.status === statusFilter) : orders;

  return (
    <div className="mx-auto flex max-w-[900px] flex-col gap-6 px-4 py-12 sm:py-16">
      <div>
        <h1 className="text-2xl font-bold text-text">Mis pedidos</h1>
        <p className="text-sm text-text-muted">{orders.length} en total.</p>
      </div>

      {presentStatuses.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          <Link
            href="/pedidos"
            aria-current={!statusFilter ? "page" : undefined}
            className={`rounded-full border px-4 py-2 text-xs font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
              !statusFilter ? "border-text bg-text text-text-inverse" : "border-border text-text-muted hover:border-text hover:text-text"
            }`}
          >
            Todos ({orders.length})
          </Link>
          {presentStatuses.map((status) => (
            <Link
              key={status}
              href={`/pedidos?status=${status}`}
              aria-current={statusFilter === status ? "page" : undefined}
              className={`rounded-full border px-4 py-2 text-xs font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
                statusFilter === status ? "border-text bg-text text-text-inverse" : "border-border text-text-muted hover:border-text hover:text-text"
              }`}
            >
              {ORDER_STATUS_LABEL[status] ?? status} ({countByStatus.get(status)})
            </Link>
          ))}
        </div>
      ) : null}

      {orders.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-bg-alt px-6 py-16 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-subtle text-brand">
            <Icon name="truck" size={26} />
          </span>
          <p className="font-semibold text-text">Todavía no tienes pedidos</p>
          <p className="text-sm text-text-muted">Cuando compres un equipo directamente, aparecerá acá.</p>
          <Link
            href="/catalogo"
            className="mt-2 rounded-[var(--radius)] bg-brand px-5 py-2.5 text-sm font-semibold text-text-inverse transition-colors hover:bg-brand-hover"
          >
            Ver catálogo
          </Link>
        </div>
      ) : filteredOrders.length === 0 ? (
        <p className="text-text-muted">No hay pedidos con este estado.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {filteredOrders.map((order) => {
            const tone = ORDER_STATUS_TONE[order.status] ?? { tone: "muted" as const, icon: "box" as const };
            return (
              <li key={order.order_number}>
                <Link
                  href={`/pedidos/${order.order_number}`}
                  className="group flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface p-4 transition-all duration-150 hover:-translate-y-0.5 hover:border-brand hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-subtle text-brand">
                      <Icon name="truck" size={18} />
                    </span>
                    <div>
                      <span className="font-semibold text-text group-hover:text-brand">{order.order_number}</span>
                      <p className="text-xs text-text-muted">{new Date(order.created_at).toLocaleDateString("es-CO")}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-semibold tabular-nums text-text">{formatCop(order.total_cop)}</span>
                    <StatusBadge label={ORDER_STATUS_LABEL[order.status] ?? order.status} tone={tone.tone} icon={tone.icon} />
                    <Icon name="arrowRight" size={16} className="hidden text-text-muted group-hover:text-brand sm:block" />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
