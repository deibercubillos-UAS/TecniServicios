import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { createServerClient } from "@tecni/db";
import { formatCop, serverEnv } from "@tecni/shared";

import { ORDER_STATUS_LABEL } from "@/app/(commerce)/pedidos/page";

export const metadata: Metadata = {
  title: "Pedidos — Panel de ventas",
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

export default async function VentasPedidosPage() {
  const supabase = await getSupabase();

  // El middleware (docs/06-AUTH-ROLES.md sección 5) ya exige
  // seller/master para llegar a /ventas — acá solo se listan los pedidos
  // que `orders_read` deja ver con esa sesión (asignados o todos si es
  // master, docs/05-RLS-SECURITY-A.md).
  const { data: ordersData } = await supabase
    .from("orders")
    .select("order_number,status,total_cop,created_at,companies(legal_name)")
    .order("created_at", { ascending: false });
  const orders = (ordersData as unknown as OrderRow[] | null) ?? [];

  return (
    <div className="mx-auto flex max-w-[900px] flex-col gap-6 px-4 py-16">
      <h1 className="text-2xl font-bold text-text">Pedidos</h1>

      {orders.length === 0 ? (
        <p className="text-text-muted">No hay pedidos asignados todavía.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-border rounded-lg border border-border">
          {orders.map((order) => (
            <li key={order.order_number} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
              <div>
                <Link href={`/ventas/pedidos/${order.order_number}`} className="font-medium text-text hover:text-brand">
                  {order.order_number}
                </Link>
                <p className="text-xs text-text-muted">
                  {order.companies?.legal_name ?? "Empresa"} · {new Date(order.created_at).toLocaleDateString("es-CO")}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-text">{formatCop(order.total_cop)}</span>
                <span className="rounded-full border border-border px-3 py-1 text-xs font-medium text-text">
                  {ORDER_STATUS_LABEL[order.status] ?? order.status}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
