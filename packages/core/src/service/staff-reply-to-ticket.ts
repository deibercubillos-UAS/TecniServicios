import type { SupabaseClient } from "@supabase/supabase-js";

export interface StaffReplyToTicketInput {
  ticketId: string;
  body: string;
  isInternal: boolean;
}

export interface StaffReplyToTicketContext {
  staffId: string;
}

export interface StaffReplyToTicketResult {
  messageId: string;
}

/**
 * `technician`/`seller`/`master` responden un ticket o agregan una
 * nota interna (14-MODULE-SERVICE.md sección 5) —
 * `ticket_messages_insert_staff` (05-RLS-SECURITY-A.md) ya limita esto
 * a esos tres roles, para cualquier ticket. `isInternal` viene de la
 * decisión explícita del formulario (dos botones distintos en la UI,
 * nunca un checkbox que se pueda dejar sin marcar por accidente).
 */
export async function staffReplyToTicket(
  client: SupabaseClient,
  input: StaffReplyToTicketInput,
  ctx: StaffReplyToTicketContext,
): Promise<StaffReplyToTicketResult> {
  if (input.body.trim().length === 0) {
    throw new Error("El mensaje no puede estar vacío.");
  }

  const { data, error } = await client
    .from("ticket_messages")
    .insert({ ticket_id: input.ticketId, author_id: ctx.staffId, body: input.body, is_internal: input.isInternal })
    .select("id")
    .single();
  if (error || !data) {
    throw new Error("No se pudo enviar el mensaje.");
  }

  return { messageId: data["id"] as string };
}
