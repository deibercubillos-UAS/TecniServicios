import type { SupabaseClient } from "@supabase/supabase-js";

export interface UpdateMaintenanceStatusResult {
  requestId: string;
}

/**
 * El técnico asignado confirma la solicitud (14-MODULE-SERVICE.md
 * sección 4) — `maintenance_update_tech` (05-RLS-SECURITY-C.md) ya
 * limita esto a `technician_id = auth.uid()` o `master`.
 */
export async function confirmMaintenance(client: SupabaseClient, requestId: string): Promise<UpdateMaintenanceStatusResult> {
  const { data, error } = await client
    .from("maintenance_requests")
    .update({ status: "confirmed", confirmed_at: new Date().toISOString() })
    .eq("id", requestId)
    .select("id")
    .single();
  if (error || !data) {
    throw new Error("No se pudo confirmar el mantenimiento.");
  }
  return { requestId: data["id"] as string };
}

/** Reprograma la solicitud a una nueva fecha/hora. */
export async function rescheduleMaintenance(
  client: SupabaseClient,
  requestId: string,
  scheduledAt: string,
): Promise<UpdateMaintenanceStatusResult> {
  const { data, error } = await client
    .from("maintenance_requests")
    .update({ status: "rescheduled", scheduled_at: scheduledAt })
    .eq("id", requestId)
    .select("id")
    .single();
  if (error || !data) {
    throw new Error("No se pudo reprogramar el mantenimiento.");
  }
  return { requestId: data["id"] as string };
}
