"use client";

import { useState, type ReactNode } from "react";
import { Icon } from "@tecni/ui";

/** En móvil, el panel de filtros arrancaba siempre expandido y el usuario
 * tenía que scrollear todo el bloque (categorías + marcas + precio +
 * specs) antes de ver un solo producto. Colapsado por defecto en <768px;
 * en desktop (md:) siempre visible, el estado de este botón no aplica. */
export function CollapsibleFilters({
  children,
  hasActiveFilters,
  clearFiltersHref,
}: {
  children: ReactNode;
  hasActiveFilters: boolean;
  clearFiltersHref: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="catalogo-filtros"
        className="flex w-full items-center justify-between border-b-2 border-brand pb-3 md:cursor-default"
      >
        <span className="flex items-center gap-2 text-lg font-bold text-text">
          <Icon name="sliders" size={20} className="text-brand" />
          Filtros
        </span>
        <Icon name="chevronDown" size={18} className={`text-text-muted transition-transform md:hidden ${open ? "rotate-180" : ""}`} />
      </button>

      {hasActiveFilters ? (
        <a href={clearFiltersHref} className="-mt-3 flex w-fit items-center gap-1 text-xs font-medium text-text-muted hover:text-brand">
          <Icon name="close" size={14} />
          Limpiar filtros
        </a>
      ) : null}

      <div id="catalogo-filtros" className={`${open ? "flex" : "hidden"} flex-col gap-6 md:flex`}>
        {children}
      </div>
    </>
  );
}
