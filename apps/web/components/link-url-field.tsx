"use client";

import { useState } from "react";

export interface LinkUrlOption {
  value: string;
  label: string;
}

const OTHER = "__other__";

/**
 * Selector de enlace para banners: páginas del sitio (mismas pestañas del
 * navbar) + categorías reales, con "Otro" al final para escribir una URL
 * cualquiera. Sigue enviando un único campo `linkUrl` — el <select> nunca
 * lleva `name`, así el server action no cambia.
 */
export function LinkUrlField({
  pages,
  categories,
  defaultValue,
}: {
  pages: LinkUrlOption[];
  categories: LinkUrlOption[];
  defaultValue: string;
}) {
  const known = new Set([...pages, ...categories].map((o) => o.value));
  const isKnown = defaultValue.length > 0 && known.has(defaultValue);
  const isCustom = defaultValue.length > 0 && !isKnown;

  const [mode, setMode] = useState<string>(isCustom ? OTHER : defaultValue);
  const [customValue, setCustomValue] = useState(isCustom ? defaultValue : "");

  return (
    <div className="flex flex-col gap-2">
      <select
        value={mode}
        onChange={(e) => setMode(e.target.value)}
        className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2 text-sm focus:border-brand focus:outline-none"
      >
        <option value="">Sin enlace</option>
        <optgroup label="Páginas">
          {pages.map((page) => (
            <option key={page.value} value={page.value}>
              {page.label}
            </option>
          ))}
        </optgroup>
        {categories.length > 0 ? (
          <optgroup label="Categorías">
            {categories.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </optgroup>
        ) : null}
        <option value={OTHER}>Otro (escribir URL)</option>
      </select>

      {mode === OTHER ? (
        <input
          type="url"
          name="linkUrl"
          value={customValue}
          onChange={(e) => setCustomValue(e.target.value)}
          placeholder="https://..."
          className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2 text-sm focus:border-brand focus:outline-none"
        />
      ) : (
        <input type="hidden" name="linkUrl" value={mode} />
      )}
    </div>
  );
}
