import type { Metadata } from "next";

import { createBannerAction } from "../actions";

export const metadata: Metadata = {
  title: "Nuevo banner — Panel maestro",
};

export default async function NuevoBannerPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;

  return (
    <div className="mx-auto flex max-w-[700px] flex-col gap-6 px-4 py-16">
      <h1 className="text-2xl font-bold text-text">Nuevo banner</h1>

      {error ? (
        <p role="alert" className="rounded-[var(--radius)] border border-danger bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>
      ) : null}

      <form action={createBannerAction} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="title" className="text-sm text-text-muted">
            Título (opcional)
          </label>
          <input id="title" name="title" className="rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm" />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="imageUrl" className="text-sm text-text-muted">
            URL de imagen (sin subida de archivo, sin R2)
          </label>
          <input id="imageUrl" name="imageUrl" type="url" required className="rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm" />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="mobileImageUrl" className="text-sm text-text-muted">
            URL de imagen móvil (opcional)
          </label>
          <input id="mobileImageUrl" name="mobileImageUrl" type="url" className="rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm" />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="linkUrl" className="text-sm text-text-muted">
            Enlace (opcional)
          </label>
          <input id="linkUrl" name="linkUrl" type="url" className="rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm" />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label htmlFor="placement" className="text-sm text-text-muted">
              Ubicación
            </label>
            <select id="placement" name="placement" className="rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm">
              <option value="home_hero">Home hero</option>
              <option value="catalog_top">Catálogo (arriba)</option>
              <option value="announcement_bar">Franja de anuncio (navbar)</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="position" className="text-sm text-text-muted">
              Posición
            </label>
            <input id="position" name="position" type="number" min={0} defaultValue={0} className="rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label htmlFor="startsAt" className="text-sm text-text-muted">
              Vigente desde (opcional)
            </label>
            <input id="startsAt" name="startsAt" type="datetime-local" className="rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm" />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="endsAt" className="text-sm text-text-muted">
              Vigente hasta (opcional)
            </label>
            <input id="endsAt" name="endsAt" type="datetime-local" className="rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm" />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-text">
          <input type="checkbox" name="isActive" value="1" defaultChecked /> Activo
        </label>

        <button
          type="submit"
          className="self-start rounded-[var(--radius)] bg-brand px-4 py-2 text-sm font-semibold text-text-inverse transition-colors hover:bg-brand-hover"
        >
          Crear banner
        </button>
      </form>
    </div>
  );
}
