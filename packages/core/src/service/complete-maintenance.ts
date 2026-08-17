import type { SupabaseClient } from "@supabase/supabase-js";

export interface CompleteMaintenanceInput {
  requestId: string;
  workDone: string;
  recommendations?: string;
  nextServiceDate?: string;
  /** URLs ya subidas a R2 (`buildMaintenanceAssetKey("photos", ...)`) —
   * esta función nunca sube archivos, solo persiste URLs que la Server
   * Action ya confirmó que existen en el bucket. */
  attachments?: string[];
  /** URL ya subida a R2 de la firma de conformidad (`buildMaintenanceAssetKey
   * ("signature", ...)`) — obligatoria en la UI (ver
   * `completeMaintenanceAction`), pero opcional acá para no romper si algún
   * día se llama desde otro flujo sin firma. */
  customerSignatureUrl?: string;
}

export interface CompleteMaintenanceContext {
  technicianId: string;
}

export interface CompleteMaintenanceResult {
  reportId: string;
}

function addMonths(isoDate: string, months: number): string {
  const date = new Date(`${isoDate}T00:00:00.000Z`);
  date.setUTCMonth(date.getUTCMonth() + months);
  return date.toISOString().slice(0, 10);
}

/**
 * El técnico asignado escribe el reporte al completar
 * (14-MODULE-SERVICE.md sección 4) y marca la solicitud `completed`.
 * `maintenance_reports_insert_tech` (05-RLS-SECURITY-C.md) ya exige
 * `technician_id = auth.uid()` **y** que sea el técnico asignado a esa
 * solicitud — esta función no repite esa validación. Fotos de evidencia
 * y firma de conformidad del cliente ya se capturan (R2 conectado, ver
 * `completeMaintenanceAction`).
 *
 * Si el equipo tiene `maintenance_interval_months` configurado, este
 * mantenimiento completado reinicia el ciclo:
 * `last_maintenance_completed_at` pasa a hoy y `next_maintenance_due_at`
 * se recalcula desde ahí (docs/tasks/done/DONE-mantenimiento-preventivo-
 * recordatorio.md). Se limpia también `maintenance_reminder_sent_for`
 * para permitir el próximo aviso del nuevo ciclo.
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
      attachments: input.attachments && input.attachments.length > 0 ? input.attachments : null,
      customer_signature_r2_key: input.customerSignatureUrl || null,
    })
    .select("id")
    .single();
  if (reportError || !report) {
    throw new Error("No se pudo registrar el reporte de mantenimiento.");
  }

  const completedAt = new Date().toISOString();

  const { error: updateError } = await client.from("maintenance_requests").update({ status: "completed", completed_at: completedAt }).eq("id", input.requestId);
  if (updateError) {
    throw new Error("El reporte se guardó, pero no se pudo marcar el mantenimiento como completado.");
  }

  const { data: request } = await client.from("maintenance_requests").select("equipment_id").eq("id", input.requestId).maybeSingle();
  const equipmentId = request?.["equipment_id"] as string | undefined;
  if (equipmentId) {
    const { data: equipment } = await client.from("owned_equipment").select("maintenance_interval_months").eq("id", equipmentId).maybeSingle();
    const intervalMonths = equipment?.["maintenance_interval_months"] as number | null | undefined;
    if (intervalMonths) {
      const completedDate = completedAt.slice(0, 10);
      await client
        .from("owned_equipment")
        .update({
          last_maintenance_completed_at: completedDate,
          next_maintenance_due_at: addMonths(completedDate, intervalMonths),
          maintenance_reminder_sent_for: null,
        })
        .eq("id", equipmentId);
    }
  }

  return { reportId: report["id"] as string };
}
