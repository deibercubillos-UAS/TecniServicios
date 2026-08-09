import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@tecni/db";
import { serverEnv } from "@tecni/shared";
import { Icon } from "@tecni/ui";

import { StatusBadge } from "@/components/status-badge";
import { TICKET_STATUS_LABEL, TICKET_STATUS_TONE } from "@/lib/ticket-status";
import { replyToTicketAction } from "../actions";

export const metadata: Metadata = {
  title: "Detalle de ticket — Tecni Equipos y Servicios SAS",
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

  const tone = TICKET_STATUS_TONE[ticket.status] ?? { tone: "muted" as const, icon: "chat" as const };

  return (
    <div className="mx-auto flex max-w-[700px] flex-col gap-6 px-4 py-12 sm:py-16">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-2xl font-bold text-text">{ticket.subject}</h1>
          <StatusBadge label={TICKET_STATUS_LABEL[ticket.status] ?? ticket.status} tone={tone.tone} icon={tone.icon} />
        </div>
        <p className="text-sm text-text-muted">
          {ticket.ticket_number} · Abierto el {new Date(ticket.created_at).toLocaleDateString("es-CO")}
        </p>
      </div>

      {created ? (
        <p className="flex items-center gap-2 rounded-[var(--radius)] border border-success bg-success/10 px-3 py-2 text-sm text-success">
          <Icon name="checkCircle" size={16} />
          Ticket abierto. Te responderemos pronto.
        </p>
      ) : null}
      {replied ? (
        <p className="flex items-center gap-2 rounded-[var(--radius)] border border-success bg-success/10 px-3 py-2 text-sm text-success">
          <Icon name="checkCircle" size={16} />
          Mensaje enviado.
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="flex items-center gap-2 rounded-[var(--radius)] border border-danger bg-danger/10 px-3 py-2 text-sm text-danger">
          <Icon name="close" size={16} />
          {error}
        </p>
      ) : null}

      <section className="rounded-xl border border-border bg-surface p-5">
        <h2 className="mb-4 font-bold text-text">Mensajes</h2>
        {messages.length === 0 ? (
          <p className="text-sm text-text-muted">Sin mensajes todavía.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {messages.map((message) => {
              const isYou = message.author_id === userData.user!.id;
              return (
                <li key={message.id} className={`flex ${isYou ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-xl px-4 py-3 text-sm ${isYou ? "bg-brand-subtle text-text" : "bg-bg-alt text-text"}`}>
                    <p className="mb-1 text-[11px] font-semibold text-text-muted">{isYou ? "Tú" : "Tecni"}</p>
                    <p>{message.body}</p>
                    <p className="mt-1 text-[11px] text-text-muted">{new Date(message.created_at).toLocaleString("es-CO")}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {ticket.status !== "closed" ? (
        <section className="rounded-xl border border-border bg-surface p-5">
          <h2 className="mb-3 font-bold text-text">Responder</h2>
          <form action={replyToTicketAction} className="flex flex-col gap-3">
            <input type="hidden" name="ticketId" value={ticket.id} />
            <textarea
              name="body"
              rows={3}
              required
              className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
              placeholder="Escribe tu mensaje"
            />
            <button
              type="submit"
              className="flex w-fit items-center gap-2 rounded-[var(--radius)] bg-brand px-5 py-2.5 text-sm font-semibold text-text-inverse transition-colors hover:bg-brand-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              <Icon name="arrowRight" size={16} />
              Enviar
            </button>
          </form>
        </section>
      ) : null}

      <Link href="/mi-cuenta/tickets" className="text-sm font-medium text-brand hover:underline">
        Ver mis tickets
      </Link>
    </div>
  );
}
