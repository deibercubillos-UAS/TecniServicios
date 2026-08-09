import type { SupabaseClient } from "@supabase/supabase-js";

export interface AuditLogEntry {
  actorId: string | null;
  action: string;
  entity: string;
  entityId: string;
  before?: unknown;
  after?: unknown;
}

/**
 * Registra un cambio en `audit_log` (CLAUDE.md regla de oro 8: todo
 * cambio de precio, rol, pedido o cotización se registra). `audit_log`
 * no tiene ninguna política de insert para `authenticated`
 * (docs/05-RLS-SECURITY-B.md sección 9) — siempre requiere
 * `service_role`, nunca la sesión del usuario. Si el insert falla, la
 * función relanza el error: una operación de negocio que "toca precio,
 * rol, pedido o cotización" sin quedar auditada no se considera
 * completada, la regla es explícita ("no negociable").
 */
export async function recordAuditLog(serviceClient: SupabaseClient, entry: AuditLogEntry): Promise<void> {
  const { error } = await serviceClient.from("audit_log").insert({
    actor_id: entry.actorId,
    action: entry.action,
    entity: entry.entity,
    entity_id: entry.entityId,
    before: entry.before ?? null,
    after: entry.after ?? null,
  });
  if (error) {
    throw new Error("No se pudo registrar la auditoría.");
  }
}
