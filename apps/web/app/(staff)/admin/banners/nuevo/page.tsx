import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@tecni/ui";

import { FileSizeGuardForm } from "@/components/file-size-guard-form";
import { SubmitButton } from "@/components/submit-button";

import { createBannerAction } from "../actions";

export const metadata: Metadata = {
  title: "Nuevo banner — Panel maestro",
};

export default async function NuevoBannerPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;

  return (
    <div className="mx-auto flex max-w-[700px] flex-col gap-6 px-4 py-16">
      <nav aria-label="Miga de pan" className="flex items-center gap-2 text-sm text-text-muted">
        <Link href="/admin/banners" className="hover:text-brand">
          Banners
        </Link>
        <Icon name="chevronRight" size={14} />
        <span className="text-text">Nuevo banner</span>
      </nav>

      <div>
        <h1 className="text-2xl font-bold text-text">Nuevo banner</h1>
        <p className="text-sm text-text-muted">Nace inactivo — no se muestra en el sitio hasta que lo actives, ya revisado.</p>
      </div>

      {error ? (
        <p role="alert" className="flex items-center gap-2 rounded-[var(--radius)] border border-danger bg-danger/10 px-3 py-2 text-sm text-danger">
          <Icon name="close" size={16} />
          {error}
        </p>
      ) : null}

      <FileSizeGuardForm action={createBannerAction} maxMB={4} className="flex flex-col gap-6">
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
            <p className="text-xs text-text-muted">Máximo 4 MB. No aplica para la franja de anuncio del navbar (no muestra imagen).</p>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="mobileImage" className="text-sm font-medium text-text-muted">
              Imagen móvil (opcional)
            </label>
            <input id="mobileImage" name="mobileImage" type="file" accept="image/*" className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2 text-sm" />
            <p className="text-xs text-text-muted">Si no la subes, se usa la de escritorio también en móvil.</p>
          </div>
        </section>

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
            <label htmlFor="linkUrl" className="text-sm font-medium text-text-muted">
              Enlace (opcional)
            </label>
            <input
              id="linkUrl"
              name="linkUrl"
              type="url"
              placeholder="https://..."
              className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2 text-sm focus:border-brand focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label htmlFor="placement" className="text-sm font-medium text-text-muted">
                Ubicación
              </label>
              <select id="placement" name="placement" className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2 text-sm focus:border-brand focus:outline-none">
                <option value="home_hero">Home hero</option>
                <option value="catalog_top">Catálogo (arriba)</option>
                <option value="announcement_bar">Franja de anuncio (navbar)</option>
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

        <SubmitButton
          pendingLabel="Creando…"
          className="self-start rounded-[var(--radius)] bg-brand px-4 py-2.5 text-sm font-semibold text-text-inverse transition-colors hover:bg-brand-hover disabled:cursor-wait disabled:opacity-70"
        >
          Crear banner
        </SubmitButton>
      </FileSizeGuardForm>

      <Link href="/admin/banners" className="text-sm text-brand hover:underline">
        Ver banners
      </Link>
    </div>
  );
}
