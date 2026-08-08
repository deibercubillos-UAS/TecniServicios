import type { SupabaseClient } from "@supabase/supabase-js";
import { computeWompiChecksum, type WompiWebhookEvent } from "@tecni/integrations";

const WOMPI_STATUS_TO_PAYMENT_STATUS: Record<string, string> = {
  APPROVED: "approved",
  DECLINED: "declined",
  VOIDED: "voided",
  PENDING: "pending",
  ERROR: "declined",
};

export type ProcessWompiWebhookOutcome = "processed" | "invalid_signature" | "unknown_order" | "duplicate_event";

export interface ProcessWompiWebhookResult {
  outcome: ProcessWompiWebhookOutcome;
}

/**
 * Procesa un evento de webhook de Wompi (docs/09-INTEGRATION-PAYMENTS.md
 * sección 2, paso 4). **Riesgoso**: solo se debe invocar con un cliente
 * `service_role` (`payments` no tiene ninguna política de insert/update
 * para `authenticated`, docs/05-RLS-SECURITY-A.md), y nunca se confía en
 * el cuerpo del evento sin verificar la firma primero — la verificación es
 * lo primero que hace esta función, antes de tocar la base.
 */
export async function processWompiWebhookEvent(
  serviceClient: SupabaseClient,
  event: WompiWebhookEvent,
  eventsSecret: string,
): Promise<ProcessWompiWebhookResult> {
  const expectedChecksum = computeWompiChecksum(event.data.transaction, event.timestamp, eventsSecret);
  if (expectedChecksum !== event.signature.checksum) {
    return { outcome: "invalid_signature" };
  }

  const { transaction } = event.data;

  const { data: order } = await serviceClient
    .from("orders")
    .select("id")
    .eq("order_number", transaction.reference)
    .maybeSingle();
  if (!order) {
    return { outcome: "unknown_order" };
  }

  const { error: insertError } = await serviceClient.from("payments").insert({
    order_id: order["id"],
    provider: "wompi",
    provider_ref: transaction.id,
    status: WOMPI_STATUS_TO_PAYMENT_STATUS[transaction.status] ?? "pending",
    amount_cop: transaction.amountInCents / 100,
    raw_response: transaction,
    paid_at: transaction.status === "APPROVED" ? new Date().toISOString() : null,
  });

  if (insertError) {
    // `unique (provider, provider_ref)` — Wompi reintentó un evento ya
    // procesado. No es un error: es el comportamiento esperado, se
    // descarta sin volver a tocar `orders.status`.
    if (insertError.code === "23505") {
      return { outcome: "duplicate_event" };
    }
    throw new Error("No se pudo registrar el pago.");
  }

  if (transaction.status === "APPROVED") {
    await serviceClient.from("orders").update({ status: "paid" }).eq("id", order["id"]);
  }

  return { outcome: "processed" };
}
