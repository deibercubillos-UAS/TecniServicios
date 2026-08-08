import { Icon, type IconName } from "./icon";

export function StatItem({ icon, value, label }: { icon: IconName; value: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-4 px-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full border border-border-inverse bg-surface-inverse text-text-inverse">
        <Icon name={icon} size={28} />
      </div>
      <span className="text-3xl font-bold text-text-inverse">{value}</span>
      <span className="text-text-inverse-muted">{label}</span>
    </div>
  );
}
