import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { createServerClient } from "@tecni/db";
import { formatCop, serverEnv } from "@tecni/shared";

import { ORDER_STATUS_LABEL } from "@/lib/order-status";
import { uploadShipmentAction, markOrderDeliveredAction } from "../actions";

const DELIVERABLE_STATUSES = new Set(["paid", "preparing", "shipped"]);

export const metadata: Metadata = {
  title: "Detalle de pedido — Panel de ventas",
};

interface OrderRow {
  id: string;
  order_number: string;
  status: string;
  total_cop: number;
  created_at: string;
  companies: { legal_name: string } | null;
}

interface ShipmentRow {
  carrier: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  notes: string | null;
  shipped_at: string | null;
}

async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(serverEnv.NEXT_PUBLIC_SUPABASE_URL, serverEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    getAll: () => cookieStore.getAll(),
    setAll: () => {},
  });
}

export default async function VentasDetallePedidoPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderNumber: string }>;
  searchParams: Promise<{ error?: string; shipped?: string; delivered?: string }>;
}) {
  const { orderNumber } = await params;
  const { error, shipped, delivered } = await searchParams;
  const supabase = await getSupabase();

  const { data: orderData } = await supabase
    .from("orders")
    .select("id,order_number,status,total_cop,created_at,companies(legal_name)")
    .eq("order_number", orderNumber)
    .maybeSingle();
  const order = orderData as unknown as OrderRow | null;

  if (!order) {
    return (
      <div className="mx-auto max-w-[700px] px-4 py-16">
        <h1 className="mb-4 text-2xl font-bold text-text">Pedido no encontrado</h1>
        <p className="text-text-muted">
          No encontramos el pedido {orderNumber} o no tienes acceso.{" "}
          <Link href="/ventas/pedidos" className="text-brand hover:underline">
            Ver pedidos
          </Link>
        </p>
      </div>
    );
  }

  const { data: shipmentsData } = await supabase
    .from("shipments")
    .select("carrier,tracking_number,tracking_url,notes,shipped_at")
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
      <p className="text-sm text-text-muted">
        {order.companies?.legal_name ?? "Empresa"} · {formatCop(order.total_cop)} · {new Date(order.created_at).toLocaleDateString("es-CO")}
      </p>

      {DELIVERABLE_STATUSES.has(order.status) ? (
        <form action={markOrderDeliveredAction}>
          <input type="hidden" name="orderId" value={order.id} />
          <input type="hidden" name="orderNumber" value={order.order_number} />
          <button
            type="submit"
            className="self-start rounded-[var(--radius)] bg-brand px-4 py-2 text-sm font-semibold text-text-inverse transition-colors hover:bg-brand-hover"
          >
            Marcar como entregado
          </button>
        </form>
      ) : null}

      {shipped ? (
        <p className="rounded-[var(--radius)] border border-success bg-success/10 px-3 py-2 text-sm text-success">
          Guía de envío registrada.
        </p>
      ) : null}
      {delivered ? (
        <p className="rounded-[var(--radius)] border border-success bg-success/10 px-3 py-2 text-sm text-success">
          Pedido marcado como entregado.
        </p>
      ) : null}
      {error ? (
        <p className="rounded-[var(--radius)] border border-danger bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>
      ) : null}

      {shipments.length > 0 ? (
        <section className="rounded-lg border border-border">
          <h2 className="border-b border-border bg-bg-alt px-4 py-3 font-semibold text-text">Guías cargadas</h2>
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
                {shipment.notes ? <p className="text-text-muted">{shipment.notes}</p> : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="rounded-lg border border-border p-4">
        <h2 className="mb-3 font-semibold text-text">Cargar guía de envío</h2>
        <form action={uploadShipmentAction} className="flex flex-col gap-3">
          <input type="hidden" name="orderId" value={order.id} />
          <input type="hidden" name="orderNumber" value={order.order_number} />
          <div className="flex flex-col gap-1">
            <label htmlFor="carrier" className="text-sm text-text-muted">
              Transportadora
            </label>
            <input
              id="carrier"
              name="carrier"
              required
              className="rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="trackingNumber" className="text-sm text-text-muted">
              Número de guía
            </label>
            <input
              id="trackingNumber"
              name="trackingNumber"
              className="rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="trackingUrl" className="text-sm text-text-muted">
              Enlace de rastreo
            </label>
            <input
              id="trackingUrl"
              name="trackingUrl"
              type="url"
              className="rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="notes" className="text-sm text-text-muted">
              Notas
            </label>
            <textarea id="notes" name="notes" rows={2} className="rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm" />
          </div>
          <button
            type="submit"
            className="self-start rounded-[var(--radius)] bg-brand px-4 py-2 text-sm font-semibold text-text-inverse transition-colors hover:bg-brand-hover"
          >
            Registrar guía
          </button>
        </form>
      </section>

      <Link href="/ventas/pedidos" className="text-sm text-brand hover:underline">
        Ver pedidos
      </Link>
    </div>
  );
}
