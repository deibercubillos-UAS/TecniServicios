import type { IconName } from "@tecni/ui";
import type { StatusTone } from "@/components/status-badge";

export const ORDER_STATUS_LABEL: Record<string, string> = {
  pending_payment: "Pago pendiente",
  paid: "Pagado",
  preparing: "En preparación",
  shipped: "Enviado",
  delivered: "Entregado",
  cancelled: "Cancelado",
};

export const ORDER_STATUS_TONE: Record<string, { tone: StatusTone; icon: IconName }> = {
  pending_payment: { tone: "warning", icon: "clock" },
  paid: { tone: "success", icon: "checkCircle" },
  preparing: { tone: "brand", icon: "box" },
  shipped: { tone: "brand", icon: "truck" },
  delivered: { tone: "success", icon: "checkCircle" },
  cancelled: { tone: "danger", icon: "close" },
};

export const ORDER_STATUS_ORDER = ["pending_payment", "paid", "preparing", "shipped", "delivered", "cancelled"] as const;
