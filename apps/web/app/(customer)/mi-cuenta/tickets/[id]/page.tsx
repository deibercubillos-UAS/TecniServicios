import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@tecni/db";
import { serverEnv } from "@tecni/shared";

import { replyToTicketAction } from "../actions";

export const metadata: Metadata = {
  title: "Detalle de ticket — Tecni Equipos y Servicios SAS",
};

const TICKET_STATUS_LABEL: Record<string, string> = {
  open: "Abierto",
  assigned: "Asignado",
  waiting_customer: "Esperando tu respuesta",
  resolved: "Resuelto",
  closed: "Cerrado",
};

interface TicketRow {
  id: string;
  ticket_number: string;
  subject: string;
  status: string;
  created_at: string;
}

interface MessageRow {
  id: string;
  author_id: string;
  body: string;
  created_at: string;
}

async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(serverEnv.NEXT_PUBLIC_SUPABASE_URL, serverEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    getAll: () => cookieStore.getAll(),
    setAll: () => {},
  });
}

export default async function DetalleTicketPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string; replied?: string; error?: string }>;
}) {
  const { id } = await params;
  const { created, replied, error } = await searchParams;
  const supabase = await getSupabase();

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    redirect("/login?next=/mi-cuenta/tickets/" + encodeURIComponent(id));
  }

  // `support_tickets_read` (05-RLS-SECURITY-C.md) ya limita esto a la
  // propia empresa. `ticket_messages_read` deja ver solo los mensajes NO
  // internos — nunca una nota interna, ni siquiera en el conteo.
  const { data: ticketData } = await supabase
    .from("support_tickets")
    .select("id,ticket_number,subject,status,created_at")
    .eq("id", id)
    .maybeSingle();
  const ticket = ticketData as TicketRow | null;

  if (!ticket) {
    return (
      <div className="mx-auto max-w-[700px] px-4 py-16">
        <h1 className="mb-4 text-2xl font-bold text-text">Ticket no encontrado</h1>
        <p className="text-text-muted">
          No encontramos este ticket o no pertenece a tu empresa.{" "}
          <Link href="/mi-cuenta/tickets" className="text-brand hover:underline">
            Ver mis tickets
          </Link>
        </p>
      </div>
    );
  }

  const { data: messagesData } = await supabase
    .from("ticket_messages")
    .select("id,author_id,body,created_at")
    .eq("ticket_id", ticket.id)
    .order("created_at", { ascending: true });
  const messages = (messagesData as MessageRow[] | null) ?? [];

  return (
    <div className="mx-auto flex max-w-[700px] flex-col gap-6 px-4 py-16">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold text-text">{ticket.subject}</h1>
        <span className="rounded-full border border-border px-3 py-1 text-xs font-medium text-text">
          {TICKET_STATUS_LABEL[ticket.status] ?? ticket.status}
        </span>
      </div>
      <p className="text-sm text-text-muted">
        {ticket.ticket_number} · Abierto el {new Date(ticket.created_at).toLocaleDateString("es-CO")}
      </p>

      {created ? (
        <p className="rounded-[var(--radius)] border border-success bg-success/10 px-3 py-2 text-sm text-success">
          Ticket abierto. Te responderemos pronto.
        </p>
      ) : null}
      {replied ? (
        <p className="rounded-[var(--radius)] border border-success bg-success/10 px-3 py-2 text-sm text-success">Mensaje enviado.</p>
      ) : null}
      {error ? (
        <p role="alert" className="rounded-[var(--radius)] border border-danger bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>
      ) : null}

      <section className="rounded-lg border border-border">
        <h2 className="border-b border-border bg-bg-alt px-4 py-3 font-semibold text-text">Mensajes</h2>
        {messages.length === 0 ? (
          <p className="px-4 py-3 text-sm text-text-muted">Sin mensajes todavía.</p>
        ) : (
          <ul className="divide-y divide-border">
            {messages.map((message) => (
              <li key={message.id} className="px-4 py-3 text-sm">
                <p className="text-text">{message.body}</p>
                <p className="mt-1 text-xs text-text-muted">{new Date(message.created_at).toLocaleString("es-CO")}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {ticket.status !== "closed" ? (
        <section className="rounded-lg border border-border p-4">
          <h2 className="mb-3 font-semibold text-text">Responder</h2>
          <form action={replyToTicketAction} className="flex flex-col gap-3">
            <input type="hidden" name="ticketId" value={ticket.id} />
            <textarea
              name="body"
              rows={3}
              required
              className="rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm"
              placeholder="Escribe tu mensaje"
            />
            <button
              type="submit"
              className="self-start rounded-[var(--radius)] bg-brand px-4 py-2 text-sm font-semibold text-text-inverse transition-colors hover:bg-brand-hover"
            >
              Enviar
            </button>
          </form>
        </section>
      ) : null}

      <Link href="/mi-cuenta/tickets" className="text-sm text-brand hover:underline">
        Ver mis tickets
      </Link>
    </div>
  );
}
