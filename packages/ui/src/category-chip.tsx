import type { IconName } from "./icon";
import { Icon } from "./icon";

export function CategoryChip({ icon, label, href }: { icon: IconName; label: string; href: string }) {
  return (
    <a
      href={href}
      className="group flex items-center gap-2 rounded-full border border-border bg-surface px-6 py-3 transition-all hover:border-brand hover:shadow"
    >
      <Icon name={icon} className="text-text-muted group-hover:text-brand" size={20} />
      <span className="font-medium text-text">{label}</span>
    </a>
  );
}
