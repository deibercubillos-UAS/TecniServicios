import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { createServerClient } from "@tecni/db";
import { formatCop, serverEnv } from "@tecni/shared";
import { resolvePrice } from "@tecni/core";
import { Badge, Icon, ProductCard, buttonClass } from "@tecni/ui";

import { FavoriteButton } from "@/components/favorite-button";
import { CategoryHeroCarousel } from "@/components/category-hero-carousel";
import { ProductCoverflowHero } from "@/components/product-coverflow-hero";
import { CATEGORY_ICON } from "@/lib/category-icons";

interface CategoryRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  image_url: string | null;
}

interface CatalogProductRow {
  id: string;
  slug: string;
  name: string;
  brand_id: string | null;
  stock_status: string;
}

interface BrandRow {
  id: string;
  name: string;
}

async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(serverEnv.NEXT_PUBLIC_SUPABASE_URL, serverEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    getAll: () => cookieStore.getAll(),
    setAll: () => {},
  });
}

async function getCategory(slug: string) {
  const supabase = await getSupabase();
  const { data } = await supabase
    .from("categories")
    .select("id,slug,name,description,image_url")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  return { supabase, category: data as CategoryRow | null };
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { category } = await getCategory(slug);
  if (!category) return { title: "Categoría no encontrada" };

  return {
    title: category.name,
    description: category.description ?? `Catálogo de ${category.name} — Tecni Equipos y Servicios SAS.`,
    alternates: { canonical: `/catalogo/categoria/${category.slug}` },
  };
}

/** Página dedicada de categoría, benchmark es.hunter.com/es-int/maquinas-
 * de-alineacion/: hero interactivo + grid de productos reales debajo,
 * todo en la misma URL. El hero prioriza `ProductCoverflowHero` (los
 * productos reales de la categoría, foto completa sin recortar, flechas
 * para rotar sin navegar, clic navega a la ficha — docs/tasks/done/
 * DONE-hero-coverflow-producto.md); sin productos cae a
 * `CategoryHeroCarousel` (banners `category_hero`), y sin banners al
 * fallback estático de ícono. El grid es una vista simple sin sidebar de
 * filtros — para filtrar por marca/precio/orden, un link lleva al grid
 * completo de /catalogo. */
