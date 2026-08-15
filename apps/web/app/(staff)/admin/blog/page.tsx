import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { createServerClient } from "@tecni/db";
import { serverEnv } from "@tecni/shared";
import { Icon } from "@tecni/ui";

import { StatusBadge } from "@/components/status-badge";

export const metadata: Metadata = {
  title: "Blog — Panel maestro",
};

interface PostRow {
  id: string;
  title: string;
  slug: string;
  cover_url: string | null;
  category: string | null;
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

export default async function AdminBlogPage({ searchParams }: { searchParams: Promise<{ created?: string }> }) {
  const { created } = await searchParams;
  const supabase = await getSupabase();

  const { data: postsData } = await supabase
    .from("posts")
    .select("id,title,slug,cover_url,category,is_published,published_at")
    .order("created_at", { ascending: false });
  const posts = (postsData as PostRow[] | null) ?? [];

  return (
    <div className="mx-auto flex max-w-[700px] flex-col gap-6 px-4 py-16">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-text">Blog</h1>
          <p className="text-sm text-text-muted">Posts del sitio público, con borrador/publicado por separado.</p>
        </div>
        <Link
          href="/admin/blog/nuevo"
          className="flex shrink-0 items-center gap-2 rounded-[var(--radius)] bg-brand px-4 py-2 text-sm font-semibold text-text-inverse transition-colors hover:bg-brand-hover"
        >
          <Icon name="document" size={16} />
          Nuevo post
        </Link>
      </div>

      {created ? (
        <p className="flex items-center gap-2 rounded-[var(--radius)] border border-success bg-success/10 px-3 py-2 text-sm text-success">
          <Icon name="checkCircle" size={16} />
          Post creado como borrador.
        </p>
      ) : null}

      {posts.length === 0 ? (
        <p className="rounded-[var(--radius)] border border-dashed border-border bg-bg-alt px-4 py-6 text-center text-sm text-text-muted">
          Todavía no hay posts.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {posts.map((post) => (
            <li key={post.id} className="group flex items-center gap-3 rounded-xl border border-border bg-surface p-3 transition-colors hover:border-brand">
              <Link href={`/admin/blog/${post.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                <div className="flex h-14 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-bg-alt">
                  {post.cover_url ? (
                    <img src={post.cover_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <Icon name="document" size={20} className="text-text-muted" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-text group-hover:text-brand">{post.title}</p>
                  <p className="truncate text-xs text-text-muted">
                    {post.slug}
                    {post.category ? ` · ${post.category}` : ""}
                    {post.is_published && post.published_at ? ` · publica ${new Date(post.published_at).toLocaleString("es-CO")}` : ""}
                  </p>
                  <div className="mt-1">
                    {post.is_published ? (
                      <StatusBadge label="Publicado" tone="success" icon="checkCircle" />
                    ) : (
                      <StatusBadge label="Borrador" tone="muted" icon="close" />
                    )}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
