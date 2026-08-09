import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { createServerClient } from "@tecni/db";
import { serverEnv } from "@tecni/shared";
import { Icon } from "@tecni/ui";

export const metadata: Metadata = {
  title: "Blog — Tecni Equipos y Servicios SAS",
  description: "Guías y noticias de Tecni Equipos y Servicios SAS sobre equipos y taller automotriz.",
};

interface PostRow {
  slug: string;
  title: string;
  excerpt: string | null;
  body: string | null;
  cover_url: string | null;
  category: string | null;
  published_at: string;
  author_id: string | null;
}

interface ProfileRow {
  id: string;
  full_name: string;
}

const WORDS_PER_MINUTE = 200;
const linkFocusClass = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

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

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; categoria?: string }>;
}) {
  const { q, categoria } = await searchParams;
  const supabase = await getSupabase();

  const { data: postsData } = await supabase
    .from("posts")
    .select("slug,title,excerpt,body,cover_url,category,published_at,author_id")
    .order("published_at", { ascending: false });
  const allPosts = (postsData as PostRow[] | null) ?? [];

  const authorIds = [...new Set(allPosts.map((p) => p.author_id).filter((id): id is string => Boolean(id)))];
  const { data: authorsData } =
    authorIds.length > 0 ? await supabase.from("profiles").select("id,full_name").in("id", authorIds) : { data: [] };
  const authorById = new Map(((authorsData as ProfileRow[] | null) ?? []).map((a) => [a.id, a.full_name]));

  // Pills reales: solo categorías que ya tienen al menos un artículo
  // publicado, nunca una lista fija inventada.
  const categories = [...new Set(allPosts.map((p) => p.category).filter((c): c is string => Boolean(c)))].sort();

  const searchQuery = q?.trim().toLowerCase() || null;
  const filtered = allPosts.filter((p) => {
    if (categoria && p.category !== categoria) return false;
    if (searchQuery) {
      const haystack = `${p.title} ${p.excerpt ?? ""}`.toLowerCase();
      if (!haystack.includes(searchQuery)) return false;
    }
    return true;
  });

  const [featured, ...rest] = filtered;
  const hasActiveFilters = Boolean(q || categoria);

  function buildHref(overrides: { q?: string | undefined; categoria?: string | undefined }) {
    const merged = { q, categoria, ...overrides };
    const params = new URLSearchParams();
    if (merged.q) params.set("q", merged.q);
    if (merged.categoria) params.set("categoria", merged.categoria);
    const qs = params.toString();
    return qs ? `/blog?${qs}` : "/blog";
  }

  return (
    <div className="flex flex-col">
      <section className="border-b border-border bg-surface py-16">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-6 px-4 md:px-6">
          <nav aria-label="Miga de pan" className="flex items-center gap-2 text-sm text-text-muted">
            <Link href="/" className="hover:text-brand">
              Inicio
            </Link>
            <Icon name="chevronRight" size={14} />
            <span className="font-semibold text-text">Blog y recursos técnicos</span>
          </nav>
          <h1 className="max-w-3xl text-3xl font-extrabold tracking-tight text-text md:text-5xl">
            Centro de conocimiento e ingeniería automotriz
          </h1>
          <p className="max-w-2xl text-text-muted">
            Guías técnicas y noticias para la optimización de tu taller automotriz e industrial.
          </p>
          <form action="/blog" method="get" className="flex max-w-xl gap-2">
            {categoria ? <input type="hidden" name="categoria" value={categoria} /> : null}
            <div className="relative flex-1">
              <Icon name="search" size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                name="q"
                defaultValue={q ?? ""}
                placeholder="Buscar guía técnica, mantenimiento, diagnóstico..."
                className="w-full rounded-[var(--radius)] border border-border bg-bg py-3 pl-10 pr-4 text-sm text-text placeholder:text-text-muted focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
              />
            </div>
            <button
              type="submit"
              className={`shrink-0 rounded-[var(--radius)] bg-brand px-5 py-3 text-sm font-semibold text-text-inverse transition-colors hover:bg-brand-hover ${linkFocusClass}`}
            >
              Buscar
            </button>
          </form>

          {categories.length > 0 || hasActiveFilters ? (
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={buildHref({ categoria: undefined })}
                aria-current={!categoria ? "page" : undefined}
                className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wide transition-colors ${linkFocusClass} ${
                  !categoria ? "border-text bg-text text-text-inverse" : "border-border text-text-muted hover:border-text hover:text-text"
                }`}
              >
                Todos
              </Link>
              {categories.map((c) => (
                <Link
                  key={c}
                  href={buildHref({ categoria: c })}
                  aria-current={categoria === c ? "page" : undefined}
                  className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wide transition-colors ${linkFocusClass} ${
                    categoria === c ? "border-text bg-text text-text-inverse" : "border-border text-text-muted hover:border-text hover:text-text"
                  }`}
                >
                  {c}
                </Link>
              ))}
              {hasActiveFilters ? (
                <Link href="/blog" className={`ml-2 flex items-center gap-1 text-xs font-medium text-text-muted hover:text-brand ${linkFocusClass}`}>
                  <Icon name="close" size={14} />
                  Limpiar filtros
                </Link>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>

      <div className="mx-auto flex max-w-[1280px] flex-col gap-16 px-4 py-16 md:px-6">
        {filtered.length === 0 ? (
          <p className="text-text-muted">
            {allPosts.length === 0 ? "Sin artículos publicados todavía." : "No hay artículos con estos filtros."}
          </p>
        ) : (
          <>
            {featured ? (
              <section className="grid grid-cols-1 overflow-hidden rounded-lg border border-border bg-surface md:grid-cols-2">
                {featured.cover_url ? (
                  <div className="h-64 md:h-full md:min-h-[360px]">
                    <img src={featured.cover_url} alt={featured.title} className="h-full w-full object-cover" />
                  </div>
                ) : (
                  <div className="hidden bg-bg-alt md:block" />
                )}
                <div className="flex flex-col justify-center gap-4 p-8 md:p-12">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded bg-brand-subtle px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand">
                      Artículo destacado
                    </span>
                    <span className="flex items-center gap-1 font-mono text-xs text-text-muted">
                      <Icon name="clock" size={14} />
                      {readTimeMinutes(featured.body)} min · {new Date(featured.published_at).toLocaleDateString("es-CO", { month: "long", year: "numeric" })}
                    </span>
                  </div>
                  <h2>
                    <Link
                      href={`/blog/${featured.slug}`}
                      className={`text-2xl font-bold text-text hover:text-brand md:text-3xl ${linkFocusClass}`}
                    >
                      {featured.title}
                    </Link>
                  </h2>
                  {featured.excerpt ? <p className="line-clamp-3 text-text-muted">{featured.excerpt}</p> : null}
                  {featured.author_id && authorById.get(featured.author_id) ? (
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-bg-alt text-text-muted">
                        <Icon name="user" size={18} />
                      </span>
                      <span className="text-sm font-semibold text-text">{authorById.get(featured.author_id)}</span>
                    </div>
                  ) : null}
                  <Link
                    href={`/blog/${featured.slug}`}
                    className={`inline-flex w-fit items-center gap-2 rounded-[var(--radius)] bg-brand px-6 py-3 text-sm font-bold uppercase tracking-wide text-text-inverse transition-colors hover:bg-brand-hover ${linkFocusClass}`}
                  >
                    Leer artículo completo
                    <Icon name="arrowRight" size={16} />
                  </Link>
                </div>
              </section>
            ) : null}

            {rest.length > 0 ? (
              <section className="flex flex-col gap-6">
                <h2 className="border-b border-border pb-2 text-lg font-bold text-text">Artículos recientes</h2>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                  {rest.map((post) => (
                    <article
                      key={post.slug}
                      className="group flex flex-col overflow-hidden rounded-lg border border-border bg-surface transition-colors hover:border-text"
                    >
                      <div className="relative h-48 bg-bg-alt">
                        {post.cover_url ? (
                          <img
                            src={post.cover_url}
                            alt={post.title}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : null}
                        {post.category ? (
                          <span className="absolute left-3 top-3 rounded bg-surface/90 px-2 py-1 text-xs font-semibold text-text backdrop-blur-sm">
                            {post.category}
                          </span>
                        ) : null}
                      </div>
                      <div className="flex flex-1 flex-col gap-3 p-6">
                        <h3 className="font-semibold text-text">
                          <Link href={`/blog/${post.slug}`} className={`hover:text-brand group-hover:text-brand ${linkFocusClass}`}>
                            {post.title}
                          </Link>
                        </h3>
                        {post.excerpt ? <p className="flex-1 text-sm text-text-muted">{post.excerpt}</p> : null}
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1 font-mono text-xs text-text-muted">
                            <Icon name="clock" size={12} />
                            {readTimeMinutes(post.body)} min
                          </span>
                          <Link
                            href={`/blog/${post.slug}`}
                            className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-brand hover:underline"
                          >
                            Leer más
                            <Icon name="arrowRight" size={14} />
                          </Link>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