export default async function CategoriaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { supabase, category } = await getCategory(slug);
  if (!category) notFound();

  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id ?? null;

  const [{ data: heroBannersData }, { data: productsData }] = await Promise.all([
    supabase
      .from("banners")
      .select("id,image_url")
      .eq("placement", "category_hero")
      .eq("category_id", category.id)
      .eq("is_active", true)
      .order("position"),
    supabase
      .from("public_products")
      .select("id,slug,name,brand_id,stock_status")
      .eq("category_id", category.id)
      .order("name"),
  ]);

  const heroBanners = ((heroBannersData as { id: string; image_url: string }[] | null) ?? []).map((b) => ({ id: b.id, url: b.image_url }));
  const products = (productsData as CatalogProductRow[] | null) ?? [];

  const brandIds = [...new Set(products.map((p) => p.brand_id).filter((id): id is string => Boolean(id)))];
  const { data: brandsData } = brandIds.length > 0 ? await supabase.from("brands").select("id,name").in("id", brandIds) : { data: [] };
  const brands = (brandsData as BrandRow[] | null) ?? [];

  const productIds = products.map((p) => p.id);
  const { data: imagesData } =
    productIds.length > 0
      ? await supabase
          .from("product_images")
          .select("product_id,url,alt,is_primary,is_hero")
          .in("product_id", productIds)
          .or("is_primary.eq.true,is_hero.eq.true")
      : { data: [] };
  const productImages = (imagesData as { product_id: string; url: string; alt: string | null; is_primary: boolean; is_hero: boolean }[] | null) ?? [];
  const imageByProduct = new Map(productImages.filter((img) => img.is_primary).map((img) => [img.product_id, img]));
  const heroImageByProduct = new Map(productImages.filter((img) => img.is_hero).map((img) => [img.product_id, img]));

  const { data: priceRowsData } =
    userId && productIds.length > 0
      ? await supabase.from("products").select("id,price_cop,price_synced_at").in("id", productIds)
      : { data: [] };
  const priceByProduct = new Map(((priceRowsData as { id: string; price_cop: number | null; price_synced_at: string | null }[] | null) ?? []).map((row) => [row.id, row]));

  const { data: favoritesData } =
    userId && productIds.length > 0
      ? await supabase.from("favorites").select("product_id").eq("profile_id", userId).in("product_id", productIds)
      : { data: [] };
  const favoritedIds = new Set(((favoritesData as { product_id: string }[] | null) ?? []).map((f) => f.product_id));

  const meta = `${products.length} referencias`;

  return (
    <main>
      {products.length > 0 ? (
        <section
          className="bg-bg-inverse"
          style={{ background: "radial-gradient(ellipse 70% 55% at 50% 18%, #333333 0%, var(--bg-inverse) 60%)" }}
        >
          <div className="mx-auto max-w-[1280px] px-4 pt-8 text-center md:px-6 md:pt-10">
            <h1 className="text-2xl font-extrabold uppercase tracking-tight text-text-inverse md:text-4xl">{category.name}</h1>
            {category.description ? (
              <p className="mx-auto mt-2 max-w-xl text-text-inverse-muted md:text-lg">{category.description}</p>
            ) : null}
            <span className="mt-1 block text-xs font-semibold uppercase tracking-wide text-text-inverse-muted md:text-sm">{meta}</span>
          </div>
          <ProductCoverflowHero
            products={products.map((product) => ({
              id: product.id,
              slug: product.slug,
              name: product.name,
              imageUrl: heroImageByProduct.get(product.id)?.url ?? null,
            }))}
          />
        </section>
      ) : heroBanners.length > 0 ? (
        <section>
          <CategoryHeroCarousel images={heroBanners}>
            <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-subtle">
              <Icon name={CATEGORY_ICON[category.slug] ?? "box"} size={28} className="text-brand" />
            </span>
            <h1 className="text-3xl font-extrabold uppercase tracking-tight text-text-inverse md:text-4xl">{category.name}</h1>
            {category.description ? <p className="mt-2 max-w-md text-text-inverse-muted">{category.description}</p> : null}
            <span className="mt-2 text-sm font-semibold uppercase tracking-wide text-text-inverse-muted">{meta}</span>
            <a href="#productos" className={`${buttonClass("primary")} mt-4 w-fit`}>
              Ver productos
              <Icon name="arrowRight" size={18} />
            </a>
          </CategoryHeroCarousel>
        </section>
      ) : (
        <section className="bg-bg-inverse py-16 md:py-24">
          <div className="mx-auto flex max-w-[1280px] flex-col items-start gap-4 px-4 md:px-6">
            <Badge>Catálogo por categoría</Badge>
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-subtle">
              <Icon name={CATEGORY_ICON[category.slug] ?? "box"} size={28} className="text-brand" />
            </span>
            <h1 className="text-3xl font-extrabold uppercase tracking-tight text-text-inverse md:text-5xl">{category.name}</h1>
            {category.description ? <p className="max-w-xl text-lg text-text-inverse-muted">{category.description}</p> : null}
            <span className="text-sm font-semibold uppercase tracking-wide text-text-inverse-muted">{meta}</span>
          </div>
        </section>
      )}

      <section id="productos" className="scroll-mt-24 bg-bg py-16">
        <div className="mx-auto max-w-[1280px] px-4 md:px-6">
          <div className="mb-10 flex items-end justify-between">
            <h2 className="text-2xl font-bold text-text">Productos de {category.name}</h2>
            <Link href={`/catalogo?categoria=${category.slug}`} className="hidden text-sm font-medium text-brand hover:underline sm:block">
              Ver todo en el catálogo
            </Link>
          </div>

          {products.length === 0 ? (
            <p className="text-text-muted">Todavía no hay productos publicados en esta categoría.</p>
          ) : (
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
              {products.map((product) => {
                const brand = product.brand_id ? brands.find((b) => b.id === product.brand_id) : undefined;
                const image = imageByProduct.get(product.id);
                const priceRow = priceByProduct.get(product.id);
                const resolution = resolvePrice({ priceCop: priceRow?.price_cop ?? null, priceSyncedAt: priceRow?.price_synced_at ?? null }, { userId });
                return (
                  <Link key={product.id} href={`/catalogo/${product.slug}`}>
                    <ProductCard
                      name={product.name}
                      brandName={brand?.name ?? null}
                      imageUrl={image?.url ?? null}
                      imageAlt={image?.alt ?? product.name}
                      price={
                        resolution.visible
                          ? { visible: true, label: formatCop(resolution.priceCop), unconfirmed: resolution.confidence === "unconfirmed" }
                          : { visible: false }
                      }
                      cornerAction={userId ? <FavoriteButton productId={product.id} initialFavorited={favoritedIds.has(product.id)} /> : undefined}
                      stockLabel={product.stock_status === "in_stock" ? "En stock" : undefined}
                    />
                  </Link>
                );
              })}
            </div>
          )}

          <Link href={`/catalogo?categoria=${category.slug}`} className="mt-8 block text-center text-sm font-medium text-brand hover:underline sm:hidden">
            Ver todo en el catálogo
          </Link>
        </div>
      </section>
    </main>
  );
}
