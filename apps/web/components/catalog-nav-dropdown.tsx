"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Icon, type IconName } from "@tecni/ui";

export interface CatalogNavDropdownCategory {
  slug: string;
  name: string;
  icon: IconName;
}

/**
 * Cuarta excepción real del proyecto a "Server Components por defecto"
 * (ver hero-carousel.tsx, category-carousel.tsx, roi-calculator.tsx para
 * las otras tres): el desplegable necesita estado abierto/cerrado, cierre
 * con clic afuera/`Escape` y devolver el foco al botón. Reemplaza el link
 * plano "Catálogo" del navbar por un dropdown simple con las categorías
 * reales — decisión ya evaluada en docs/tasks/done/DONE-mejoras-frontend-
 * hunter.md: con 6 categorías planas un mega-menú de tres columnas
 * (`CatalogMegaMenu`) no se justifica, este dropdown simple es lo que esa
 * tarea recomendó en su lugar.
 */
export function CatalogNavDropdown({ categories }: { categories: CatalogNavDropdownCategory[] }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const close = () => {
    setOpen(false);
    buttonRef.current?.focus();
  };

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    const onClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onClickOutside);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onClickOutside);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="flex items-center gap-1 font-bold uppercase tracking-wide text-text-inverse-muted transition-colors hover:text-text-inverse focus-visible:text-text-inverse focus-visible:outline-2 focus-visible:outline-brand"
      >
        Catálogo
        <Icon name="chevronDown" size={14} />
      </button>

      {open ? (
        <div
          role="menu"
          aria-label="Categorías del catálogo"
          className="absolute left-0 top-full z-10 mt-3 w-64 rounded-[var(--radius)] border border-border bg-surface py-2 text-text shadow-lg"
        >
          {categories.map((category) => (
            <Link
              key={category.slug}
              href={`/catalogo?categoria=${category.slug}`}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2 text-sm font-medium normal-case tracking-normal text-text transition-colors hover:bg-bg-alt hover:text-brand"
            >
              <Icon name={category.icon} size={18} className="text-brand" />
              {category.name}
            </Link>
          ))}
          <div className="my-2 border-t border-border" />
          <Link
            href="/catalogo/categorias"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center justify-between px-4 py-2 text-sm font-semibold normal-case tracking-normal text-brand hover:underline"
          >
            Ver todas las categorías
            <Icon name="arrowRight" size={14} />
          </Link>
        </div>
      ) : null}
    </div>
  );
}
