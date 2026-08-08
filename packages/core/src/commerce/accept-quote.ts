import type { SupabaseClient } from "@supabase/supabase-js";

export interface AcceptQuoteContext {
  userId: string;
  companyId: string;
}

export interface AcceptQuoteResult {
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
 * De una cotización `sent`, crea `orders` + `order_items` copiando los
 * ítems de la cotización (docs/13-MODULE-COMMERCE.md sección 4). `client`
 * (la sesión del cliente) hace las lecturas y los inserts que su propia
 * RLS ya permite (`orders_insert`/`order_items_insert`, empresa dueña).
 * `serviceClient` se usa **solo** para marcar `quotes.status = 'accepted'`
 * — ninguna política de RLS deja que el cliente edite su propia
 * cotización (`quotes_update_staff` es solo vendedor/master), y abrir una
 * política nueva solo para esta transición sería una superficie de RLS
 * más difícil de razonar que confiar en que esta función ya validó
 * ownership y estado (`company_id`/`status = 'sent'`) antes de escribir.
 */
export async function acceptQuote(
  client: SupabaseClient,
  serviceClient: SupabaseClient,
  quoteId: string,
  ctx: AcceptQuoteContext,
): Promise<AcceptQuoteResult> {
  const { data: quote, error: quoteError } = await client
    .from("quotes")
    .select("id,company_id,status,subtotal_cop,tax_cop,total_cop")
    .eq("id", quoteId)
    .maybeSingle();
  if (quoteError || !quote) {
    throw new Error("No se encontró la cotización.");
  }
  if (quote["company_id"] !== ctx.companyId) {
    throw new Error("Esta cotización no pertenece a tu empresa.");
  }
  if (quote["status"] !== "sent") {
    throw new Error("Solo se puede aceptar una cotización enviada.");
  }

  const { data: quoteItems, error: itemsError } = await client
    .from("quote_items")
    .select("product_id,description,quantity,unit_price_cop,tax_rate,total_cop")
    .eq("quote_id", quoteId);
  if (itemsError || !quoteItems || quoteItems.length === 0) {
    throw new Error("La cotización no tiene productos.");
  }

  const { data: order, error: orderError } = await client
    .from("orders")
    .insert({
      order_number: generateOrderNumber(),
      company_id: ctx.companyId,
      placed_by: ctx.userId,
      quote_id: quoteId,
      subtotal_cop: quote["subtotal_cop"],
      tax_cop: quote["tax_cop"],
      total_cop: quote["total_cop"],
    })
    .select("id")
    .single();
  if (orderError || !order) {
    throw new Error("No se pudo crear el pedido.");
  }
  const orderId = order["id"] as string;

  const { error: orderItemsError } = await client.from("order_items").insert(
    (quoteItems as Record<string, unknown>[]).map((item) => ({
      order_id: orderId,
      product_id: item["product_id"],
      description: item["description"],
      quantity: item["quantity"],
      unit_price_cop: item["unit_price_cop"],
      tax_rate: item["tax_rate"],
      total_cop: item["total_cop"],
    })),
  );
  if (orderItemsError) {
    throw new Error("No se pudieron copiar los productos de la cotización al pedido.");
  }

  const { error: updateQuoteError } = await serviceClient
    .from("quotes")
    .update({ status: "accepted", accepted_at: new Date().toISOString() })
    .eq("id", quoteId);
  if (updateQuoteError) {
    throw new Error("El pedido se creó, pero no se pudo marcar la cotización como aceptada.");
  }

  return { orderId };
}
