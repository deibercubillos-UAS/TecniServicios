import type { SupabaseClient } from "@supabase/supabase-js";
import { recordAuditLog } from "../audit/record-audit-log";

const DEFAULT_TAX_RATE = 19.0;

export interface RequestQuoteContext {
  userId: string;
  companyId: string;
}

export interface RequestQuoteItem {
  productId: string;
  quantity: number;
  unitPriceCop: number;
}

export interface RequestQuoteResult {
  quoteId: string;
}

/**
 * Crea la solicitud de cotización (docs/13-MODULE-COMMERCE.md sección 4):
 * `status = 'requested'`, **sin `siigo_quote_id` todavía** — ese lo pone
 * Siigo cuando la procese, la web nunca genera su propio consecutivo
 * (regla 5.3 de CLAUDE.md). Tampoco asigna vendedor: la asignación real es
 * Fase 4 del roadmap, acá la cotización queda disponible para que un
 * vendedor la tome.
 */
export async function requestQuote(
  client: SupabaseClient,
  serviceClient: SupabaseClient,
  items: RequestQuoteItem[],
  ctx: RequestQuoteContext,
): Promise<RequestQuoteResult> {
  if (items.length === 0) {
    throw new Error("No hay productos para cotizar.");
  }

  const productIds = items.map((item) => item.productId);
  const { data: products, error: productsError } = await client
    .from("products")
    .select("id,name")
    .in("id", productIds);
  if (productsError) {
    throw new Error("No se pudieron obtener los productos para la cotización.");
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

  const { data: quote, error: quoteError } = await client
    .from("quotes")
    .insert({
      company_id: ctx.companyId,
      requested_by: ctx.userId,
      subtotal_cop: subtotalCop,
      tax_cop: taxCop,
      total_cop: totalCop,
    })
    .select("id")
    .single();
  if (quoteError || !quote) {
    throw new Error("No se pudo crear la cotización.");
  }
  const quoteId = quote["id"] as string;

  const { error: itemsError } = await client
    .from("quote_items")
    .insert(lineItems.map((item) => ({ ...item, quote_id: quoteId })));
  if (itemsError) {
    throw new Error("No se pudieron agregar los productos a la cotización.");
  }

  await recordAuditLog(serviceClient, {
    actorId: ctx.userId,
    action: "quote.requested",
    entity: "quote",
    entityId: quoteId,
    after: { status: "requested", total_cop: totalCop },
  });

  return { quoteId };
}
