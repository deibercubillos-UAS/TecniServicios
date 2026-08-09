import { Icon, type IconName } from "@tecni/ui";

export type StatusTone = "muted" | "warning" | "success" | "danger" | "brand";

const TONE_CLASSES: Record<StatusTone, string> = {
  muted: "bg-bg-alt text-text-muted",
  warning: "bg-warning/15 text-warning",
  success: "bg-success/15 text-success",
  danger: "bg-danger/15 text-danger",
  brand: "bg-brand-subtle text-brand",
};

export function StatusBadge({ label, tone, icon }: { label: string; tone: StatusTone; icon: IconName }) {
  return (
    <span className={`flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${TONE_CLASSES[tone]}`}>
      <Icon name={icon} size={12} />
      {label}
    </span>
  );
}
