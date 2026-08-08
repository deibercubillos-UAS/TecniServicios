import { Icon, type IconName } from "./icon";

export function TrustItem({ icon, label }: { icon: IconName; label: string }) {
  return (
    <div className="group flex flex-col items-center gap-3 p-6 text-center transition-colors hover:bg-bg-alt">
      <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-border bg-bg text-text group-hover:border-brand group-hover:text-brand">
        <Icon name={icon} size={24} />
      </div>
      <h3 className="text-sm font-medium text-text">{label}</h3>
    </div>
  );
}
