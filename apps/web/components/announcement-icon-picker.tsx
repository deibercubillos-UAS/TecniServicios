"use client";

import { useState } from "react";
import { Icon, type IconName } from "@tecni/ui";

import { ANNOUNCEMENT_ICON_OPTIONS } from "@/lib/announcement-icons";

/** Máximo 5 íconos — la franja de anuncio no tiene espacio para imagen ni
 * para un selector largo. Un solo click elige el ícono; se envía como
 * `icon` (mismo contrato que el resto del formulario). */
export function AnnouncementIconPicker({ defaultValue }: { defaultValue: string }) {
  const [selected, setSelected] = useState(defaultValue);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {ANNOUNCEMENT_ICON_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setSelected(option.value)}
            aria-pressed={selected === option.value}
            className={`flex items-center gap-2 rounded-[var(--radius)] border px-3 py-2 text-sm transition-colors ${
              selected === option.value
                ? "border-brand bg-brand-subtle text-brand"
                : "border-border bg-bg text-text-muted hover:border-brand"
            }`}
          >
            <Icon name={option.value as IconName} size={16} />
            {option.label}
          </button>
        ))}
      </div>
      <input type="hidden" name="icon" value={selected} />
    </div>
  );
}
