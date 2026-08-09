import type { IconName } from "@tecni/ui";
import type { StatusTone } from "@/components/status-badge";

export const TICKET_STATUS_LABEL: Record<string, string> = {
  open: "Abierto",
  assigned: "Asignado",
  waiting_customer: "Esperando tu respuesta",
  resolved: "Resuelto",
  closed: "Cerrado",
};

export const TICKET_STATUS_TONE: Record<string, { tone: StatusTone; icon: IconName }> = {
  open: { tone: "warning", icon: "chat" },
  assigned: { tone: "brand", icon: "user" },
  waiting_customer: { tone: "warning", icon: "clock" },
  resolved: { tone: "success", icon: "checkCircle" },
  closed: { tone: "muted", icon: "close" },
};
