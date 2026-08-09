import type { SupabaseClient } from "@supabase/supabase-js";
import { recordAuditLog } from "../audit/record-audit-log";

const DEFAULT_TAX_RATE = 19.0;

export interface CheckoutContext {
  userId: string;
  companyId: string;
}

export interface CheckoutItem {
  productId: string;
  quantity: number;
  unitPriceCop: number;
}

export interface CheckoutResult {
  orderId: string;
}

function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.floor(Math.random() * 36 ** 4)
    .toString(36)
    .toUpperCase()
    .padStart(4, "0");
  return `ORD-${timestamp}-${random}`;
}

/**
 * Checkout de los ítems **bajo** el umbral (docs/13-MODULE-COMMERCE.md
 * sección 5) — crea `orders` + `order_items` directo, sin pasar por
 * `quotes`. `status` queda en `pending_payment` (default del esquema): el
 * pago se inicia después (paso 7.2) y solo el webhook de Wompi lo marca
 * `paid` (paso 7.3) — nunca esta función, nunca el cliente.
 */
export async function checkoutDirectItems(
  client: SupabaseClient,
  serviceClient: SupabaseClient,
  items: CheckoutItem[],
  ctx: CheckoutContext,
): Promise<CheckoutResult> {
  if (items.length === 0) {
    throw new Error("No hay productos para comprar.");
  }

  const productIds = items.map((item) => item.productId);
  const { data: products, error: productsError } = await client
    .from("products")
    .select("id,name")
    .in("id", productIds);
  if (productsError) {
    throw new Error("No se pudieron obtener los productos para el pedido.");
  }
  const nameById = new Map(
    ((products as { id: string; name: string }[] | null) ?? []).map((p) => [p.id, p.name]),
  );

  let subtotalCop = 0;
  let taxCop = 0;
  let totalCop = 0;
  const lineItems = items.map((item) => {
    const lineSubtotal = item.quantity * item.unitPriceCop;
    const lineTax = Math.round(lineSubtotal * (DEFAULT_TAX_RATE / 100));
    const lineTotal = lineSubtotal + lineTax;
    subtotalCop += lineSubtotal;
    taxCop += lineTax;
    totalCop += lineTotal;
    return {
      product_id: item.productId,
      description: nameById.get(item.productId) ?? "Producto",
      quantity: item.quantity,
      unit_price_cop: item.unitPriceCop,
      tax_rate: DEFAULT_TAX_RATE,
      total_cop: lineTotal,
    };
  });

  const { data: order, error: orderError } = await client
    .from("orders")
    .insert({
      order_number: generateOrderNumber(),
      company_id: ctx.companyId,
      placed_by: ctx.userId,
      subtotal_cop: subtotalCop,
      tax_cop: taxCop,
      total_cop: totalCop,
    })
    .select("id")
    .single();
  if (orderError || !order) {
    throw new Error("No se pudo crear el pedido.");
  }
  const orderId = order["id"] as string;

  const { error: itemsError } = await client
    .from("order_items")
    .insert(lineItems.map((item) => ({ ...item, order_id: orderId })));
  if (itemsError) {
    throw new Error("No se pudieron agregar los productos al pedido.");
  }

  await recordAuditLog(serviceClient, {
    actorId: ctx.userId,
    action: "order.created_direct",
    entity: "order",
    entityId: orderId,
    after: { status: "pending_payment", total_cop: totalCop },
  });

  return { orderId };
}
