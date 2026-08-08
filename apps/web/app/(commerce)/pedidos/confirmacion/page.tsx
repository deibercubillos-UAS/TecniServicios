import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@tecni/db";
import { formatCop, serverEnv } from "@tecni/shared";

export const metadata: Metadata = {
  title: "Confirmación de pedido — Tecni Equipos y Servicios SAS",
};

const STATUS_MESSAGE: Record<string, { text: string; tone: "success" | "pending" | "danger" }> = {
  paid: { text: "Pago confirmado. Gracias por tu compra.", tone: "success" },
  pending_payment: { text: "Estamos confirmando tu pago — puede tardar unos segundos.", tone: "pending" },
  preparing: { text: "Pago confirmado, tu pedido está en preparación.", tone: "success" },
  shipped: { text: "Pago confirmado, tu pedido ya fue enviado.", tone: "success" },
  delivered: { text: "Pago confirmado, tu pedido fue entregado.", tone: "success" },
  cancelled: { text: "Este pedido fue cancelado.", tone: "danger" },
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

export default async function ConfirmacionPedidoPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const { ref } = await searchParams;
  const supabase = await getSupabase();

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    redirect("/login?next=/pedidos/confirmacion" + (ref ? `?ref=${encodeURIComponent(ref)}` : ""));
  }

  if (!ref) {
    return (
      <div className="mx-auto max-w-[600px] px-4 py-16">
        <h1 className="mb-4 text-2xl font-bold text-text">Confirmación de pedido</h1>
        <p className="text-text-muted">No se indicó qué pedido confirmar.</p>
      </div>
    );
  }

  // `orders_read` (05-RLS-SECURITY-A.md) ya limita esto a pedidos de la
  // propia empresa — no hace falta filtrar por company_id acá, RLS lo hace.
  const { data: orderData } = await supabase
    .from("orders")
    .select("order_number,status,total_cop,created_at")
    .eq("order_number", ref)
    .maybeSingle();
  const order = orderData as OrderRow | null;

  if (!order) {
    return (
      <div className="mx-auto max-w-[600px] px-4 py-16">
        <h1 className="mb-4 text-2xl font-bold text-text">Confirmación de pedido</h1>
        <p className="text-text-muted">No encontramos el pedido {ref}.</p>
      </div>
    );
  }

  const message = STATUS_MESSAGE[order.status] ?? { text: `Estado: ${order.status}`, tone: "pending" as const };
  const toneClasses =
    message.tone === "success"
      ? "border-success bg-success/10 text-success"
      : message.tone === "danger"
        ? "border-danger bg-danger/10 text-danger"
        : "border-border bg-bg-alt text-text";

  return (
    <div className="mx-auto flex max-w-[600px] flex-col gap-6 px-4 py-16">
      <h1 className="text-2xl font-bold text-text">Pedido {order.order_number}</h1>

      <p className={`rounded-[var(--radius)] border px-3 py-2 text-sm ${toneClasses}`}>{message.text}</p>

      <dl className="rounded-lg border border-border p-4 text-sm">
        <div className="flex justify-between py-1">
          <dt className="text-text-muted">Total</dt>
          <dd className="font-semibold text-text">{formatCop(order.total_cop)}</dd>
        </div>
        <div className="flex justify-between py-1">
          <dt className="text-text-muted">Fecha</dt>
          <dd className="text-text">{new Date(order.created_at).toLocaleDateString("es-CO")}</dd>
        </div>
      </dl>

      {order.status === "pending_payment" ? (
        <Link href={`/pedidos/confirmacion?ref=${encodeURIComponent(order.order_number)}`} className="text-sm text-brand hover:underline">
          Actualizar estado
        </Link>
      ) : null}

      <Link href="/catalogo" className="text-sm text-brand hover:underline">
        Seguir comprando
      </Link>
    </div>
  );
}
