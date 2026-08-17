import Link from "next/link";
import { Icon, type IconName } from "@tecni/ui";

export function StatCard({
  href,
  label,
  value,
  icon,
  tone = "brand",
  hint,
  hintTone = "muted",
}: {
  href: string;
  label: string;
  value: number;
  icon: IconName;
  tone?: "brand" | "warning";
  hint?: string | undefined;
  hintTone?: "muted" | "warning";
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col gap-3 rounded-xl border border-border bg-surface p-5 transition-all duration-150 hover:-translate-y-0.5 hover:border-brand hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
    >
      <div className="flex items-center justify-between">
        <span
          className={`flex h-10 w-10 items-center justify-center rounded-lg transition-transform duration-150 group-hover:scale-110 ${
            tone === "warning" ? "bg-warning/15 text-warning" : "bg-brand-subtle text-brand"
          }`}
        >
          <Icon name={icon} size={20} />
        </span>
        <Icon name="arrowRight" size={16} className="text-text-muted opacity-0 transition-opacity duration-150 group-hover:opacity-100" />
      </div>
      <div>
        <span className="block text-3xl font-extrabold tabular-nums text-text">{value}</span>
        <span className="text-sm text-text-muted">{label}</span>
      </div>
      {hint ? (
        <span
          className={`w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${
            hintTone === "warning" ? "bg-warning/15 text-warning" : "bg-bg-alt text-text-muted"
          }`}
        >
          {hint}
        </span>
      ) : null}
    </Link>
  );
}
