import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@tecni/db";
import { serverEnv } from "@tecni/shared";

import { openTicketAction } from "./actions";

export const metadata: Metadata = {
  title: "Tickets de soporte — Tecni Equipos y Servicios SAS",
};

const TICKET_STATUS_LABEL: Record<string, string> = {
  open: "Abierto",
  assigned: "Asignado",
  waiting_customer: "Esperando tu respuesta",
  resolved: "Resuelto",
  closed: "Cerrado",
};

interface EquipmentOption {
  id: string;
  products: { name: string } | null;
}

interface TicketRow {
  id: string;
  ticket_number: string;
  subject: string;
  status: string;
  created_at: string;
}

async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(serverEnv.NEXT_PUBLIC_SUPABASE_URL, serverEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    getAll: () => cookieStore.getAll(),
    setAll: () => {},
  });
}

export default async function TicketsPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const supabase = await getSupabase();

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    redirect("/login?next=/mi-cuenta/tickets");
  }

  const { data: membership } = await supabase
    .from("company_members")
    .select("company_id")
    .eq("profile_id", userData.user.id)
    .order("is_primary", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!membership) {
    return (
      <div className="mx-auto max-w-[800px] px-4 py-16">
        <h1 className="mb-4 text-2xl font-bold text-text">Tickets de soporte</h1>
        <p className="text-text-muted">Tu cuenta todavía no está asociada a una empresa.</p>
      </div>
    );
  }

  const { data: equipmentData } = await supabase.from("owned_equipment").select("id,products(name)").eq("is_active", true);
  const equipmentOptions = (equipmentData as unknown as EquipmentOption[] | null) ?? [];

  const { data: ticketsData } = await supabase
    .from("support_tickets")
    .select("id,ticket_number,subject,status,created_at")
    .order("created_at", { ascending: false });
  const tickets = (ticketsData as TicketRow[] | null) ?? [];

  return (
    <div className="mx-auto flex max-w-[800px] flex-col gap-6 px-4 py-16">
      <h1 className="text-2xl font-bold text-text">Tickets de soporte</h1>

      {error ? (
        <p role="alert" className="rounded-[var(--radius)] border border-danger bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>
      ) : null}

      <section className="rounded-lg border border-border p-4">
        <h2 className="mb-3 font-semibold text-text">Abrir un ticket</h2>
        <form action={openTicketAction} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor="subject" className="text-sm text-text-muted">
              Asunto
            </label>
            <input id="subject" name="subject" required className="rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm" />
          </div>
          {equipmentOptions.length > 0 ? (
            <div className="flex flex-col gap-1">
              <label htmlFor="equipmentId" className="text-sm text-text-muted">
                Equipo (opcional)
              </label>
              <select id="equipmentId" name="equipmentId" className="rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm">
                <option value="">Sin equipo específico</option>
                {equipmentOptions.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.products?.name ?? "Equipo"}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          <div className="flex flex-col gap-1">
            <label htmlFor="message" className="text-sm text-text-muted">
              Mensaje
            </label>
            <textarea id="message" name="message" rows={3} className="rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm" />
          </div>
          <button
            type="submit"
            className="self-start rounded-[var(--radius)] bg-brand px-4 py-2 text-sm font-semibold text-text-inverse transition-colors hover:bg-brand-hover"
          >
            Abrir ticket
          </button>
        </form>
      </section>

      {tickets.length === 0 ? (
        <p className="text-text-muted">Todavía no has abierto ningún ticket.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-border rounded-lg border border-border">
          {tickets.map((ticket) => (
            <li key={ticket.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
              <div>
                <Link href={`/mi-cuenta/tickets/${ticket.id}`} className="font-medium text-text hover:text-brand">
                  {ticket.subject}
                </Link>
                <p className="text-xs text-text-muted">
                  {ticket.ticket_number} · {new Date(ticket.created_at).toLocaleDateString("es-CO")}
                </p>
              </div>
              <span className="rounded-full border border-border px-3 py-1 text-xs font-medium text-text">
                {TICKET_STATUS_LABEL[ticket.status] ?? ticket.status}
              </span>
            </li>
          ))}
        </ul>
      )}

      <Link href="/mi-cuenta" className="text-sm text-brand hover:underline">
        Volver a mi cuenta
      </Link>
    </div>
  );
}
