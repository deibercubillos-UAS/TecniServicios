import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { createServerClient } from "@tecni/db";
import { serverEnv } from "@tecni/shared";

interface PostRow {
  slug: string;
  title: string;
  body: string | null;
  cover_url: string | null;
  seo_title: string | null;
  seo_description: string | null;
  published_at: string;
}

async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(serverEnv.NEXT_PUBLIC_SUPABASE_URL, serverEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    getAll: () => cookieStore.getAll(),
    setAll: () => {},
  });
}

async function getPost(slug: string): Promise<PostRow | null> {
  const supabase = await getSupabase();
  const { data } = await supabase
    .from("posts")
    .select("slug,title,body,cover_url,seo_title,seo_description,published_at")
    .eq("slug", slug)
    .maybeSingle();
  return data as PostRow | null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: "Artículo no encontrado — Tecni Equipos y Servicios SAS" };
  return {
    title: `${post.seo_title ?? post.title} — Tecni Equipos y Servicios SAS`,
    description: post.seo_description ?? undefined,
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    return (
      <div className="mx-auto max-w-[700px] px-4 py-16">
        <h1 className="mb-4 text-2xl font-bold text-text">Artículo no encontrado</h1>
        <Link href="/blog" className="text-brand hover:underline">
          Ver blog
        </Link>
      </div>
    );
  }

  return (
    <article className="mx-auto flex max-w-[700px] flex-col gap-4 px-4 py-16">
      <p className="text-xs text-text-muted">{new Date(post.published_at).toLocaleDateString("es-CO")}</p>
      <h1 className="text-2xl font-bold text-text">{post.title}</h1>
      {post.cover_url ? <img src={post.cover_url} alt={post.title} className="w-full rounded-lg object-cover" /> : null}
      {post.body ? <div className="whitespace-pre-line text-sm leading-relaxed text-text">{post.body}</div> : null}

      <Link href="/blog" className="text-sm text-brand hover:underline">
        Ver blog
      </Link>
    </article>
  );
}
