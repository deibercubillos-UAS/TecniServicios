import type { SupabaseClient } from "@supabase/supabase-js";

export interface CompleteMaintenanceInput {
  requestId: string;
  workDone: string;
  recommendations?: string;
  nextServiceDate?: string;
}

export interface CompleteMaintenanceContext {
  technicianId: string;
}

export interface CompleteMaintenanceResult {
  reportId: string;
}

/**
 * El técnico asignado escribe el reporte al completar
 * (14-MODULE-SERVICE.md sección 4) y marca la solicitud `completed`.
 * `maintenance_reports_insert_tech` (05-RLS-SECURITY-C.md) ya exige
 * `technician_id = auth.uid()` **y** que sea el técnico asignado a esa
 * solicitud — esta función no repite esa validación. Adjuntos y firma
 * del cliente quedan sin capturar (sin R2 todavía).
 */
export async function completeMaintenance(
  client: SupabaseClient,
  input: CompleteMaintenanceInput,
  ctx: CompleteMaintenanceContext,
): Promise<CompleteMaintenanceResult> {
  const { data: report, error: reportError } = await client
    .from("maintenance_reports")
    .insert({
      request_id: input.requestId,
      technician_id: ctx.technicianId,
      work_done: input.workDone,
      recommendations: input.recommendations || null,
      next_service_date: input.nextServiceDate || null,
    })
    .select("id")
    .single();
  if (reportError || !report) {
    throw new Error("No se pudo registrar el reporte de mantenimiento.");
  }

  const { error: updateError } = await client
    .from("maintenance_requests")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", input.requestId);
  if (updateError) {
    throw new Error("El reporte se guardó, pero no se pudo marcar el mantenimiento como completado.");
  }

  return { reportId: report["id"] as string };
}
