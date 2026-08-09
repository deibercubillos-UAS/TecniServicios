import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { createServerClient } from "@tecni/db";
import { serverEnv } from "@tecni/shared";

export const metadata: Metadata = {
  title: "Blog — Panel maestro",
};

interface PostRow {
  id: string;
  title: string;
  slug: string;
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

  const { data: postsData } = await supabase.from("posts").select("id,title,slug,is_published,published_at").order("created_at", { ascending: false });
  const posts = (postsData as PostRow[] | null) ?? [];

  return (
    <div className="mx-auto flex max-w-[700px] flex-col gap-6 px-4 py-16">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold text-text">Blog</h1>
        <Link
          href="/admin/blog/nuevo"
          className="rounded-[var(--radius)] bg-brand px-4 py-2 text-sm font-semibold text-text-inverse transition-colors hover:bg-brand-hover"
        >
          Nuevo post
        </Link>
      </div>

      {created ? (
        <p className="rounded-[var(--radius)] border border-success bg-success/10 px-3 py-2 text-sm text-success">Post creado como borrador.</p>
      ) : null}

      {posts.length === 0 ? (
        <p className="text-text-muted">Sin posts.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-border rounded-lg border border-border">
          {posts.map((post) => (
            <li key={post.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
              <div>
                <Link href={`/admin/blog/${post.id}`} className="font-medium text-text hover:text-brand">
                  {post.title}
                </Link>
                <p className="text-xs text-text-muted">
                  {post.slug}
                  {post.is_published && post.published_at ? ` · publica ${new Date(post.published_at).toLocaleString("es-CO")}` : ""}
                </p>
              </div>
              <span
                className={
                  post.is_published
                    ? "rounded-full border border-success px-3 py-1 text-xs font-medium text-success"
                    : "rounded-full border border-border px-3 py-1 text-xs font-medium text-text-muted"
                }
              >
                {post.is_published ? "Publicado" : "Borrador"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
