import type { IconName } from "@tecni/ui";
import type { StatusTone } from "@/components/status-badge";

export const MAINTENANCE_STATUS_LABEL: Record<string, string> = {
  requested: "Solicitado",
  confirmed: "Confirmado",
  rescheduled: "Reprogramado",
  in_progress: "En proceso",
  completed: "Completado",
  cancelled: "Cancelado",
};

export const MAINTENANCE_STATUS_TONE: Record<string, { tone: StatusTone; icon: IconName }> = {
  requested: { tone: "muted", icon: "clock" },
  confirmed: { tone: "brand", icon: "checkCircle" },
  rescheduled: { tone: "warning", icon: "clock" },
  in_progress: { tone: "brand", icon: "wrench" },
  completed: { tone: "success", icon: "checkCircle" },
  cancelled: { tone: "danger", icon: "close" },
};
