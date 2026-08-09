"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@tecni/db";
import { serverEnv } from "@tecni/shared";
import { openTicket, replyToTicket } from "@tecni/core";

export async function openTicketAction(formData: FormData): Promise<void> {
  const subject = formData.get("subject");
  const equipmentId = formData.get("equipmentId");
  const message = formData.get("message");

  if (typeof subject !== "string" || subject.trim().length === 0) {
    redirect("/mi-cuenta/tickets?error=" + encodeURIComponent("El asunto es obligatorio."));
  }

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
    redirect("/login?next=/mi-cuenta/tickets");
  }

  const { data: membership } = await client
    .from("company_members")
    .select("company_id")
    .eq("profile_id", userData.user.id)
    .order("is_primary", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!membership) {
    redirect("/mi-cuenta/tickets?error=" + encodeURIComponent("Tu cuenta todavía no está asociada a una empresa."));
  }

  let ticketId = "";
  try {
    const result = await openTicket(
      client,
      {
        subject,
        ...(typeof equipmentId === "string" && equipmentId.length > 0 ? { equipmentId } : {}),
        ...(typeof message === "string" && message.trim().length > 0 ? { message } : {}),
      },
      { companyId: membership["company_id"] as string, userId: userData.user.id },
    );
    ticketId = result.ticketId;
  } catch (err) {
    const message2 = err instanceof Error ? err.message : "No se pudo abrir el ticket.";
    redirect("/mi-cuenta/tickets?error=" + encodeURIComponent(message2));
  }

  redirect(`/mi-cuenta/tickets/${ticketId}?created=1`);
}

export async function replyToTicketAction(formData: FormData): Promise<void> {
  const ticketId = formData.get("ticketId");
  const body = formData.get("body");

  if (typeof ticketId !== "string" || ticketId.length === 0 || typeof body !== "string" || body.trim().length === 0) {
    redirect("/mi-cuenta/tickets?error=" + encodeURIComponent("Escribe un mensaje."));
  }

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
    redirect("/login?next=/mi-cuenta/tickets/" + encodeURIComponent(ticketId));
  }

  try {
    await replyToTicket(client, { ticketId, body }, { userId: userData.user.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "No se pudo enviar el mensaje.";
    redirect(`/mi-cuenta/tickets/${encodeURIComponent(ticketId)}?error=` + encodeURIComponent(message));
  }

  redirect(`/mi-cuenta/tickets/${encodeURIComponent(ticketId)}?replied=1`);
}
