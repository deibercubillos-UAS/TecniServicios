import type { IconName } from "@tecni/ui";
import type { StatusTone } from "@/components/status-badge";

export const QUOTE_STATUS_LABEL: Record<string, string> = {
  requested: "Solicitada",
  in_progress: "En proceso",
  sent: "Enviada",
  accepted: "Aceptada",
  rejected: "Rechazada",
  expired: "Vencida",
};

export const QUOTE_STATUS_TONE: Record<string, { tone: StatusTone; icon: IconName }> = {
  requested: { tone: "muted", icon: "clock" },
  in_progress: { tone: "warning", icon: "clock" },
  sent: { tone: "brand", icon: "mail" },
  accepted: { tone: "success", icon: "checkCircle" },
  rejected: { tone: "danger", icon: "close" },
  expired: { tone: "muted", icon: "clock" },
};

export const QUOTE_STATUS_ORDER = ["requested", "in_progress", "sent", "accepted", "rejected", "expired"] as const;
