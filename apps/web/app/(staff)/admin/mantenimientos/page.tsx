import type { Metadata } from "next";
import { cookies } from "next/headers";
import { createServerClient } from "@tecni/db";
import { serverEnv } from "@tecni/shared";
import { Icon } from "@tecni/ui";

import { DepartmentCityField } from "@/components/department-city-field";
import { SubmitButton } from "@/components/submit-button";
import { StatusBadge } from "@/components/status-badge";
import { createMaintenanceAvailabilityAction, createMaintenanceAvailabilityBulkAction, deleteMaintenanceAvailabilityAction } from "./actions";

export const metadata: Metadata = {
  title: "Disponibilidad de mantenimiento — Panel maestro",
};

interface AvailabilityRow {
  id: string;
  available_date: string;
  max_visits: number;
  notes: string | null;
  technician_id: string | null;
  department: string | null;
  city: string | null;
}

interface TechnicianRow {
  id: string;
  full_name: string | null;
}

const WEEKDAYS = [
  { value: "mon", label: "L" },
  { value: "tue", label: "M" },
  { value: "wed", label: "X" },
  { value: "thu", label: "J" },
  { value: "fri", label: "V" },
  { value: "sat", label: "S" },
  { value: "sun", label: "D" },
] as const;

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
  searchParams: Promise<{ error?: string; created?: string; deleted?: string; bulkCreated?: string; bulkSkipped?: string }>;
}) {
  const { error, created, deleted, bulkCreated, bulkSkipped } = await searchParams;
  const supabase = await getSupabase();

  // Middleware ya exige master en /admin. `maintenance_availability_read`
  // deja leer a cualquier autenticado, pero esta pantalla de administrar
  // (crear/borrar) solo la usa master (RLS de escritura ya lo exige).
  const { data: availabilityData } = await supabase
    .from("maintenance_availability")
    .select("id,available_date,max_visits,notes,technician_id,department,city")
    .order("available_date", { ascending: true });
  const availability = (availabilityData as AvailabilityRow[] | null) ?? [];

  const { data: techniciansData } = await supabase.from("profiles").select("id,full_name").eq("role", "technician").eq("is_active", true).order("full_name");
  const technicians = (techniciansData as TechnicianRow[] | null) ?? [];
  const technicianNameById = new Map(technicians.map((t) => [t.id, t.full_name ?? "(sin nombre)"]));

  const dates = [...new Set(availability.map((a) => a.available_date))];
  const { data: requestsData } =
    dates.length > 0
      ? await supabase.from("maintenance_requests").select("preferred_date").in("preferred_date", dates).neq("status", "cancelled")
      : { data: [] as { preferred_date: string }[] };
  const bookedByDate = new Map<string, number>();
  for (const row of (requestsData as { preferred_date: string }[] | null) ?? []) {
    bookedByDate.set(row.preferred_date, (bookedByDate.get(row.preferred_date) ?? 0) + 1);
  }

  const rowsByDate = new Map<string, AvailabilityRow[]>();
  for (const row of availability) {
    const list = rowsByDate.get(row.available_date) ?? [];
    list.push(row);
    rowsByDate.set(row.available_date, list);
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
      {bulkCreated ? (
        <p className="flex items-center gap-2 rounded-[var(--radius)] border border-success bg-success/10 px-3 py-2 text-sm text-success">
          <Icon name="checkCircle" size={16} />
          {bulkCreated} disponibilidad{bulkCreated === "1" ? "" : "es"} creada{bulkCreated === "1" ? "" : "s"}.
          {bulkSkipped && bulkSkipped !== "0" ? ` ${bulkSkipped} ya existían y se saltaron.` : ""}
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

          <DepartmentCityField idPrefix="single" />

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
          <SubmitButton
            pendingLabel="Abriendo…"
            className="flex w-fit items-center gap-2 rounded-[var(--radius)] bg-brand px-5 py-2.5 text-sm font-semibold text-text-inverse transition-colors hover:bg-brand-hover disabled:cursor-wait disabled:opacity-70"
          >
            Abrir fecha
          </SubmitButton>
        </form>
      </section>

      <section className="rounded-xl border border-border bg-surface p-5">
        <h2 className="mb-1 flex items-center gap-2 font-bold text-text">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-subtle text-brand">
            <Icon name="sliders" size={16} />
          </span>
          Abrir varias fechas a la vez
        </h2>
        <p className="mb-4 text-sm text-text-muted">
          Genera disponibilidad para un rango de días, uno o varios técnicos y una ciudad, en un solo paso — útil para abrir toda una semana o un
          mes de una vez.
        </p>
        <form action={createMaintenanceAvailabilityBulkAction} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label htmlFor="startDate" className="text-sm font-medium text-text-muted">
                Desde
              </label>
              <input
                id="startDate"
                name="startDate"
                type="date"
                required
                min={today}
                className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="endDate" className="text-sm font-medium text-text-muted">
                Hasta
              </label>
              <input
                id="endDate"
                name="endDate"
                type="date"
                required
                min={today}
                className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-text-muted">Días de la semana</span>
            <div className="flex flex-wrap gap-3">
              {WEEKDAYS.map((day) => (
                <label key={day.value} className="flex items-center gap-1.5 text-sm text-text">
                  <input
                    type="checkbox"
                    name="weekdays"
                    value={day.value}
                    defaultChecked={day.value !== "sat" && day.value !== "sun"}
                  />
                  {day.label}
                </label>
              ))}
            </div>
            <p className="text-xs text-text-muted">Marca solo los días que quieres abrir dentro del rango — de lunes a viernes por defecto.</p>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-text-muted">Técnicos</span>
            {technicians.length === 0 ? (
              <p className="text-sm text-text-muted">No hay técnicos activos registrados todavía — no se puede generar en lote sin al menos uno.</p>
            ) : (
              <div className="flex flex-col gap-1.5 rounded-[var(--radius)] border border-border p-3">
                {technicians.map((tech) => (
                  <label key={tech.id} className="flex items-center gap-2 text-sm text-text">
                    <input type="checkbox" name="technicianIds" value={tech.id} />
                    {tech.full_name ?? "(sin nombre)"}
                  </label>
                ))}
              </div>
            )}
            <p className="text-xs text-text-muted">Se crea una fila por cada combinación de fecha × técnico elegido.</p>
          </div>

          <DepartmentCityField idPrefix="bulk" />

          <div className="flex flex-col gap-1">
            <label htmlFor="bulkMaxVisits" className="text-sm font-medium text-text-muted">
              Cupo por técnico y día
            </label>
            <input
              id="bulkMaxVisits"
              name="bulkMaxVisits"
              type="number"
              min={1}
              defaultValue={1}
              required
              className="max-w-[200px] rounded-[var(--radius)] border border-border bg-bg px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="bulkNotes" className="text-sm font-medium text-text-muted">
              Notas (opcional, se aplica a todas las que genere este lote)
            </label>
            <input
              id="bulkNotes"
              name="bulkNotes"
              className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
            />
          </div>

          <SubmitButton
            pendingLabel="Generando…"
            disabled={technicians.length === 0}
            className="flex w-fit items-center gap-2 rounded-[var(--radius)] bg-brand px-5 py-2.5 text-sm font-semibold text-text-inverse transition-colors hover:bg-brand-hover disabled:cursor-wait disabled:opacity-50"
          >
            Generar fechas
          </SubmitButton>
        </form>
      </section>

      {rowsByDate.size === 0 ? (
        <p className="text-sm text-text-muted">No hay fechas abiertas todavía.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {[...rowsByDate.entries()].map(([date, rows]) => {
            const booked = bookedByDate.get(date) ?? 0;
            const totalMaxVisits = rows.reduce((sum, row) => sum + row.max_visits, 0);
            const full = booked >= totalMaxVisits;
            return (
              <li key={date} className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-semibold text-text">
                    {new Date(`${date}T00:00:00`).toLocaleDateString("es-CO", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                  </p>
                  <StatusBadge
                    label={`${booked} de ${totalMaxVisits} cupos`}
                    tone={full ? "danger" : "success"}
                    icon={full ? "close" : "checkCircle"}
                  />
                </div>
                <ul className="flex flex-col divide-y divide-border">
                  {rows.map((item) => (
                    <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-2 first:pt-0 last:pb-0">
                      <div className="min-w-0">
                        <p className="text-sm text-text">
                          {item.technician_id ? (technicianNameById.get(item.technician_id) ?? "Técnico eliminado") : "Sin técnico asignado"}
                          {item.city ? ` · ${item.city}${item.department ? `, ${item.department}` : ""}` : ""} · {item.max_visits} cupo
                          {item.max_visits === 1 ? "" : "s"}
                        </p>
                        {item.notes ? <p className="text-xs text-text-muted">{item.notes}</p> : null}
                      </div>
                      <form action={deleteMaintenanceAvailabilityAction}>
                        <input type="hidden" name="id" value={item.id} />
                        <button
                          type="submit"
                          aria-label={`Cerrar disponibilidad de ${date}`}
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius)] text-text-muted transition-colors hover:bg-danger/10 hover:text-danger focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-danger"
                        >
                          <Icon name="close" size={14} />
                        </button>
                      </form>
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
