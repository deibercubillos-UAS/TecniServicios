import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { createServerClient } from "@tecni/db";
import { serverEnv } from "@tecni/shared";
import { Icon } from "@tecni/ui";

import { StatusBadge } from "@/components/status-badge";
import { TICKET_STATUS_LABEL_STAFF, TICKET_STATUS_TONE } from "@/lib/ticket-status";

export const metadata: Metadata = {
  title: "Tickets — Panel de técnico",
};

const PAGE_SIZE = 50;

interface TicketRow {
  id: string;
  ticket_number: string;
  subject: string;
  status: string;
  priority: string;
  created_at: string;
  companies: { legal_name: string } | null;
}

async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(serverEnv.NEXT_PUBLIC_SUPABASE_URL, serverEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    getAll: () => cookieStore.getAll(),
    setAll: () => {},
  });
}

function buildPageHref(current: Record<string, string | undefined>, page: number): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(current)) {
    if (value) params.set(key, value);
  }
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/tecnico/tickets?${query}` : "/tecnico/tickets";
}

export default async function TecnicoTicketsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const { status, page: pageRaw } = await searchParams;
  const page = Math.max(1, Number.parseInt(pageRaw ?? "1", 10) || 1);
  const supabase = await getSupabase();

  // El middleware ya exige technician/master para llegar a /tecnico.
  // `support_tickets_read` (05-RLS-SECURITY-A.md) deja ver TODOS los
  // tickets a technician/seller/master — soporte es un rol global, no
  // por cliente asignado. El filtro de estado se aplica sobre ese mismo
  // conjunto, nunca amplía el alcance.
  let query = supabase
    .from("support_tickets")
    .select("id,ticket_number,subject,status,priority,created_at,companies(legal_name)", { count: "exact" })
    .order("created_at", { ascending: false });
  if (status) query = query.eq("status", status);
  query = query.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  const { data: ticketsData, count } = await query;
  const tickets = (ticketsData as unknown as TicketRow[] | null) ?? [];
  const totalCount = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <div className="mx-auto flex max-w-[1000px] flex-col gap-6 px-4 py-16">
      <div>
        <h1 className="text-2xl font-bold text-text">Tickets</h1>
        <p className="text-sm text-text-muted">
          {totalCount} ticket{totalCount === 1 ? "" : "s"}.
        </p>
      </div>

      <section className="rounded-xl border border-border bg-surface p-5">
        <h2 className="mb-4 flex items-center gap-2 font-bold text-text">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-subtle text-brand">
            <Icon name="sliders" size={16} />
          </span>
          Filtros
        </h2>
        <form className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor="status" className="text-xs font-medium text-text-muted">
              Estado
            </label>
            <select
              id="status"
              name="status"
              defaultValue={status ?? ""}
              className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2 text-sm focus:border-brand focus:outline-none"
            >
              <option value="">Todos</option>
              {Object.entries(TICKET_STATUS_LABEL_STAFF).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="rounded-[var(--radius)] bg-brand px-4 py-2 text-sm font-semibold text-text-inverse transition-colors hover:bg-brand-hover">
            Filtrar
          </button>
          {status ? (
            <Link href="/tecnico/tickets" className="text-sm text-brand hover:underline">
              Limpiar
            </Link>
          ) : null}
        </form>
      </section>

      {tickets.length === 0 ? (
        <p className="rounded-[var(--radius)] border border-dashed border-border bg-bg-alt px-4 py-6 text-center text-sm text-text-muted">
          No hay tickets para este filtro.
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-border rounded-xl border border-border bg-surface">
          {tickets.map((ticket) => (
            <li key={ticket.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
              <div>
                <Link href={`/tecnico/tickets/${ticket.id}`} className="font-medium text-text hover:text-brand">
                  {ticket.subject}
                </Link>
                <p className="text-xs text-text-muted">
                  {ticket.ticket_number} · {ticket.companies?.legal_name ?? "Empresa"} ·{" "}
                  {new Date(ticket.created_at).toLocaleDateString("es-CO")}
                </p>
              </div>
              <StatusBadge
                label={TICKET_STATUS_LABEL_STAFF[ticket.status] ?? ticket.status}
                tone={TICKET_STATUS_TONE[ticket.status]?.tone ?? "muted"}
                icon={TICKET_STATUS_TONE[ticket.status]?.icon ?? "chat"}
              />
            </li>
          ))}
        </ul>
      )}

      {totalPages > 1 ? (
        <div className="flex items-center justify-between gap-3 text-sm text-text-muted">
          <span>
            Página {page} de {totalPages}
          </span>
          <div className="flex gap-2">
            {page > 1 ? (
              <Link href={buildPageHref({ status }, page - 1)} className="rounded-[var(--radius)] border border-border px-3 py-1.5 hover:border-brand hover:text-text">
                Anterior
              </Link>
            ) : null}
            {page < totalPages ? (
              <Link href={buildPageHref({ status }, page + 1)} className="rounded-[var(--radius)] border border-border px-3 py-1.5 hover:border-brand hover:text-text">
                Siguiente
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
