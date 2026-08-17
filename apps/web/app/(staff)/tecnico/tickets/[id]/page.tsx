import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { createServerClient } from "@tecni/db";
import { serverEnv } from "@tecni/shared";

import { StatusBadge } from "@/components/status-badge";
import { TICKET_STATUS_LABEL_STAFF, TICKET_STATUS_TONE } from "@/lib/ticket-status";
import { staffReplyToTicketAction, updateTicketStatusAction } from "../actions";

export const metadata: Metadata = {
  title: "Detalle de ticket — Panel de técnico",
};

interface TicketRow {
  id: string;
  ticket_number: string;
  subject: string;
  status: string;
  created_at: string;
  companies: { legal_name: string } | null;
}

interface MessageRow {
  id: string;
  body: string;
  is_internal: boolean;
  created_at: string;
}

async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(serverEnv.NEXT_PUBLIC_SUPABASE_URL, serverEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    getAll: () => cookieStore.getAll(),
    setAll: () => {},
  });
}

export default async function TecnicoDetalleTicketPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; replied?: string; noted?: string; statusUpdated?: string }>;
}) {
  const { id } = await params;
  const { error, replied, noted, statusUpdated } = await searchParams;
  const supabase = await getSupabase();

  const { data: ticketData } = await supabase
    .from("support_tickets")
    .select("id,ticket_number,subject,status,created_at,companies(legal_name)")
    .eq("id", id)
    .maybeSingle();
  const ticket = ticketData as unknown as TicketRow | null;

  if (!ticket) {
    return (
      <div className="mx-auto max-w-[700px] px-4 py-16">
        <h1 className="mb-4 text-2xl font-bold text-text">Ticket no encontrado</h1>
        <p className="text-text-muted">
          <Link href="/tecnico/tickets" className="text-brand hover:underline">
            Ver tickets
          </Link>
        </p>
      </div>
    );
  }

  // Con sesión de technician/master, ticket_messages_read deja ver TODO,
  // incluidas las notas internas — esta vista es del staff, no la del
  // cliente.
  const { data: messagesData } = await supabase
    .from("ticket_messages")
    .select("id,body,is_internal,created_at")
    .eq("ticket_id", ticket.id)
    .order("created_at", { ascending: true });
  const messages = (messagesData as MessageRow[] | null) ?? [];

  return (
    <div className="mx-auto flex max-w-[700px] flex-col gap-6 px-4 py-16">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold text-text">{ticket.subject}</h1>
        <StatusBadge
          label={TICKET_STATUS_LABEL_STAFF[ticket.status] ?? ticket.status}
          tone={TICKET_STATUS_TONE[ticket.status]?.tone ?? "muted"}
          icon={TICKET_STATUS_TONE[ticket.status]?.icon ?? "chat"}
        />
      </div>
      <p className="text-sm text-text-muted">
        {ticket.ticket_number} · {ticket.companies?.legal_name ?? "Empresa"} · {new Date(ticket.created_at).toLocaleDateString("es-CO")}
      </p>

      {replied ? (
        <p className="rounded-[var(--radius)] border border-success bg-success/10 px-3 py-2 text-sm text-success">Respuesta enviada al cliente.</p>
      ) : null}
      {noted ? (
        <p className="rounded-[var(--radius)] border border-success bg-success/10 px-3 py-2 text-sm text-success">Nota interna agregada.</p>
      ) : null}
      {statusUpdated ? (
        <p className="rounded-[var(--radius)] border border-success bg-success/10 px-3 py-2 text-sm text-success">Estado actualizado.</p>
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
              <li key={message.id} className={`px-4 py-3 text-sm ${message.is_internal ? "bg-warning/10" : ""}`}>
                {message.is_internal ? <p className="mb-1 text-xs font-semibold text-warning">Nota interna</p> : null}
                <p className="text-text">{message.body}</p>
                <p className="mt-1 text-xs text-text-muted">{new Date(message.created_at).toLocaleString("es-CO")}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-lg border border-border p-4">
        <h2 className="mb-3 font-semibold text-text">Responder al cliente</h2>
        <form action={staffReplyToTicketAction} className="flex flex-col gap-3">
          <input type="hidden" name="ticketId" value={ticket.id} />
          <input type="hidden" name="isInternal" value="0" />
          <textarea name="body" rows={3} required className="rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm" />
          <button
            type="submit"
            className="self-start rounded-[var(--radius)] bg-brand px-4 py-2 text-sm font-semibold text-text-inverse transition-colors hover:bg-brand-hover"
          >
            Enviar al cliente
          </button>
        </form>
      </section>

      <section className="rounded-lg border border-border p-4">
        <h2 className="mb-3 font-semibold text-text">Nota interna</h2>
        <form action={staffReplyToTicketAction} className="flex flex-col gap-3">
          <input type="hidden" name="ticketId" value={ticket.id} />
          <input type="hidden" name="isInternal" value="1" />
          <textarea name="body" rows={3} required className="rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm" />
          <button
            type="submit"
            className="self-start rounded-[var(--radius)] border border-border px-4 py-2 text-sm font-medium text-text hover:border-brand"
          >
            Guardar nota interna
          </button>
        </form>
      </section>

      {ticket.status !== "closed" ? (
        <section className="rounded-lg border border-border p-4">
          <h2 className="mb-3 font-semibold text-text">Estado</h2>
          <div className="flex flex-wrap gap-2">
            {ticket.status !== "resolved" ? (
              <form action={updateTicketStatusAction}>
                <input type="hidden" name="ticketId" value={ticket.id} />
                <input type="hidden" name="status" value="resolved" />
                <button type="submit" className="rounded-[var(--radius)] border border-border px-3 py-1.5 text-sm font-medium text-text hover:border-brand">
                  Marcar resuelto
                </button>
              </form>
            ) : null}
            <form action={updateTicketStatusAction}>
              <input type="hidden" name="ticketId" value={ticket.id} />
              <input type="hidden" name="status" value="closed" />
              <button type="submit" className="rounded-[var(--radius)] bg-brand px-3 py-1.5 text-sm font-semibold text-text-inverse hover:bg-brand-hover">
                Cerrar ticket
              </button>
            </form>
          </div>
        </section>
      ) : null}

      <Link href="/tecnico/tickets" className="text-sm text-brand hover:underline">
        Ver tickets
      </Link>
    </div>
  );
}
