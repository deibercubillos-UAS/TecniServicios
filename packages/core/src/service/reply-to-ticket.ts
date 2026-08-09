import type { SupabaseClient } from "@supabase/supabase-js";

export interface ReplyToTicketInput {
  ticketId: string;
  body: string;
}

export interface ReplyToTicketContext {
  userId: string;
}

export interface ReplyToTicketResult {
  messageId: string;
}

/**
 * El cliente responde su propio ticket (14-MODULE-SERVICE.md sección
 * 5) — siempre `is_internal = false`, no hay forma de que un cliente
 * envíe una nota interna. `ticket_messages_insert_owner`
 * (05-RLS-SECURITY-A.md) ya exige eso mismo en el `with check` y que
 * el ticket sea de su empresa; esta función no repite esa validación.
 */
export async function replyToTicket(
  client: SupabaseClient,
  input: ReplyToTicketInput,
  ctx: ReplyToTicketContext,
): Promise<ReplyToTicketResult> {
  if (input.body.trim().length === 0) {
    throw new Error("El mensaje no puede estar vacío.");
  }

  const { data, error } = await client
    .from("ticket_messages")
    .insert({ ticket_id: input.ticketId, author_id: ctx.userId, body: input.body, is_internal: false })
    .select("id")
    .single();
  if (error || !data) {
    throw new Error("No se pudo enviar el mensaje.");
  }

  return { messageId: data["id"] as string };
}
