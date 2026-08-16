import type { SupabaseClient } from "@supabase/supabase-js";

export interface SetMaintenanceIntervalResult {
  nextMaintenanceDueAt: string | null;
}

function addMonths(isoDate: string, months: number): string {
  const date = new Date(`${isoDate}T00:00:00.000Z`);
  date.setUTCMonth(date.getUTCMonth() + months);
  return date.toISOString().slice(0, 10);
}

/**
 * Solo master la llama (owned_equipment_write_master, 05-RLS-SECURITY-B.md)
 * — no repite esa validación acá. `next_maintenance_due_at` nunca se
 * edita a mano: se recalcula siempre desde `last_maintenance_completed_at`
 * (o `delivered_at` si el equipo aún no tiene ningún mantenimiento
 * completado) + el intervalo nuevo. Limpiar el intervalo (null) apaga
 * los recordatorios; cambiar el intervalo limpia
 * `maintenance_reminder_sent_for` para no bloquear el aviso del nuevo
 * plazo (docs/tasks/done/DONE-mantenimiento-preventivo-recordatorio.md).
 */
export async function setMaintenanceInterval(client: SupabaseClient, equipmentId: string, months: number | null): Promise<SetMaintenanceIntervalResult> {
  if (months !== null && (!Number.isInteger(months) || months <= 0)) {
    throw new Error("El intervalo debe ser un número entero de meses mayor a cero, o vacío para desactivarlo.");
  }

  const { data: equipment, error: fetchError } = await client
    .from("owned_equipment")
    .select("delivered_at,last_maintenance_completed_at")
    .eq("id", equipmentId)
    .maybeSingle();
  if (fetchError || !equipment) {
    throw new Error("Equipo no encontrado.");
  }

  const anchor = (equipment["last_maintenance_completed_at"] as string | null) ?? (equipment["delivered_at"] as string | null);
  const nextMaintenanceDueAt = months !== null && anchor ? addMonths(anchor, months) : null;

  const { error } = await client
    .from("owned_equipment")
    .update({
      maintenance_interval_months: months,
      next_maintenance_due_at: nextMaintenanceDueAt,
      maintenance_reminder_sent_for: null,
    })
    .eq("id", equipmentId);
  if (error) {
    throw new Error("No se pudo guardar el intervalo de mantenimiento.");
  }

  return { nextMaintenanceDueAt };
}
