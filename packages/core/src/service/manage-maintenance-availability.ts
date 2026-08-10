import type { SupabaseClient } from "@supabase/supabase-js";

import { recordAuditLog } from "../audit/record-audit-log";

export interface CreateMaintenanceAvailabilityInput {
  availableDate: string;
  maxVisits: number;
  notes?: string;
}

export interface CreateMaintenanceAvailabilityContext {
  actorId: string;
}

export interface CreateMaintenanceAvailabilityResult {
  availableDate: string;
}

/**
 * Abre un día para agendar mantenimiento (docs/tasks/ACTIVE-disponibilidad-
 * mantenimiento.md) — `maintenance_availability_write_master` (05-RLS-
 * SECURITY-C.md) ya limita el insert a `master`, esta función no repite
 * esa validación, confía en RLS. Mismo patrón de dos clientes que
 * `markOrderDelivered`: `client` (sesión de master) hace el insert real;
 * `serviceClient` solo escribe `audit_log`, que no acepta insert de
 * `authenticated` (05-RLS-SECURITY-B.md sección 9).
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
      created_by: ctx.actorId,
    })
    .select("available_date")
    .single();
  if (error || !data) {
    throw new Error("No se pudo abrir la fecha — puede que ya exista.");
  }

  await recordAuditLog(serviceClient, {
    actorId: ctx.actorId,
    action: "maintenance_availability.created",
    entity: "maintenance_availability",
    entityId: input.availableDate,
    after: { available_date: input.availableDate, max_visits: input.maxVisits },
  });

  return { availableDate: data["available_date"] as string };
}

export interface DeleteMaintenanceAvailabilityContext {
  actorId: string;
}

/** Cierra un día abierto — falla si ya tiene solicitudes (`ON DELETE` no
 * está definido para arrastrar cascada, mejor bloquear en la app con un
 * mensaje claro que dejar un error crudo de FK). */
export async function deleteMaintenanceAvailability(
  client: SupabaseClient,
  serviceClient: SupabaseClient,
  availableDate: string,
  ctx: DeleteMaintenanceAvailabilityContext,
): Promise<void> {
  const { count } = await client
    .from("maintenance_requests")
    .select("id", { count: "exact", head: true })
    .eq("preferred_date", availableDate);
  if ((count ?? 0) > 0) {
    throw new Error("No se puede cerrar: ya hay solicitudes agendadas ese día.");
  }

  const { error } = await client.from("maintenance_availability").delete().eq("available_date", availableDate);
  if (error) {
    throw new Error("No se pudo cerrar la fecha.");
  }

  await recordAuditLog(serviceClient, {
    actorId: ctx.actorId,
    action: "maintenance_availability.deleted",
    entity: "maintenance_availability",
    entityId: availableDate,
  });
}
