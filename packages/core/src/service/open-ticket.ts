import type { SupabaseClient } from "@supabase/supabase-js";

export interface OpenTicketInput {
  subject: string;
  equipmentId?: string;
  message?: string;
}

export interface OpenTicketContext {
  companyId: string;
  userId: string;
}

export interface OpenTicketResult {
  ticketId: string;
  ticketNumber: string;
}

function generateTicketNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.floor(Math.random() * 36 ** 4)
    .toString(36)
    .toUpperCase()
    .padStart(4, "0");
  return `TCK-${timestamp}-${random}`;
}

/**
 * El cliente abre un ticket de soporte (14-MODULE-SERVICE.md sección
 * 5), opcionalmente ligado a un equipo propio. `ticket_number` es un
 * consecutivo propio de la web (no viene de Siigo — soporte no es un
 * documento fiscal). El mensaje inicial, si viene, se guarda **siempre
 * no interno** — el cliente nunca puede crear una nota interna,
 * `ticket_messages_insert_owner` (05-RLS-SECURITY-A.md) lo exige
 * también en el `with check`, esta función solo evita el viaje extra a
 * la base si no hay mensaje.
 */
export async function openTicket(client: SupabaseClient, input: OpenTicketInput, ctx: OpenTicketContext): Promise<OpenTicketResult> {
  if (input.subject.trim().length === 0) {
    throw new Error("El asunto es obligatorio.");
  }

  const ticketNumber = generateTicketNumber();
  const { data: ticket, error: ticketError } = await client
    .from("support_tickets")
    .insert({
      ticket_number: ticketNumber,
      company_id: ctx.companyId,
      equipment_id: input.equipmentId || null,
      opened_by: ctx.userId,
      subject: input.subject,
    })
    .select("id")
    .single();
  if (ticketError || !ticket) {
    throw new Error("No se pudo abrir el ticket.");
  }
  const ticketId = ticket["id"] as string;

  if (input.message && input.message.trim().length > 0) {
    const { error: messageError } = await client.from("ticket_messages").insert({
      ticket_id: ticketId,
      author_id: ctx.userId,
      body: input.message,
      is_internal: false,
    });
    if (messageError) {
      throw new Error("El ticket se abrió, pero no se pudo guardar el mensaje inicial.");
    }
  }

  return { ticketId, ticketNumber };
}
