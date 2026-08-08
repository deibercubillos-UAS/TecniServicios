import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@tecni/db";
import { formatCop, serverEnv } from "@tecni/shared";

export const metadata: Metadata = {
  title: "Mis pedidos — Tecni Equipos y Servicios SAS",
};

export const ORDER_STATUS_LABEL: Record<string, string> = {
  pending_payment: "Pago pendiente",
  paid: "Pagado",
  preparing: "En preparación",
  shipped: "Enviado",
  delivered: "Entregado",
  cancelled: "Cancelado",
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

export default async function PedidosPage() {
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

  return (
    <div className="mx-auto flex max-w-[900px] flex-col gap-6 px-4 py-16">
      <h1 className="text-2xl font-bold text-text">Mis pedidos</h1>

      {orders.length === 0 ? (
        <p className="text-text-muted">
          Todavía no tienes pedidos.{" "}
          <Link href="/catalogo" className="text-brand hover:underline">
            Ver catálogo
          </Link>
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-border rounded-lg border border-border">
          {orders.map((order) => (
            <li key={order.order_number} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
              <div>
                <Link href={`/pedidos/${order.order_number}`} className="font-medium text-text hover:text-brand">
                  {order.order_number}
                </Link>
                <p className="text-xs text-text-muted">{new Date(order.created_at).toLocaleDateString("es-CO")}</p>
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
