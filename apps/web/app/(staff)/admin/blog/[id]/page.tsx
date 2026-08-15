import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { createServerClient } from "@tecni/db";
import { serverEnv } from "@tecni/shared";
import { Icon } from "@tecni/ui";

import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { PostCoverField } from "@/components/post-cover-field";
import { StatusBadge } from "@/components/status-badge";
import { SubmitButton } from "@/components/submit-button";

import { publishPostAction, unpublishPostAction, updatePostAction } from "../actions";

export const metadata: Metadata = {
  title: "Editar post — Panel maestro",
};

interface PostRow {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  body: string | null;
  cover_url: string | null;
  category: string | null;
  seo_title: string | null;
  seo_description: string | null;
  is_published: boolean;
  published_at: string | null;
}

async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(serverEnv.NEXT_PUBLIC_SUPABASE_URL, serverEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    getAll: () => cookieStore.getAll(),
    setAll: () => {},
  });
}

export default async function EditarPostPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; updated?: string }>;
}) {
  const { id } = await params;
  const { error, updated } = await searchParams;
  const supabase = await getSupabase();

  const { data: postData } = await supabase
    .from("posts")
    .select("id,slug,title,excerpt,body,cover_url,category,seo_title,seo_description,is_published,published_at")
    .eq("id", id)
    .maybeSingle();
  const post = postData as PostRow | null;

  if (!post) {
    return (
      <div className="mx-auto max-w-[700px] px-4 py-16">
        <h1 className="mb-4 text-2xl font-bold text-text">Post no encontrado</h1>
        <Link href="/admin/blog" className="text-brand hover:underline">
          Ver blog
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-[700px] flex-col gap-6 px-4 py-16">
      <nav aria-label="Miga de pan" className="flex flex-wrap items-center gap-2 text-sm text-text-muted">
        <Link href="/admin/blog" className="hover:text-brand">
          Blog
        </Link>
        <Icon name="chevronRight" size={14} />
        <span className="truncate text-text">{post.title}</span>
      </nav>

      <div className="flex flex-wrap items-start justify-between gap-2">
        <h1 className="text-2xl font-bold text-text">{post.title}</h1>
        {post.is_published ? (
          <StatusBadge label="Publicado" tone="success" icon="checkCircle" />
        ) : (
          <StatusBadge label="Borrador" tone="muted" icon="close" />
        )}
      </div>

      {updated ? (
        <p className="flex items-center gap-2 rounded-[var(--radius)] border border-success bg-success/10 px-3 py-2 text-sm text-success">
          <Icon name="checkCircle" size={16} />
          Cambios guardados.
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="flex items-center gap-2 rounded-[var(--radius)] border border-danger bg-danger/10 px-3 py-2 text-sm text-danger">
          <Icon name="close" size={16} />
          {error}
        </p>
      ) : null}

      <section className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-5">
        <h2 className="flex items-center gap-2 font-bold text-text">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-subtle text-brand">
            <Icon name={post.is_published ? "checkCircle" : "clock"} size={16} />
          </span>
          Publicación
        </h2>
        <p className="text-sm text-text-muted">
          {post.is_published
            ? `Publicado ${post.published_at ? new Date(post.published_at).toLocaleString("es-CO") : ""}`
            : "Sin publicar todavía — solo lo ves tú desde acá."}
        </p>
        {post.is_published ? (
          <form action={unpublishPostAction} className="w-fit">
            <input type="hidden" name="postId" value={post.id} />
            <ConfirmSubmitButton
              confirmMessage={`¿Despublicar "${post.title}"? Deja de verse en /blog hasta que lo publiques de nuevo.`}
              className="rounded-[var(--radius)] border border-border px-4 py-2 text-sm font-medium text-text transition-colors hover:border-danger hover:text-danger"
            >
              Despublicar
            </ConfirmSubmitButton>
          </form>
        ) : (
          <form action={publishPostAction} className="flex flex-wrap items-end gap-3">
            <input type="hidden" name="postId" value={post.id} />
            <div className="flex flex-col gap-1">
              <label htmlFor="publishedAt" className="text-sm font-medium text-text-muted">
                Programar (opcional, vacío = ahora)
              </label>
              <input
                id="publishedAt"
                name="publishedAt"
                type="datetime-local"
                className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2 text-sm focus:border-brand focus:outline-none"
              />
            </div>
            <SubmitButton
              pendingLabel="Publicando…"
              className="rounded-[var(--radius)] bg-brand px-4 py-2 text-sm font-semibold text-text-inverse transition-colors hover:bg-brand-hover disabled:cursor-wait disabled:opacity-70"
            >
              Publicar
            </SubmitButton>
          </form>
        )}
      </section>

      <form action={updatePostAction} className="flex flex-col gap-6">
        <input type="hidden" name="postId" value={post.id} />

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
            <input
              id="title"
              name="title"
              required
              defaultValue={post.title}
              className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2 text-sm focus:border-brand focus:outline-none"
            />
          </div>

          <p className="text-xs text-text-muted">
            slug <span className="font-medium text-text">{post.slug}</span> — no editable acá (rompería enlaces ya compartidos)
          </p>

          <div className="flex flex-col gap-1">
            <label htmlFor="excerpt" className="text-sm font-medium text-text-muted">
              Extracto (opcional)
            </label>
            <input
              id="excerpt"
              name="excerpt"
              defaultValue={post.excerpt ?? ""}
              className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2 text-sm focus:border-brand focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="body" className="text-sm font-medium text-text-muted">
              Cuerpo (texto/markdown plano)
            </label>
            <textarea
              id="body"
              name="body"
              rows={12}
              defaultValue={post.body ?? ""}
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
            <PostCoverField defaultValue={post.cover_url ?? ""} />
            <p className="text-xs text-text-muted">Sin subida de archivo — pega el enlace de una imagen ya alojada.</p>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="category" className="text-sm font-medium text-text-muted">
              Categoría (opcional)
            </label>
            <input
              id="category"
              name="category"
              defaultValue={post.category ?? ""}
              placeholder="ej. Guías de mantenimiento"
              className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2 text-sm focus:border-brand focus:outline-none"
            />
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
              defaultValue={post.seo_title ?? ""}
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
              defaultValue={post.seo_description ?? ""}
              className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2 text-sm focus:border-brand focus:outline-none"
            />
          </div>
        </section>

        <SubmitButton
          pendingLabel="Guardando…"
          className="self-start rounded-[var(--radius)] bg-brand px-4 py-2.5 text-sm font-semibold text-text-inverse transition-colors hover:bg-brand-hover disabled:cursor-wait disabled:opacity-70"
        >
          Guardar cambios
        </SubmitButton>
      </form>

      <Link href="/admin/blog" className="text-sm text-brand hover:underline">
        Ver blog
      </Link>
    </div>
  );
}
