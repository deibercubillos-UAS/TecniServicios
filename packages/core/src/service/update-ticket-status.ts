import type { SupabaseClient } from "@supabase/supabase-js";

export interface UpdateTicketStatusResult {
  ticketId: string;
}

const VALID_STATUSES = new Set(["assigned", "waiting_customer", "resolved", "closed"]);

/**
 * `technician`/`master` cambian el estado de un ticket
 * (14-MODULE-SERVICE.md sección 5) — `support_tickets_write_staff`
 * (05-RLS-SECURITY-A.md) ya excluye a `seller` (solo lectura). Marca
 * `resolved_at` solo al pasar a `resolved`.
 */
export async function updateTicketStatus(client: SupabaseClient, ticketId: string, status: string): Promise<UpdateTicketStatusResult> {
  if (!VALID_STATUSES.has(status)) {
    throw new Error("Estado de ticket inválido.");
  }

  const values: Record<string, unknown> = { status };
  if (status === "resolved") {
    values["resolved_at"] = new Date().toISOString();
  }

  const { data, error } = await client.from("support_tickets").update(values).eq("id", ticketId).select("id").single();
  if (error || !data) {
    throw new Error("No se pudo actualizar el estado del ticket.");
  }

  return { ticketId: data["id"] as string };
}
