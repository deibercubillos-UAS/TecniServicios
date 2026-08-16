import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { createServerClient } from "@tecni/db";
import { serverEnv } from "@tecni/shared";
import { Badge, Icon, buttonClass } from "@tecni/ui";
import { CATEGORY_ICON } from "../../../../lib/category-icons";
import { CategoryHeroCarousel } from "../../../../components/category-hero-carousel";

export const metadata: Metadata = {
  title: "Categorías",
  description: "Todas las categorías del catálogo de Tecni Equipos y Servicios SAS.",
  alternates: { canonical: "/catalogo/categorias" },
};

interface CategoryRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  image_url: string | null;
}

async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(serverEnv.NEXT_PUBLIC_SUPABASE_URL, serverEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    getAll: () => cookieStore.getAll(),
    setAll: () => {},
  });
}

/** Página editorial estilo es.hunter.com/es-int/maquinas-de-alineacion/:
 * pestañas ancla arriba (una por categoría real) que saltan a bloques
 * alternados foto grande / texto. Cada bloque enlaza al grid ya filtrado
 * (/catalogo?categoria=slug) — no duplica lógica de catálogo. Sin sticky
 * en las pestañas (simplificación deliberada, ver docs/tasks/done/DONE-
 * landing-categorias.md). */
export default async function CategoriasPage() {
  const supabase = await getSupabase();

  const [{ data: categoriesData }, { data: activeProductsData }, { data: categoryHeroBannersData }] = await Promise.all([
    supabase.from("categories").select("id,slug,name,description,image_url").eq("is_active", true).order("position"),
    supabase.from("public_products").select("category_id"),
    supabase.from("banners").select("id,category_id,image_url").eq("placement", "category_hero").eq("is_active", true).order("position"),
  ]);

  const categories = (categoriesData as CategoryRow[] | null) ?? [];
  const productCountByCategory = new Map<string, number>();
  for (const row of (activeProductsData as { category_id: string }[] | null) ?? []) {
    productCountByCategory.set(row.category_id, (productCountByCategory.get(row.category_id) ?? 0) + 1);
  }

  // Fotos reales cargadas por el master desde /admin/banners
  // (placement `category_hero`) — sin ninguna, la categoría cae al
  // bloque estático de siempre (image_url o ícono), nunca una foto de
  // stock inventada.
  const heroBannersByCategory = new Map<string, { id: string; url: string }[]>();
  for (const banner of (categoryHeroBannersData as { id: string; category_id: string | null; image_url: string }[] | null) ?? []) {
    if (!banner.category_id) continue;
    const list = heroBannersByCategory.get(banner.category_id) ?? [];
    list.push({ id: banner.id, url: banner.image_url });
    heroBannersByCategory.set(banner.category_id, list);
  }

  return (
    <main>
      <section className="bg-bg-inverse py-16 md:py-24">
        <div className="mx-auto max-w-[1280px] px-4 md:px-6">
          <Badge>Catálogo por categoría</Badge>
          <h1 className="mt-6 max-w-2xl text-4xl font-extrabold uppercase tracking-tight text-text-inverse md:text-5xl">
            Categorías
          </h1>
          <p className="mt-4 max-w-xl text-lg text-text-inverse-muted">
            Cada categoría con su inventario real, actualizado — elige la que necesitas.
          </p>
        </div>
      </section>

      {categories.length > 0 ? (
        <nav aria-label="Categorías" className="border-b border-border bg-surface py-4">
          <ul className="mx-auto flex max-w-[1280px] flex-wrap gap-2 px-4 md:px-6">
            {categories.map((category) => (
              <li key={category.id}>
                <a
                  href={`#${category.slug}`}
                  className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-bold uppercase tracking-wide text-text transition-colors hover:border-brand hover:text-brand focus-visible:outline-2 focus-visible:outline-brand"
                >
                  <Icon name={CATEGORY_ICON[category.slug] ?? "box"} size={16} />
                  {category.name}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}

      {categories.map((category, index) => {
        const meta = `${productCountByCategory.get(category.id) ?? 0} referencias`;
        const imageOnRight = index % 2 === 0;
        const heroBanners = heroBannersByCategory.get(category.id) ?? [];

        if (heroBanners.length > 0) {
          return (
            <section key={category.id} id={category.slug} className="scroll-mt-24 border-b border-border">
              <CategoryHeroCarousel images={heroBanners}>
                <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-subtle">
                  <Icon name={CATEGORY_ICON[category.slug] ?? "box"} size={28} className="text-brand" />
                </span>
                <h2 className="text-3xl font-extrabold uppercase tracking-tight text-text-inverse md:text-4xl">{category.name}</h2>
                {category.description ? <p className="mt-2 max-w-md text-text-inverse-muted">{category.description}</p> : null}
                <span className="mt-2 text-sm font-semibold uppercase tracking-wide text-text-inverse-muted">{meta}</span>
                <Link href={`/catalogo?categoria=${category.slug}`} className={`${buttonClass("primary")} mt-4 w-fit`}>
                  Ver categoría
                  <Icon name="arrowRight" size={18} />
                </Link>
              </CategoryHeroCarousel>
            </section>
          );
        }

        const textBlock = (
          <div className="flex flex-col items-start gap-4 px-4 py-16 md:px-6">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-subtle">
              <Icon name={CATEGORY_ICON[category.slug] ?? "box"} size={28} className="text-brand" />
            </span>
            <h2 className="text-3xl font-extrabold uppercase tracking-tight text-text md:text-4xl">
              {category.name}
            </h2>
            {category.description ? (
              <p className="max-w-md text-text-muted">{category.description}</p>
            ) : null}
            <span className="text-sm font-semibold uppercase tracking-wide text-text-muted">{meta}</span>
            <Link href={`/catalogo?categoria=${category.slug}`} className={buttonClass("primary")}>
              Ver categoría
              <Icon name="arrowRight" size={18} />
            </Link>
          </div>
        );

        const imageBlock = category.image_url ? (
          <div className="aspect-[4/3] w-full md:aspect-auto md:h-full md:min-h-[360px]">
            <img src={category.image_url} alt="" className="h-full w-full object-cover" />
          </div>
        ) : (
          <div className="flex aspect-[4/3] w-full items-center justify-center bg-bg-alt md:aspect-auto md:h-full md:min-h-[360px]">
            <Icon name={CATEGORY_ICON[category.slug] ?? "box"} size={96} className="text-border-strong" />
          </div>
        );

        return (
          <section
            key={category.id}
            id={category.slug}
            className="scroll-mt-24 border-b border-border bg-bg"
          >
            <div className={`mx-auto grid max-w-[1280px] items-center md:grid-cols-2 ${imageOnRight ? "" : "md:[&>*:first-child]:order-2"}`}>
              {textBlock}
              {imageBlock}
            </div>
          </section>
        );
      })}
    </main>
  );
}
