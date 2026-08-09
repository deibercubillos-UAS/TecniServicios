import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { createServerClient } from "@tecni/db";
import { serverEnv } from "@tecni/shared";

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
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold text-text">{post.title}</h1>
        <span
          className={
            post.is_published
              ? "rounded-full border border-success px-3 py-1 text-xs font-medium text-success"
              : "rounded-full border border-border px-3 py-1 text-xs font-medium text-text-muted"
          }
        >
          {post.is_published ? "Publicado" : "Borrador"}
        </span>
      </div>

      {updated ? (
        <p className="rounded-[var(--radius)] border border-success bg-success/10 px-3 py-2 text-sm text-success">Cambios guardados.</p>
      ) : null}
      {error ? (
        <p role="alert" className="rounded-[var(--radius)] border border-danger bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>
      ) : null}

      <div className="flex flex-col gap-3 rounded-[var(--radius)] border border-border p-4">
        <p className="text-sm text-text-muted">
          {post.is_published
            ? `Publicado ${post.published_at ? new Date(post.published_at).toLocaleString("es-CO") : ""}`
            : "Sin publicar."}
        </p>
        {post.is_published ? (
          <form action={unpublishPostAction}>
            <input type="hidden" name="postId" value={post.id} />
            <button type="submit" className="rounded-[var(--radius)] border border-border px-4 py-2 text-sm font-medium text-text hover:border-danger hover:text-danger">
              Despublicar
            </button>
          </form>
        ) : (
          <form action={publishPostAction} className="flex flex-wrap items-end gap-3">
            <input type="hidden" name="postId" value={post.id} />
            <div className="flex flex-col gap-1">
              <label htmlFor="publishedAt" className="text-sm text-text-muted">
                Programar (opcional, vacío = ahora)
              </label>
              <input id="publishedAt" name="publishedAt" type="datetime-local" className="rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm" />
            </div>
            <button type="submit" className="rounded-[var(--radius)] bg-brand px-4 py-2 text-sm font-semibold text-text-inverse hover:bg-brand-hover">
              Publicar
            </button>
          </form>
        )}
      </div>

      <form action={updatePostAction} className="flex flex-col gap-4">
        <input type="hidden" name="postId" value={post.id} />

        <div className="flex flex-col gap-1">
          <label htmlFor="slug" className="text-sm text-text-muted">
            Slug
          </label>
          <input id="slug" name="slug" required defaultValue={post.slug} className="rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm" />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="title" className="text-sm text-text-muted">
            Título
          </label>
          <input id="title" name="title" required defaultValue={post.title} className="rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm" />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="excerpt" className="text-sm text-text-muted">
            Extracto (opcional)
          </label>
          <input id="excerpt" name="excerpt" defaultValue={post.excerpt ?? ""} className="rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm" />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="body" className="text-sm text-text-muted">
            Cuerpo (texto/markdown plano)
          </label>
          <textarea id="body" name="body" rows={10} defaultValue={post.body ?? ""} className="rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm" />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="coverUrl" className="text-sm text-text-muted">
            URL de portada (opcional — sin subida de archivo, sin R2)
          </label>
          <input
            id="coverUrl"
            name="coverUrl"
            type="url"
            defaultValue={post.cover_url ?? ""}
            className="rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="category" className="text-sm text-text-muted">
            Categoría (opcional)
          </label>
          <input
            id="category"
            name="category"
            defaultValue={post.category ?? ""}
            className="rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="seoTitle" className="text-sm text-text-muted">
            SEO — título (opcional)
          </label>
          <input
            id="seoTitle"
            name="seoTitle"
            defaultValue={post.seo_title ?? ""}
            className="rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="seoDescription" className="text-sm text-text-muted">
            SEO — descripción (opcional)
          </label>
          <input
            id="seoDescription"
            name="seoDescription"
            defaultValue={post.seo_description ?? ""}
            className="rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm"
          />
        </div>

        <button
          type="submit"
          className="self-start rounded-[var(--radius)] bg-brand px-4 py-2 text-sm font-semibold text-text-inverse transition-colors hover:bg-brand-hover"
        >
          Guardar cambios
        </button>
      </form>

      <Link href="/admin/blog" className="text-sm text-brand hover:underline">
        Ver blog
      </Link>
    </div>
  );
}
