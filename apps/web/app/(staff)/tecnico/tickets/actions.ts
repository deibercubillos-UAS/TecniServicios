"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@tecni/db";
import { serverEnv } from "@tecni/shared";
import { staffReplyToTicket, updateTicketStatus } from "@tecni/core";

async function getSessionClient() {
  const cookieStore = await cookies();
  const client = createServerClient(serverEnv.NEXT_PUBLIC_SUPABASE_URL, serverEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    getAll: () => cookieStore.getAll(),
    setAll: (list) => {
      for (const { name, value, options } of list) {
        cookieStore.set(name, value, options);
      }
    },
  });
  const { data: userData } = await client.auth.getUser();
  if (!userData.user) {
    redirect("/login?next=/tecnico/tickets");
  }
  return { client, userId: userData.user.id };
}

export async function staffReplyToTicketAction(formData: FormData): Promise<void> {
  const ticketId = formData.get("ticketId");
  const body = formData.get("body");
  const isInternal = formData.get("isInternal") === "1";

  if (typeof ticketId !== "string" || ticketId.length === 0 || typeof body !== "string" || body.trim().length === 0) {
    redirect("/tecnico/tickets?error=" + encodeURIComponent("Escribe un mensaje."));
  }

  const { client, userId } = await getSessionClient();

  try {
    await staffReplyToTicket(client, { ticketId, body, isInternal }, { staffId: userId });
  } catch (err) {
    const message = err instanceof Error ? err.message : "No se pudo enviar el mensaje.";
    redirect(`/tecnico/tickets/${encodeURIComponent(ticketId)}?error=` + encodeURIComponent(message));
  }

  redirect(`/tecnico/tickets/${encodeURIComponent(ticketId)}?${isInternal ? "noted" : "replied"}=1`);
}

export async function updateTicketStatusAction(formData: FormData): Promise<void> {
  const ticketId = formData.get("ticketId");
  const status = formData.get("status");

  if (typeof ticketId !== "string" || ticketId.length === 0 || typeof status !== "string" || status.length === 0) {
    redirect("/tecnico/tickets?error=" + encodeURIComponent("Datos inválidos."));
  }

  const { client } = await getSessionClient();

  try {
    await updateTicketStatus(client, ticketId, status);
  } catch (err) {
    const message = err instanceof Error ? err.message : "No se pudo actualizar el estado del ticket.";
    redirect(`/tecnico/tickets/${encodeURIComponent(ticketId)}?error=` + encodeURIComponent(message));
  }

  redirect(`/tecnico/tickets/${encodeURIComponent(ticketId)}?statusUpdated=1`);
}
