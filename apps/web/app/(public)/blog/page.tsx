import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { createServerClient } from "@tecni/db";
import { serverEnv } from "@tecni/shared";

export const metadata: Metadata = {
  title: "Blog — Tecni Equipos y Servicios SAS",
  description: "Guías y noticias de Tecni Equipos y Servicios SAS sobre equipos y taller automotriz.",
};

interface PostRow {
  slug: string;
  title: string;
  excerpt: string | null;
  cover_url: string | null;
  published_at: string;
}

async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(serverEnv.NEXT_PUBLIC_SUPABASE_URL, serverEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    getAll: () => cookieStore.getAll(),
    setAll: () => {},
  });
}

export default async function BlogPage() {
  const supabase = await getSupabase();

  const { data: postsData } = await supabase
    .from("posts")
    .select("slug,title,excerpt,cover_url,published_at")
    .order("published_at", { ascending: false });
  const posts = (postsData as PostRow[] | null) ?? [];

  return (
    <div className="mx-auto flex max-w-[900px] flex-col gap-6 px-4 py-16">
      <h1 className="text-2xl font-bold text-text">Blog</h1>

      {posts.length === 0 ? (
        <p className="text-text-muted">Sin artículos publicados todavía.</p>
      ) : (
        <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {posts.map((post) => (
            <li key={post.slug} className="flex flex-col gap-2 rounded-lg border border-border p-4">
              {post.cover_url ? <img src={post.cover_url} alt={post.title} className="h-40 w-full rounded object-cover" /> : null}
              <Link href={`/blog/${post.slug}`} className="font-semibold text-text hover:text-brand">
                {post.title}
              </Link>
              {post.excerpt ? <p className="text-sm text-text-muted">{post.excerpt}</p> : null}
              <p className="text-xs text-text-muted">{new Date(post.published_at).toLocaleDateString("es-CO")}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
