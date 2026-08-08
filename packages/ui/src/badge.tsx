import type { ReactNode } from "react";

export function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-brand bg-bg-inverse/50 px-4 py-2 text-sm font-medium uppercase tracking-wide text-text-inverse backdrop-blur-sm">
      <span className="h-2 w-2 rounded-full bg-brand" />
      {children}
    </span>
  );
}
