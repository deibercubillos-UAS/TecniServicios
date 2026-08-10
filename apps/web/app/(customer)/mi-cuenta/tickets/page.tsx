import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@tecni/db";
import { serverEnv } from "@tecni/shared";
import { Icon } from "@tecni/ui";

import { StatusBadge } from "@/components/status-badge";
import { getAvailableMaintenanceDates } from "@/lib/get-available-maintenance-dates";
import { TICKET_STATUS_LABEL, TICKET_STATUS_TONE } from "@/lib/ticket-status";
import { requestMaintenanceAction } from "../mantenimientos/actions";
import { openTicketAction } from "./actions";

export const metadata: Metadata = {
  title: "Soporte — Tecni Equipos y Servicios SAS",
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

export default async function TicketsPage({ searchParams }: { searchParams: Promise<{ error?: string; equipmentId?: string }> }) {
  const { error, equipmentId } = await searchParams;
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
        <h1 className="mb-4 text-2xl font-bold text-text">Soporte</h1>
        <p className="text-text-muted">Tu cuenta todavía no está asociada a una empresa.</p>
      </div>
    );
  }

  const { data: equipmentData } = await supabase.from("owned_equipment").select("id,products(name)").eq("is_active", true);
  const equipmentOptions = (equipmentData as unknown as EquipmentOption[] | null) ?? [];
  const availableDates = await getAvailableMaintenanceDates(supabase);

  const { data: ticketsData } = await supabase
    .from("support_tickets")
    .select("id,ticket_number,subject,status,created_at")
    .order("created_at", { ascending: false });
  const tickets = (ticketsData as TicketRow[] | null) ?? [];

  return (
    <div className="mx-auto flex max-w-[900px] flex-col gap-6 px-4 py-12 sm:py-16">
      <div>
        <h1 className="text-2xl font-bold text-text">Soporte</h1>
        <p className="text-sm text-text-muted">Abre un ticket o programa una visita técnica.</p>
      </div>

      {error ? (
        <p role="alert" className="flex items-center gap-2 rounded-[var(--radius)] border border-danger bg-danger/10 px-3 py-2 text-sm text-danger">
          <Icon name="close" size={16} />
          {error}
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-surface p-5">
          <h2 className="mb-4 flex items-center gap-2 font-bold text-text">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-subtle text-brand">
              <Icon name="chat" size={16} />
            </span>
            Abrir un ticket
          </h2>
          <form action={openTicketAction} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label htmlFor="subject" className="text-sm font-medium text-text-muted">
                Asunto
              </label>
              <input
                id="subject"
                name="subject"
                required
                className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
              />
            </div>
            {equipmentOptions.length > 0 ? (
              <div className="flex flex-col gap-1">
                <label htmlFor="equipmentId" className="text-sm font-medium text-text-muted">
                  Equipo (opcional)
                </label>
                <select
                  id="equipmentId"
                  name="equipmentId"
                  defaultValue={equipmentId ?? ""}
                  className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
                >
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
              <label htmlFor="message" className="text-sm font-medium text-text-muted">
                Mensaje
              </label>
              <textarea
                id="message"
                name="message"
                rows={3}
                className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="flex w-fit items-center gap-2 rounded-[var(--radius)] bg-brand px-5 py-2.5 text-sm font-semibold text-text-inverse transition-colors hover:bg-brand-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              <Icon name="chat" size={16} />
              Abrir ticket
            </button>
          </form>
        </section>

        {equipmentOptions.length > 0 ? (
          <section className="rounded-xl border border-border bg-surface p-5">
            <h2 className="mb-4 flex items-center gap-2 font-bold text-text">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-subtle text-brand">
                <Icon name="wrench" size={16} />
              </span>
              Programar visita de mantenimiento
            </h2>
            <form action={requestMaintenanceAction} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label htmlFor="maintenanceEquipmentId" className="text-sm font-medium text-text-muted">
                  Equipo
                </label>
                <select
                  id="maintenanceEquipmentId"
                  name="equipmentId"
                  required
                  defaultValue={equipmentId ?? ""}
                  className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
                >
                  {equipmentOptions.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.products?.name ?? "Equipo"}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="maintenancePreferredDate" className="text-sm font-medium text-text-muted">
                  Fecha preferida
                </label>
                {availableDates.length > 0 ? (
                  <select
                    id="maintenancePreferredDate"
                    name="preferredDate"
                    className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
                  >
                    <option value="">Sin preferencia — Tecni propone una fecha</option>
                    {availableDates.map((d) => (
                      <option key={d.date} value={d.date}>
                        {new Date(`${d.date}T00:00:00`).toLocaleDateString("es-CO", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}{" "}
                        ({d.remaining} cupo{d.remaining === 1 ? "" : "s"})
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="rounded-[var(--radius)] border border-border bg-bg-alt px-3 py-2.5 text-sm text-text-muted">
                    No hay fechas abiertas por ahora — te contactaremos para coordinar una.
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="maintenanceDescription" className="text-sm font-medium text-text-muted">
                  Descripción del problema
                </label>
                <textarea
                  id="maintenanceDescription"
                  name="description"
                  rows={3}
                  className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="flex w-fit items-center gap-2 rounded-[var(--radius)] bg-brand px-5 py-2.5 text-sm font-semibold text-text-inverse transition-colors hover:bg-brand-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                <Icon name="wrench" size={16} />
                Agendar mantenimiento
              </button>
              <p className="text-xs text-text-muted">Verás el estado de tu solicitud en Mantenimientos.</p>
            </form>
          </section>
        ) : null}
      </div>

      {tickets.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-bg-alt px-6 py-12 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-subtle text-brand">
            <Icon name="chat" size={26} />
          </span>
          <p className="font-semibold text-text">Todavía no has abierto ningún ticket</p>
        </div>
      ) : (
        <section className="flex flex-col gap-3">
          <h2 className="font-bold text-text">Mis tickets</h2>
          <ul className="flex flex-col gap-3">
            {tickets.map((ticket) => {
              const tone = TICKET_STATUS_TONE[ticket.status] ?? { tone: "muted" as const, icon: "chat" as const };
              return (
                <li key={ticket.id}>
                  <Link
                    href={`/mi-cuenta/tickets/${ticket.id}`}
                    className="group flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface p-4 transition-all duration-150 hover:-translate-y-0.5 hover:border-brand hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-subtle text-brand">
                        <Icon name="chat" size={18} />
                      </span>
                      <div>
                        <span className="font-semibold text-text group-hover:text-brand">{ticket.subject}</span>
                        <p className="text-xs text-text-muted">
                          {ticket.ticket_number} · {new Date(ticket.created_at).toLocaleDateString("es-CO")}
                        </p>
                      </div>
                    </div>
                    <StatusBadge label={TICKET_STATUS_LABEL[ticket.status] ?? ticket.status} tone={tone.tone} icon={tone.icon} />
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
