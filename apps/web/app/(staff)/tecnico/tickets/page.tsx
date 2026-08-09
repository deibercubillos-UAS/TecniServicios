import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { createServerClient } from "@tecni/db";
import { serverEnv } from "@tecni/shared";

export const metadata: Metadata = {
  title: "Tickets — Panel de técnico",
};

const TICKET_STATUS_LABEL: Record<string, string> = {
  open: "Abierto",
  assigned: "Asignado",
  waiting_customer: "Esperando al cliente",
  resolved: "Resuelto",
  closed: "Cerrado",
};

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

export default async function TecnicoTicketsPage() {
  const supabase = await getSupabase();

  // El middleware ya exige technician/master para llegar a /tecnico.
  // `support_tickets_read` (05-RLS-SECURITY-A.md) deja ver TODOS los
  // tickets a technician/seller/master — soporte es un rol global, no
  // por cliente asignado.
  const { data: ticketsData } = await supabase
    .from("support_tickets")
    .select("id,ticket_number,subject,status,priority,created_at,companies(legal_name)")
    .order("created_at", { ascending: false });
  const tickets = (ticketsData as unknown as TicketRow[] | null) ?? [];

  return (
    <div className="mx-auto flex max-w-[900px] flex-col gap-6 px-4 py-16">
      <h1 className="text-2xl font-bold text-text">Tickets</h1>

      {tickets.length === 0 ? (
        <p className="text-text-muted">No hay tickets todavía.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-border rounded-lg border border-border">
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
              <span className="rounded-full border border-border px-3 py-1 text-xs font-medium text-text">
                {TICKET_STATUS_LABEL[ticket.status] ?? ticket.status}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
