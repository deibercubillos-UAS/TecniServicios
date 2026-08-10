import type { SupabaseClient } from "@supabase/supabase-js";

export interface RequestMaintenanceInput {
  equipmentId: string;
  preferredDate?: string;
  description?: string;
}

export interface RequestMaintenanceContext {
  companyId: string;
  userId: string;
}

export interface RequestMaintenanceResult {
  requestId: string;
}

/**
 * El cliente agenda mantenimiento sobre un equipo propio
 * (14-MODULE-SERVICE.md sección 4) — `status = 'requested'` (default
 * del esquema), sin técnico asignado todavía (lo asigna vendedor/master
 * por separado). `maintenance_insert_owner` (05-RLS-SECURITY-C.md) ya
 * valida en el `with check` que el equipo sea de la propia empresa —
 * esta función no repite esa validación, confía en RLS.
 *
 * `preferredDate`, si viene, debe ser una fecha que master abrió en
 * `maintenance_availability` y que todavía tenga cupo — se valida acá,
 * server-side, en vez de confiar en que el `<select>` del cliente ya
 * restringió las opciones (docs/tasks/ACTIVE-disponibilidad-
 * mantenimiento.md).
 */
export async function requestMaintenance(
  client: SupabaseClient,
  input: RequestMaintenanceInput,
  ctx: RequestMaintenanceContext,
): Promise<RequestMaintenanceResult> {
  if (input.preferredDate) {
    const { data: availability } = await client
      .from("maintenance_availability")
      .select("max_visits")
      .eq("available_date", input.preferredDate)
      .maybeSingle();
    if (!availability) {
      throw new Error("Esa fecha no está disponible para agendar.");
    }
    const { count: bookedCount } = await client
      .from("maintenance_requests")
      .select("id", { count: "exact", head: true })
      .eq("preferred_date", input.preferredDate)
      .neq("status", "cancelled");
    if ((bookedCount ?? 0) >= (availability["max_visits"] as number)) {
      throw new Error("Esa fecha ya no tiene cupo disponible.");
    }
  }

  const { data: request, error } = await client
    .from("maintenance_requests")
    .insert({
      company_id: ctx.companyId,
      equipment_id: input.equipmentId,
      requested_by: ctx.userId,
      preferred_date: input.preferredDate || null,
      description: input.description || null,
    })
    .select("id")
    .single();
  if (error || !request) {
    throw new Error("No se pudo solicitar el mantenimiento.");
  }

  return { requestId: request["id"] as string };
}
