import type { Metadata } from "next";

import { createPostAction } from "../actions";

export const metadata: Metadata = {
  title: "Nuevo post — Panel maestro",
};

export default async function NuevoPostPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;

  return (
    <div className="mx-auto flex max-w-[700px] flex-col gap-6 px-4 py-16">
      <h1 className="text-2xl font-bold text-text">Nuevo post</h1>
      <p className="text-sm text-text-muted">Se crea como borrador. Publicar es un paso aparte desde la edición.</p>

      {error ? (
        <p className="rounded-[var(--radius)] border border-danger bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>
      ) : null}

      <form action={createPostAction} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="slug" className="text-sm text-text-muted">
            Slug
          </label>
          <input id="slug" name="slug" required className="rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm" />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="title" className="text-sm text-text-muted">
            Título
          </label>
          <input id="title" name="title" required className="rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm" />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="excerpt" className="text-sm text-text-muted">
            Extracto (opcional)
          </label>
          <input id="excerpt" name="excerpt" className="rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm" />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="body" className="text-sm text-text-muted">
            Cuerpo (texto/markdown plano)
          </label>
          <textarea id="body" name="body" rows={10} className="rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm" />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="coverUrl" className="text-sm text-text-muted">
            URL de portada (opcional — sin subida de archivo, sin R2)
          </label>
          <input id="coverUrl" name="coverUrl" type="url" className="rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm" />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="seoTitle" className="text-sm text-text-muted">
            SEO — título (opcional)
          </label>
          <input id="seoTitle" name="seoTitle" className="rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm" />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="seoDescription" className="text-sm text-text-muted">
            SEO — descripción (opcional)
          </label>
          <input id="seoDescription" name="seoDescription" className="rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm" />
        </div>

        <button
          type="submit"
          className="self-start rounded-[var(--radius)] bg-brand px-4 py-2 text-sm font-semibold text-text-inverse transition-colors hover:bg-brand-hover"
        >
          Crear borrador
        </button>
      </form>
    </div>
  );
}
