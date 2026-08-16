"use client";

import { useState } from "react";
import { Icon } from "@tecni/ui";

import { AnnouncementIconPicker } from "@/components/announcement-icon-picker";
import { LinkUrlField, type LinkUrlOption } from "@/components/link-url-field";
import { BANNER_PLACEMENT_GROUPS } from "@/lib/banner-placement";

/** Agrupa Imagen + Datos básicos en un solo client component porque ambas
 * secciones dependen del placement elegido: la franja de anuncio no pide
 * imagen (campo `required` incluido) y en su lugar muestra el selector de
 * ícono — necesita reaccionar al cambio de `<select>` antes del submit. */
export function NewBannerFields({
  initialPlacement,
  pages,
  categories,
  categoryIdOptions,
  initialCategoryId,
}: {
  initialPlacement: string;
  pages: LinkUrlOption[];
  categories: LinkUrlOption[];
  categoryIdOptions: { id: string; name: string }[];
  initialCategoryId?: string;
}) {
  const [placement, setPlacement] = useState(initialPlacement);
  const isAnnouncementBar = placement === "announcement_bar";
  const isCategoryHero = placement === "category_hero";

  return (
    <>
      {!isAnnouncementBar ? (
        <section className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5">
          <h2 className="flex items-center gap-2 font-bold text-text">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-subtle text-brand">
              <Icon name="image" size={16} />
            </span>
            Imagen
          </h2>

          <div className="flex flex-col gap-1">
            <label htmlFor="image" className="text-sm font-medium text-text-muted">
              Imagen de escritorio
            </label>
            <input
              id="image"
              name="image"
              type="file"
              accept="image/*"
              required
              className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2 text-sm"
            />
            <p className="text-xs text-text-muted">Máximo 4 MB.</p>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="mobileImage" className="text-sm font-medium text-text-muted">
              Imagen móvil (opcional)
            </label>
            <input id="mobileImage" name="mobileImage" type="file" accept="image/*" className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2 text-sm" />
            <p className="text-xs text-text-muted">Si no la subes, se usa la de escritorio también en móvil.</p>
          </div>
        </section>
      ) : null}

      <section className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5">
        <h2 className="flex items-center gap-2 font-bold text-text">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-subtle text-brand">
            <Icon name="document" size={16} />
          </span>
          Datos básicos
        </h2>

        <div className="flex flex-col gap-1">
          <label htmlFor="title" className="text-sm font-medium text-text-muted">
            Título (opcional)
          </label>
          <input id="title" name="title" className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2 text-sm focus:border-brand focus:outline-none" />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-text-muted">Enlace (opcional)</label>
          <LinkUrlField pages={pages} categories={categories} defaultValue="" />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label htmlFor="placement" className="text-sm font-medium text-text-muted">
              Ubicación
            </label>
            <select
              id="placement"
              name="placement"
              value={placement}
              onChange={(e) => setPlacement(e.target.value)}
              className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2 text-sm focus:border-brand focus:outline-none"
            >
              {BANNER_PLACEMENT_GROUPS.map((group) => (
                <option key={group.placement} value={group.placement}>
                  {group.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="position" className="text-sm font-medium text-text-muted">
              Posición
            </label>
            <input
              id="position"
              name="position"
              type="number"
              min={0}
              defaultValue={0}
              className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2 text-sm focus:border-brand focus:outline-none"
            />
            <p className="text-xs text-text-muted">Entre varios banners de la misma ubicación, el de número más bajo se ve primero.</p>
          </div>
        </div>

        {isAnnouncementBar ? (
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-text-muted">Ícono</label>
            <AnnouncementIconPicker defaultValue="bolt" />
            <p className="text-xs text-text-muted">La franja de anuncio no muestra imagen — elige un ícono en su lugar.</p>
          </div>
        ) : null}

        {isCategoryHero ? (
          <div className="flex flex-col gap-1">
            <label htmlFor="categoryId" className="text-sm font-medium text-text-muted">
              Categoría
            </label>
            <select
              id="categoryId"
              name="categoryId"
              required
              defaultValue={initialCategoryId ?? ""}
              className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2 text-sm focus:border-brand focus:outline-none"
            >
              <option value="">Elige una categoría</option>
              {categoryIdOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-text-muted">Con 2 o más banners activos de la misma categoría, se muestran como carrusel.</p>
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label htmlFor="startsAt" className="text-sm font-medium text-text-muted">
              Vigente desde (opcional)
            </label>
            <input
              id="startsAt"
              name="startsAt"
              type="datetime-local"
              className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2 text-sm focus:border-brand focus:outline-none"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="endsAt" className="text-sm font-medium text-text-muted">
              Vigente hasta (opcional)
            </label>
            <input
              id="endsAt"
              name="endsAt"
              type="datetime-local"
              className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2 text-sm focus:border-brand focus:outline-none"
            />
          </div>
        </div>

        <label className="flex items-start gap-2 text-sm text-text">
          <input type="checkbox" name="isActive" value="1" className="mt-0.5" />
          <span>
            <span className="font-medium">Activo</span>
            <span className="block text-xs text-text-muted">Déjalo sin marcar hasta revisar cómo se ve — publícalo desde la lista o su ficha.</span>
          </span>
        </label>
      </section>
    </>
  );
}
