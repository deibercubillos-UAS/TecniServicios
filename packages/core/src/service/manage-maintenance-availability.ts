import type { SupabaseClient } from "@supabase/supabase-js";

import { recordAuditLog } from "../audit/record-audit-log";

export interface CreateMaintenanceAvailabilityInput {
  availableDate: string;
  maxVisits: number;
  notes?: string;
  technicianId?: string;
  city?: string;
}

export interface CreateMaintenanceAvailabilityContext {
  actorId: string;
}

export interface CreateMaintenanceAvailabilityResult {
  id: string;
  availableDate: string;
}

/**
 * Abre un día (con técnico y ciudad opcionales) para agendar
 * mantenimiento (docs/tasks/ACTIVE-disponibilidad-mantenimiento.md) —
 * `maintenance_availability_write_master` (05-RLS-SECURITY-C.md) ya
 * limita el insert a `master`, esta función no repite esa validación,
 * confía en RLS. Mismo patrón de dos clientes que `markOrderDelivered`:
 * `client` (sesión de master) hace el insert real; `serviceClient` solo
 * escribe `audit_log`, que no acepta insert de `authenticated`
 * (05-RLS-SECURITY-B.md sección 9).
 *
 * Una fecha puede tener varias filas (una por técnico) desde que se
 * agregó la generación masiva — `maintenance_availability_date_technician_
 * uidx` es la única fuente de verdad de duplicados (fecha+técnico ya
 * abierto): si el insert la viola, el mensaje lo refleja.
 */
export async function createMaintenanceAvailability(
  client: SupabaseClient,
  serviceClient: SupabaseClient,
  input: CreateMaintenanceAvailabilityInput,
  ctx: CreateMaintenanceAvailabilityContext,
): Promise<CreateMaintenanceAvailabilityResult> {
  if (input.maxVisits <= 0) {
    throw new Error("El cupo debe ser mayor a cero.");
  }

  const { data, error } = await client
    .from("maintenance_availability")
    .insert({
      available_date: input.availableDate,
      max_visits: input.maxVisits,
      notes: input.notes || null,
      technician_id: input.technicianId || null,
      city: input.city || null,
      created_by: ctx.actorId,
    })
    .select("id,available_date")
    .single();
  if (error || !data) {
    throw new Error("No se pudo abrir la fecha — puede que ese técnico ya esté abierto ese día.");
  }

  await recordAuditLog(serviceClient, {
    actorId: ctx.actorId,
    action: "maintenance_availability.created",
    entity: "maintenance_availability",
    entityId: data["id"] as string,
    after: { available_date: input.availableDate, max_visits: input.maxVisits, technician_id: input.technicianId ?? null, city: input.city ?? null },
  });

  return { id: data["id"] as string, availableDate: data["available_date"] as string };
}

export interface DeleteMaintenanceAvailabilityContext {
  actorId: string;
}

/** Cierra una fila abierta (fecha + técnico) — falla si esa fecha ya
 * tiene solicitudes agendadas: como el cupo se reparte a nivel de día
 * entre todas las filas de esa fecha, no hay forma de saber cuál fila
 * específica cubrió cuál solicitud, así que se bloquea el cierre de
 * cualquier fila de una fecha con solicitudes (mismo criterio que antes
 * de la generación masiva). */
export async function deleteMaintenanceAvailability(
  client: SupabaseClient,
  serviceClient: SupabaseClient,
  id: string,
  ctx: DeleteMaintenanceAvailabilityContext,
): Promise<void> {
  const { data: row } = await client.from("maintenance_availability").select("available_date").eq("id", id).maybeSingle();
  if (!row) {
    throw new Error("Esa disponibilidad ya no existe.");
  }
  const availableDate = row["available_date"] as string;

  const { count } = await client
    .from("maintenance_requests")
    .select("id", { count: "exact", head: true })
    .eq("preferred_date", availableDate);
  if ((count ?? 0) > 0) {
    throw new Error("No se puede cerrar: ya hay solicitudes agendadas ese día.");
  }

  const { error } = await client.from("maintenance_availability").delete().eq("id", id);
  if (error) {
    throw new Error("No se pudo cerrar la fecha.");
  }

  await recordAuditLog(serviceClient, {
    actorId: ctx.actorId,
    action: "maintenance_availability.deleted",
    entity: "maintenance_availability",
    entityId: id,
  });
}
