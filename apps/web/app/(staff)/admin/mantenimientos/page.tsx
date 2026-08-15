import type { Metadata } from "next";
import { cookies } from "next/headers";
import { createServerClient } from "@tecni/db";
import { serverEnv } from "@tecni/shared";
import { Icon } from "@tecni/ui";

import { StatusBadge } from "@/components/status-badge";
import { createMaintenanceAvailabilityAction, deleteMaintenanceAvailabilityAction } from "./actions";

export const metadata: Metadata = {
  title: "Disponibilidad de mantenimiento — Panel maestro",
};

interface AvailabilityRow {
  available_date: string;
  max_visits: number;
  notes: string | null;
  technician_id: string | null;
  city: string | null;
}

interface TechnicianRow {
  id: string;
  full_name: string | null;
}

async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(serverEnv.NEXT_PUBLIC_SUPABASE_URL, serverEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    getAll: () => cookieStore.getAll(),
    setAll: () => {},
  });
}

export default async function AdminMantenimientosPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; created?: string; deleted?: string }>;
}) {
  const { error, created, deleted } = await searchParams;
  const supabase = await getSupabase();

  // Middleware ya exige master en /admin. `maintenance_availability_read`
  // deja leer a cualquier autenticado, pero esta pantalla de administrar
  // (crear/borrar) solo la usa master (RLS de escritura ya lo exige).
  const { data: availabilityData } = await supabase
    .from("maintenance_availability")
    .select("available_date,max_visits,notes,technician_id,city")
    .order("available_date", { ascending: true });
  const availability = (availabilityData as AvailabilityRow[] | null) ?? [];

  const { data: techniciansData } = await supabase.from("profiles").select("id,full_name").eq("role", "technician").eq("is_active", true).order("full_name");
  const technicians = (techniciansData as TechnicianRow[] | null) ?? [];
  const technicianNameById = new Map(technicians.map((t) => [t.id, t.full_name ?? "(sin nombre)"]));

  const dates = availability.map((a) => a.available_date);
  const { data: requestsData } =
    dates.length > 0
      ? await supabase.from("maintenance_requests").select("preferred_date").in("preferred_date", dates).neq("status", "cancelled")
      : { data: [] as { preferred_date: string }[] };
  const bookedByDate = new Map<string, number>();
  for (const row of (requestsData as { preferred_date: string }[] | null) ?? []) {
    bookedByDate.set(row.preferred_date, (bookedByDate.get(row.preferred_date) ?? 0) + 1);
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="mx-auto flex max-w-[800px] flex-col gap-6 px-4 py-12 sm:py-16">
      <div>
        <h1 className="text-2xl font-bold text-text">Disponibilidad de mantenimiento</h1>
        <p className="text-sm text-text-muted">Abre las fechas en las que el equipo técnico puede atender visitas.</p>
      </div>

      {created ? (
        <p className="flex items-center gap-2 rounded-[var(--radius)] border border-success bg-success/10 px-3 py-2 text-sm text-success">
          <Icon name="checkCircle" size={16} />
          Fecha abierta.
        </p>
      ) : null}
      {deleted ? (
        <p className="flex items-center gap-2 rounded-[var(--radius)] border border-success bg-success/10 px-3 py-2 text-sm text-success">
          <Icon name="checkCircle" size={16} />
          Fecha cerrada.
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="flex items-center gap-2 rounded-[var(--radius)] border border-danger bg-danger/10 px-3 py-2 text-sm text-danger">
          <Icon name="close" size={16} />
          {error}
        </p>
      ) : null}

      <section className="rounded-xl border border-border bg-surface p-5">
        <h2 className="mb-4 flex items-center gap-2 font-bold text-text">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-subtle text-brand">
            <Icon name="clock" size={16} />
          </span>
          Abrir una fecha
        </h2>
        <form action={createMaintenanceAvailabilityAction} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label htmlFor="availableDate" className="text-sm font-medium text-text-muted">
                Fecha
              </label>
              <input
                id="availableDate"
                name="availableDate"
                type="date"
                required
                min={today}
                className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="maxVisits" className="text-sm font-medium text-text-muted">
                Cupo (visitas ese día)
              </label>
              <input
                id="maxVisits"
                name="maxVisits"
                type="number"
                min={1}
                defaultValue={1}
                required
                className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label htmlFor="technicianId" className="text-sm font-medium text-text-muted">
                Técnico (opcional)
              </label>
              <select
                id="technicianId"
                name="technicianId"
                className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
              >
                <option value="">Sin asignar todavía</option>
                {technicians.map((tech) => (
                  <option key={tech.id} value={tech.id}>
                    {tech.full_name ?? "(sin nombre)"}
                  </option>
                ))}
              </select>
              {technicians.length === 0 ? (
                <p className="text-xs text-text-muted">No hay técnicos activos registrados todavía.</p>
              ) : null}
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="city" className="text-sm font-medium text-text-muted">
                Ciudad de cobertura (opcional)
              </label>
              <input
                id="city"
                name="city"
                placeholder="ej. Bogotá"
                className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="notes" className="text-sm font-medium text-text-muted">
              Notas (opcional)
            </label>
            <input
              id="notes"
              name="notes"
              className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="flex w-fit items-center gap-2 rounded-[var(--radius)] bg-brand px-5 py-2.5 text-sm font-semibold text-text-inverse transition-colors hover:bg-brand-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            Abrir fecha
          </button>
        </form>
      </section>

      {availability.length === 0 ? (
        <p className="text-sm text-text-muted">No hay fechas abiertas todavía.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {availability.map((item) => {
            const booked = bookedByDate.get(item.available_date) ?? 0;
            const full = booked >= item.max_visits;
            return (
              <li
                key={item.available_date}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface p-4"
              >
                <div>
                  <p className="font-semibold text-text">{new Date(`${item.available_date}T00:00:00`).toLocaleDateString("es-CO", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
                  <p className="text-xs text-text-muted">
                    {item.technician_id ? (technicianNameById.get(item.technician_id) ?? "Técnico eliminado") : "Sin técnico asignado"}
                    {item.city ? ` · ${item.city}` : ""}
                  </p>
                  {item.notes ? <p className="text-xs text-text-muted">{item.notes}</p> : null}
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge
                    label={`${booked} de ${item.max_visits} cupos`}
                    tone={full ? "danger" : "success"}
                    icon={full ? "close" : "checkCircle"}
                  />
                  <form action={deleteMaintenanceAvailabilityAction}>
                    <input type="hidden" name="availableDate" value={item.available_date} />
                    <button
                      type="submit"
                      aria-label={`Cerrar ${item.available_date}`}
                      className="flex h-9 w-9 items-center justify-center rounded-[var(--radius)] text-text-muted transition-colors hover:bg-danger/10 hover:text-danger focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-danger"
                    >
                      <Icon name="close" size={16} />
                    </button>
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
