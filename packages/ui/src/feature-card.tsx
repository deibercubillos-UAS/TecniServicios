import { Icon, type IconName } from "./icon";

export function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: IconName;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-8 shadow-sm transition-shadow hover:shadow">
      <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-lg border border-border bg-bg-alt text-brand">
        <Icon name={icon} size={28} />
      </div>
      <h3 className="mb-3 text-xl font-bold text-text">{title}</h3>
      <p className="text-text-muted">{description}</p>
    </div>
  );
}
