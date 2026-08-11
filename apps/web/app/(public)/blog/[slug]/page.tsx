import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { createServerClient } from "@tecni/db";
import { serverEnv } from "@tecni/shared";
import { Icon } from "@tecni/ui";

interface PostRow {
  slug: string;
  title: string;
  body: string | null;
  cover_url: string | null;
  category: string | null;
  author_id: string | null;
  seo_title: string | null;
  seo_description: string | null;
  published_at: string;
}

interface ProfileRow {
  full_name: string;
}

const WORDS_PER_MINUTE = 200;

function readTimeMinutes(body: string | null): number {
  if (!body) return 1;
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(serverEnv.NEXT_PUBLIC_SUPABASE_URL, serverEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    getAll: () => cookieStore.getAll(),
    setAll: () => {},
  });
}

async function getPost(slug: string): Promise<{ post: PostRow | null; authorName: string | null }> {
  const supabase = await getSupabase();
  const { data } = await supabase
    .from("posts")
    .select("slug,title,body,cover_url,category,author_id,seo_title,seo_description,published_at")
    .eq("slug", slug)
    .maybeSingle();
  const post = data as PostRow | null;

  let authorName: string | null = null;
  if (post?.author_id) {
    const { data: authorData } = await supabase.from("profiles").select("full_name").eq("id", post.author_id).maybeSingle();
    authorName = (authorData as ProfileRow | null)?.full_name ?? null;
  }

  return { post, authorName };
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { post } = await getPost(slug);
  if (!post) return { title: "Artículo no encontrado" };

  const title = post.seo_title ?? post.title;
  const description = post.seo_description ?? undefined;

  return {
    title,
    description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title,
      description,
      url: `/blog/${post.slug}`,
      type: "article",
      publishedTime: post.published_at,
      ...(post.cover_url ? { images: [{ url: post.cover_url }] } : {}),
    },
    twitter: {
      card: post.cover_url ? "summary_large_image" : "summary",
      title,
      description,
      ...(post.cover_url ? { images: [post.cover_url] } : {}),
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { post, authorName } = await getPost(slug);

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

  // schema.org/BlogPosting — mismo criterio que el JSON-LD de producto
  // (docs/12-MODULE-CATALOG.md sección 9): solo campos con dato real.
  const postJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.seo_description ?? undefined,
    image: post.cover_url ?? undefined,
    datePublished: post.published_at,
    author: authorName ? { "@type": "Person", name: authorName } : undefined,
    publisher: { "@type": "Organization", name: "Tecni Equipos y Servicios SAS" },
  };

  const siteUrl = serverEnv.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Blog", item: `${siteUrl}/blog` },
      { "@type": "ListItem", position: 2, name: post.title, item: `${siteUrl}/blog/${post.slug}` },
    ],
  };

  return (
    <article className="mx-auto flex max-w-[760px] flex-col gap-6 px-4 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(postJsonLd).replace(/</g, "\\u003c") }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, "\\u003c") }}
      />
      <nav aria-label="Miga de pan" className="flex flex-wrap items-center gap-2 text-sm text-text-muted">
        <Link href="/" className="hover:text-brand">
          Inicio
        </Link>
        <Icon name="chevronRight" size={14} />
        <Link href="/blog" className="hover:text-brand">
          Blog
        </Link>
        <Icon name="chevronRight" size={14} />
        <span className="font-semibold text-text">{post.title}</span>
      </nav>

      <div className="flex flex-wrap items-center gap-3">
        {post.category ? (
          <span className="rounded bg-brand-subtle px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand">{post.category}</span>
        ) : null}
        <span className="flex items-center gap-1 font-mono text-xs text-text-muted">
          <Icon name="clock" size={14} />
          {readTimeMinutes(post.body)} min · {new Date(post.published_at).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" })}
        </span>
      </div>

      <h1 className="text-3xl font-extrabold tracking-tight text-text">{post.title}</h1>

      {authorName ? (
        <div className="flex items-center gap-3 border-b border-border pb-6">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-bg-alt text-text-muted">
            <Icon name="user" size={18} />
          </span>
          <span className="text-sm font-semibold text-text">{authorName}</span>
        </div>
      ) : null}

      {post.cover_url ? <img src={post.cover_url} alt={post.title} className="w-full rounded-lg object-cover" /> : null}
      {post.body ? <div className="whitespace-pre-line text-base leading-relaxed text-text">{post.body}</div> : null}

      <Link href="/blog" className="text-sm font-semibold text-brand hover:underline">
        Ver todos los artículos
      </Link>
    </article>
  );
}
