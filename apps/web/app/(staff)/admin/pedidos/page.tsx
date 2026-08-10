import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { createServerClient } from "@tecni/db";
import { formatCop, serverEnv } from "@tecni/shared";
import { Icon } from "@tecni/ui";

import { StatusBadge } from "@/components/status-badge";
import { ORDER_STATUS_LABEL, ORDER_STATUS_ORDER, ORDER_STATUS_TONE } from "@/lib/order-status";

export const metadata: Metadata = {
  title: "Pedidos — Panel maestro",
};

interface OrderRow {
  order_number: string;
  status: string;
  total_cop: number;
  created_at: string;
  companies: { legal_name: string } | null;
}

async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(serverEnv.NEXT_PUBLIC_SUPABASE_URL, serverEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    getAll: () => cookieStore.getAll(),
    setAll: () => {},
  });
}

export default async function AdminPedidosPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status: statusFilter } = await searchParams;
  const supabase = await getSupabase();

  // Middleware ya exige master en /admin — master ve todos los pedidos
  // por RLS (docs/05-RLS-SECURITY-A.md), sin filtro de alcance.
  const { data: ordersData } = await supabase
    .from("orders")
    .select("order_number,status,total_cop,created_at,companies(legal_name)")
    .order("created_at", { ascending: false });
  const orders = (ordersData as unknown as OrderRow[] | null) ?? [];

  const countByStatus = new Map<string, number>();
  const totalByStatus = new Map<string, number>();
  for (const order of orders) {
    countByStatus.set(order.status, (countByStatus.get(order.status) ?? 0) + 1);
    totalByStatus.set(order.status, (totalByStatus.get(order.status) ?? 0) + order.total_cop);
  }
  const totalRevenue = orders.reduce((sum, o) => (o.status === "cancelled" ? sum : sum + o.total_cop), 0);
  const filteredOrders = statusFilter ? orders.filter((o) => o.status === statusFilter) : orders;

  return (
    <div className="mx-auto flex max-w-[1000px] flex-col gap-6 px-4 py-12 sm:py-16">
      <div>
        <h1 className="text-2xl font-bold text-text">Pedidos</h1>
        <p className="text-sm text-text-muted">{orders.length} en total · {formatCop(totalRevenue)} en pedidos no cancelados.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {ORDER_STATUS_ORDER.map((status) => {
          const tone = ORDER_STATUS_TONE[status] ?? { tone: "muted" as const, icon: "box" as const };
          const count = countByStatus.get(status) ?? 0;
          return (
            <Link
              key={status}
              href={`/admin/pedidos?status=${status}`}
              aria-current={statusFilter === status ? "page" : undefined}
              className={`group flex flex-col gap-2 rounded-xl border p-4 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
                statusFilter === status ? "border-brand bg-brand-subtle" : "border-border bg-surface hover:border-brand"
              }`}
            >
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-lg transition-transform duration-150 group-hover:scale-110 ${
                  tone.tone === "warning"
                    ? "bg-warning/15 text-warning"
                    : tone.tone === "success"
                      ? "bg-success/15 text-success"
                      : tone.tone === "danger"
                        ? "bg-danger/15 text-danger"
                        : "bg-brand-subtle text-brand"
                }`}
              >
                <Icon name={tone.icon} size={16} />
              </span>
              <div>
                <span className="block text-2xl font-extrabold tabular-nums text-text">{count}</span>
                <span className="text-xs text-text-muted">{ORDER_STATUS_LABEL[status]}</span>
              </div>
            </Link>
          );
        })}
      </div>

      {statusFilter ? (
        <Link href="/admin/pedidos" className="w-fit text-sm font-medium text-brand hover:underline">
          Quitar filtro — ver todos
        </Link>
      ) : null}

      {filteredOrders.length === 0 ? (
        <p className="text-sm text-text-muted">No hay pedidos con este estado.</p>
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
                      <p className="text-xs text-text-muted">
                        {order.companies?.legal_name ?? "—"} · {new Date(order.created_at).toLocaleDateString("es-CO")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-semibold tabular-nums text-text">{formatCop(order.total_cop)}</span>
                    <StatusBadge label={ORDER_STATUS_LABEL[order.status] ?? order.status} tone={tone.tone} icon={tone.icon} />
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
