import type { IconName } from "@tecni/ui";

/** Traduce las acciones reales que `recordAuditLog` registra en
 * `packages/core` (ver `grep -rn 'action: "' packages/core/src`) —
 * lista cerrada, se actualiza cada vez que se agregue una acción nueva. */
export const AUDIT_ACTION_LABEL: Record<string, string> = {
  "company_member.role_changed": "Cambio de rol en empresa",
  "equipment.created": "Equipo registrado",
  "maintenance_availability.created": "Fecha de mantenimiento abierta",
  "maintenance_availability.deleted": "Fecha de mantenimiento cerrada",
  "order.created_direct": "Pedido creado (compra directa)",
  "order.created_from_quote": "Pedido creado desde cotización",
  "order.delivered": "Pedido entregado",
  "order.paid": "Pedido pagado",
  "profile.anonymized": "Perfil anonimizado",
  "profile.role_changed": "Cambio de rol de usuario",
  "quote.accepted": "Cotización aceptada",
  "quote.requested": "Cotización solicitada",
};

export const AUDIT_ENTITY_LABEL: Record<string, string> = {
  order: "Pedido",
  quote: "Cotización",
  profile: "Perfil",
  company_member: "Miembro de empresa",
  equipment: "Equipo",
  maintenance_availability: "Disponibilidad de mantenimiento",
};

const AUDIT_ACTION_ICON: Record<string, IconName> = {
  company_member: "user",
  profile: "user",
  order: "truck",
  quote: "handshake",
  product: "box",
  maintenance_availability: "wrench",
  setting: "gear",
  equipment: "box",
};

export function auditActionLabel(action: string): string {
  return AUDIT_ACTION_LABEL[action] ?? action;
}

export function auditEntityLabel(entity: string): string {
  return AUDIT_ENTITY_LABEL[entity] ?? entity;
}

export function auditActionIcon(action: string): IconName {
  const prefix = action.split(".")[0] ?? "";
  return AUDIT_ACTION_ICON[prefix] ?? "history";
}
