import type { createServerClient } from "@tecni/db";

type SupabaseClient = ReturnType<typeof createServerClient>;

export interface MaintenanceHistoryEntry {
  id: string;
  requestId: string;
  workDone: string;
  recommendations: string | null;
  nextServiceDate: string | null;
  attachments: string[];
  signatureUrl: string | null;
  createdAt: string;
  equipmentName: string | null;
}

interface ReportRow {
  id: string;
  request_id: string;
  work_done: string;
  recommendations: string | null;
  next_service_date: string | null;
  attachments: string[] | null;
  customer_signature_r2_key: string | null;
  created_at: string;
  maintenance_requests: { owned_equipment: { products: { name: string } | null } | null } | null;
}

/** Historial de reportes de mantenimiento visibles para el cliente
 * (`maintenance_reports_read` ya limita esto a la empresa dueña del
 * equipo, o al técnico/vendedor/master involucrados — docs/05-RLS-
 * SECURITY-C.md). Un solo query reutilizado por
 * `/mi-cuenta/equipos/[id]` (filtrado por equipo) y
 * `/mi-cuenta/mantenimientos` (filtrado por solicitud), para no
 * duplicar la forma de leer/mapear `attachments`/firma. */
export async function getMaintenanceHistoryByEquipment(client: SupabaseClient, equipmentId: string): Promise<MaintenanceHistoryEntry[]> {
  const { data: requestIdsData } = await client.from("maintenance_requests").select("id").eq("equipment_id", equipmentId);
  const requestIds = ((requestIdsData as { id: string }[] | null) ?? []).map((r) => r.id);
  if (requestIds.length === 0) return [];
  return getMaintenanceHistoryByRequestIds(client, requestIds);
}

export async function getMaintenanceHistoryByRequestIds(client: SupabaseClient, requestIds: string[]): Promise<MaintenanceHistoryEntry[]> {
  if (requestIds.length === 0) return [];
  const { data } = await client
    .from("maintenance_reports")
    .select("id,request_id,work_done,recommendations,next_service_date,attachments,customer_signature_r2_key,created_at,maintenance_requests(owned_equipment(products(name)))")
    .in("request_id", requestIds)
    .order("created_at", { ascending: false });
  const rows = (data as unknown as ReportRow[] | null) ?? [];

  return rows.map((row) => ({
    id: row.id,
    requestId: row.request_id,
    workDone: row.work_done,
    recommendations: row.recommendations,
    nextServiceDate: row.next_service_date,
    attachments: row.attachments ?? [],
    signatureUrl: row.customer_signature_r2_key,
    createdAt: row.created_at,
    equipmentName: row.maintenance_requests?.owned_equipment?.products?.name ?? null,
  }));
}
