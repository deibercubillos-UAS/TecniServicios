import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@tecni/ui";

import { PostCoverField } from "@/components/post-cover-field";
import { SubmitButton } from "@/components/submit-button";

import { createPostAction } from "../actions";

export const metadata: Metadata = {
  title: "Nuevo post — Panel maestro",
};

export default async function NuevoPostPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;

  return (
    <div className="mx-auto flex max-w-[700px] flex-col gap-6 px-4 py-16">
      <nav aria-label="Miga de pan" className="flex items-center gap-2 text-sm text-text-muted">
        <Link href="/admin/blog" className="hover:text-brand">
          Blog
        </Link>
        <Icon name="chevronRight" size={14} />
        <span className="text-text">Nuevo post</span>
      </nav>

      <div>
        <h1 className="text-2xl font-bold text-text">Nuevo post</h1>
        <p className="text-sm text-text-muted">Nace como borrador — publicarlo es un paso aparte, desde la edición.</p>
      </div>

      {error ? (
        <p role="alert" className="flex items-center gap-2 rounded-[var(--radius)] border border-danger bg-danger/10 px-3 py-2 text-sm text-danger">
          <Icon name="close" size={16} />
          {error}
        </p>
      ) : null}

      <form action={createPostAction} className="flex flex-col gap-6">
        <section className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5">
          <h2 className="flex items-center gap-2 font-bold text-text">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-subtle text-brand">
              <Icon name="document" size={16} />
            </span>
            Contenido
          </h2>

          <div className="flex flex-col gap-1">
            <label htmlFor="title" className="text-sm font-medium text-text-muted">
              Título
            </label>
            <input id="title" name="title" required className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2 text-sm focus:border-brand focus:outline-none" />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="slug" className="text-sm font-medium text-text-muted">
              Slug
            </label>
            <input id="slug" name="slug" required className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2 text-sm focus:border-brand focus:outline-none" />
            <p className="text-xs text-text-muted">Va en la URL: /blog/tu-slug. Único, sin espacios ni tildes.</p>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="excerpt" className="text-sm font-medium text-text-muted">
              Extracto (opcional)
            </label>
            <input
              id="excerpt"
              name="excerpt"
              className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2 text-sm focus:border-brand focus:outline-none"
            />
            <p className="text-xs text-text-muted">Se muestra en la lista del blog, antes de entrar al post.</p>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="body" className="text-sm font-medium text-text-muted">
              Cuerpo (texto/markdown plano)
            </label>
            <textarea
              id="body"
              name="body"
              rows={12}
              className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2 text-sm focus:border-brand focus:outline-none"
            />
          </div>
        </section>

        <section className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5">
          <h2 className="flex items-center gap-2 font-bold text-text">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-subtle text-brand">
              <Icon name="image" size={16} />
            </span>
            Portada y categoría
          </h2>

          <div className="flex flex-col gap-1">
            <label htmlFor="coverUrl" className="text-sm font-medium text-text-muted">
              URL de portada (opcional)
            </label>
            <PostCoverField defaultValue="" />
            <p className="text-xs text-text-muted">Sin subida de archivo — pega el enlace de una imagen ya alojada.</p>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="category" className="text-sm font-medium text-text-muted">
              Categoría (opcional)
            </label>
            <input
              id="category"
              name="category"
              placeholder="ej. Guías de mantenimiento"
              className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2 text-sm focus:border-brand focus:outline-none"
            />
            <p className="text-xs text-text-muted">Texto libre — agrupa posts en /blog. Reusa el mismo texto exacto para que queden juntos.</p>
          </div>
        </section>

        <section className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5">
          <h2 className="flex items-center gap-2 font-bold text-text">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-subtle text-brand">
              <Icon name="search" size={16} />
            </span>
            SEO (opcional)
          </h2>
          <p className="text-sm text-text-muted">Si los dejas vacíos, se usan el título y el extracto del post.</p>

          <div className="flex flex-col gap-1">
            <label htmlFor="seoTitle" className="text-sm font-medium text-text-muted">
              Título SEO
            </label>
            <input
              id="seoTitle"
              name="seoTitle"
              className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2 text-sm focus:border-brand focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="seoDescription" className="text-sm font-medium text-text-muted">
              Descripción SEO
            </label>
            <input
              id="seoDescription"
              name="seoDescription"
              className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2 text-sm focus:border-brand focus:outline-none"
            />
          </div>
        </section>

        <SubmitButton
          pendingLabel="Creando…"
          className="self-start rounded-[var(--radius)] bg-brand px-4 py-2.5 text-sm font-semibold text-text-inverse transition-colors hover:bg-brand-hover disabled:cursor-wait disabled:opacity-70"
        >
          Crear borrador
        </SubmitButton>
      </form>

      <Link href="/admin/blog" className="text-sm text-brand hover:underline">
        Ver blog
      </Link>
    </div>
  );
}
