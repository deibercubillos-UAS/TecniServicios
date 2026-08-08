import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@tecni/db";
import { formatCop, serverEnv } from "@tecni/shared";

import { ORDER_STATUS_LABEL } from "../page";

export const metadata: Metadata = {
  title: "Detalle de pedido — Tecni Equipos y Servicios SAS",
};

interface OrderRow {
  id: string;
  order_number: string;
  status: string;
  subtotal_cop: number;
  tax_cop: number;
  shipping_cop: number;
  total_cop: number;
  siigo_invoice_id: string | null;
  created_at: string;
}

interface OrderItemRow {
  description: string;
  quantity: number;
  unit_price_cop: number;
  total_cop: number;
}

interface ShipmentRow {
  carrier: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  shipped_at: string | null;
}

async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(serverEnv.NEXT_PUBLIC_SUPABASE_URL, serverEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    getAll: () => cookieStore.getAll(),
    setAll: () => {},
  });
}

export default async function DetallePedidoPage({ params }: { params: Promise<{ orderNumber: string }> }) {
  const { orderNumber } = await params;
  const supabase = await getSupabase();

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    redirect("/login?next=/pedidos/" + encodeURIComponent(orderNumber));
  }

  // `orders_read` (05-RLS-SECURITY-A.md) limita esto a pedidos de la propia
  // empresa — no hace falta filtrar por company_id acá, RLS lo hace.
  const { data: orderData } = await supabase
    .from("orders")
    .select("id,order_number,status,subtotal_cop,tax_cop,shipping_cop,total_cop,siigo_invoice_id,created_at")
    .eq("order_number", orderNumber)
    .maybeSingle();
  const order = orderData as OrderRow | null;

  if (!order) {
    return (
      <div className="mx-auto max-w-[700px] px-4 py-16">
        <h1 className="mb-4 text-2xl font-bold text-text">Pedido no encontrado</h1>
        <p className="text-text-muted">
          No encontramos el pedido {orderNumber} o no pertenece a tu empresa.{" "}
          <Link href="/pedidos" className="text-brand hover:underline">
            Ver mis pedidos
          </Link>
        </p>
      </div>
    );
  }

  const { data: itemsData } = await supabase
    .from("order_items")
    .select("description,quantity,unit_price_cop,total_cop")
    .eq("order_id", order.id);
  const items = (itemsData as OrderItemRow[] | null) ?? [];

  // La factura la genera Siigo, no la web (docs/13-MODULE-COMMERCE.md
  // sección 6) — antes de que exista un pago confirmado no hay nada que
  // facturar todavía.
  const showInvoice = order.status !== "pending_payment" && order.status !== "cancelled";

  // `shipments_read` (05-RLS-SECURITY-A.md) ya limita esto a los envíos de
  // pedidos de la propia empresa.
  const { data: shipmentsData } = await supabase
    .from("shipments")
    .select("carrier,tracking_number,tracking_url,shipped_at")
    .eq("order_id", order.id)
    .order("shipped_at", { ascending: false });
  const shipments = (shipmentsData as ShipmentRow[] | null) ?? [];

  return (
    <div className="mx-auto flex max-w-[700px] flex-col gap-6 px-4 py-16">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold text-text">Pedido {order.order_number}</h1>
        <span className="rounded-full border border-border px-3 py-1 text-xs font-medium text-text">
          {ORDER_STATUS_LABEL[order.status] ?? order.status}
        </span>
      </div>
      <p className="text-sm text-text-muted">Realizado el {new Date(order.created_at).toLocaleDateString("es-CO")}</p>

      <section className="rounded-lg border border-border">
        <h2 className="border-b border-border bg-bg-alt px-4 py-3 font-semibold text-text">Productos</h2>
        <ul className="divide-y divide-border">
          {items.map((item, index) => (
            <li key={index} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
              <span className="text-text">
                {item.description} × {item.quantity}
              </span>
              <span className="text-text-muted">{formatCop(item.total_cop)}</span>
            </li>
          ))}
        </ul>
      </section>

      {shipments.length > 0 ? (
        <section className="rounded-lg border border-border">
          <h2 className="border-b border-border bg-bg-alt px-4 py-3 font-semibold text-text">Envío</h2>
          <ul className="divide-y divide-border">
            {shipments.map((shipment, index) => (
              <li key={index} className="px-4 py-3 text-sm">
                <p className="text-text">
                  {shipment.carrier} {shipment.tracking_number ? `— guía ${shipment.tracking_number}` : ""}
                </p>
                {shipment.tracking_url ? (
                  <a href={shipment.tracking_url} className="text-brand hover:underline" target="_blank" rel="noreferrer">
                    Ver rastreo
                  </a>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {showInvoice ? (
        <section className="rounded-lg border border-border">
          <h2 className="border-b border-border bg-bg-alt px-4 py-3 font-semibold text-text">Factura</h2>
          <div className="flex flex-col gap-1 px-4 py-3 text-sm">
            <p className="text-text">
              Número: {order.siigo_invoice_id ?? "pendiente de sincronización con Siigo"}
            </p>
            <p className="text-text-muted">PDF: pendiente de sincronización.</p>
          </div>
        </section>
      ) : null}

      <dl className="rounded-lg border border-border p-4 text-sm">
        <div className="flex justify-between py-1">
          <dt className="text-text-muted">Subtotal</dt>
          <dd className="text-text">{formatCop(order.subtotal_cop)}</dd>
        </div>
        <div className="flex justify-between py-1">
          <dt className="text-text-muted">Impuesto</dt>
          <dd className="text-text">{formatCop(order.tax_cop)}</dd>
        </div>
        <div className="flex justify-between py-1">
          <dt className="text-text-muted">Envío</dt>
          <dd className="text-text">{formatCop(order.shipping_cop)}</dd>
        </div>
        <div className="flex justify-between border-t border-border pt-2 font-semibold">
          <dt className="text-text">Total</dt>
          <dd className="text-text">{formatCop(order.total_cop)}</dd>
        </div>
      </dl>

      <Link href="/pedidos" className="text-sm text-brand hover:underline">
        Ver mis pedidos
      </Link>
    </div>
  );
}
