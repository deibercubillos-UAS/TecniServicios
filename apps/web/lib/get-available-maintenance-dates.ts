import type { createServerClient } from "@tecni/db";

type SupabaseClient = ReturnType<typeof createServerClient>;

export interface AvailableMaintenanceDate {
  date: string;
  remaining: number;
}

/**
 * Fechas que master abrió en `maintenance_availability` y todavía tienen
 * cupo — usado por los formularios de "Programar mantenimiento" en
 * `/mi-cuenta/mantenimientos` y `/mi-cuenta/tickets` (docs/tasks/ACTIVE-
 * disponibilidad-mantenimiento.md). Solo fechas de hoy en adelante.
 */
export async function getAvailableMaintenanceDates(client: SupabaseClient): Promise<AvailableMaintenanceDate[]> {
  const today = new Date().toISOString().slice(0, 10);

  const { data: availabilityData } = await client
    .from("maintenance_availability")
    .select("available_date,max_visits")
    .gte("available_date", today)
    .order("available_date", { ascending: true });
  const availability = (availabilityData as { available_date: string; max_visits: number }[] | null) ?? [];
  if (availability.length === 0) return [];

  const dates = availability.map((a) => a.available_date);
  const { data: requestsData } = await client
    .from("maintenance_requests")
    .select("preferred_date")
    .in("preferred_date", dates)
    .neq("status", "cancelled");
  const bookedByDate = new Map<string, number>();
  for (const row of (requestsData as { preferred_date: string }[] | null) ?? []) {
    bookedByDate.set(row.preferred_date, (bookedByDate.get(row.preferred_date) ?? 0) + 1);
  }

  return availability
    .map((a) => ({ date: a.available_date, remaining: a.max_visits - (bookedByDate.get(a.available_date) ?? 0) }))
    .filter((a) => a.remaining > 0);
}
