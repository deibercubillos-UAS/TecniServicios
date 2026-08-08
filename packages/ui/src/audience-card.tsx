import type { ReactNode } from "react";
import { Icon } from "./icon";
import { Button } from "./button";

export function AudienceCard({
  eyebrow,
  title,
  items,
  ctaLabel,
  ctaVariant = "secondary",
}: {
  eyebrow: string;
  title: string;
  items: string[];
  ctaLabel: string;
  ctaVariant?: "primary" | "secondary";
}): ReactNode {
  return (
    <div className="flex h-full flex-col justify-end overflow-hidden rounded-2xl border border-border-inverse bg-gradient-to-br from-surface-inverse to-bg-inverse p-10">
      <span className="mb-3 block text-xs uppercase tracking-wider text-text-inverse-muted">{eyebrow}</span>
      <h3 className="mb-6 text-3xl font-bold text-text-inverse">{title}</h3>
      <ul className="mb-10 flex flex-col gap-4">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-3">
            <Icon name="checkCircle" className="mt-0.5 shrink-0 text-brand" size={20} />
            <span className="text-sm text-text-inverse-muted">{item}</span>
          </li>
        ))}
      </ul>
      <Button variant={ctaVariant} className="w-full sm:w-auto">
        {ctaLabel}
      </Button>
    </div>
  );
}
