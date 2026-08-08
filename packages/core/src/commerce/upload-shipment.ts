import type { SupabaseClient } from "@supabase/supabase-js";

export interface UploadShipmentInput {
  orderId: string;
  carrier: string;
  trackingNumber?: string;
  trackingUrl?: string;
  notes?: string;
}

export interface UploadShipmentContext {
  userId: string;
}

export interface UploadShipmentResult {
  shipmentId: string;
}

/**
 * Carga manual de guía de envío (docs/13-MODULE-COMMERCE.md,
 * `shipments_write_staff` en docs/05-RLS-SECURITY-A.md — solo
 * vendedor/master). No cambia `orders.status` — el estado del pedido
 * (`preparing`/`shipped`/`delivered`) lo mueve el vendedor por separado,
 * esta función solo registra la guía.
 */
export async function uploadShipment(
  client: SupabaseClient,
  input: UploadShipmentInput,
  ctx: UploadShipmentContext,
): Promise<UploadShipmentResult> {
  if (input.carrier.trim().length === 0) {
    throw new Error("La transportadora es obligatoria.");
  }

  const { data: shipment, error } = await client
    .from("shipments")
    .insert({
      order_id: input.orderId,
      carrier: input.carrier,
      tracking_number: input.trackingNumber || null,
      tracking_url: input.trackingUrl || null,
      notes: input.notes || null,
      created_by: ctx.userId,
      shipped_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (error || !shipment) {
    throw new Error("No se pudo registrar la guía de envío.");
  }

  return { shipmentId: shipment["id"] as string };
}
