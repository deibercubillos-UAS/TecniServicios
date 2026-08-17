import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { createServerClient } from "@tecni/db";
import { formatCop, serverEnv } from "@tecni/shared";
import { resolvePrice } from "@tecni/core";
import { Icon, ProductCard } from "@tecni/ui";

import { CompareToggle } from "@/components/compare-toggle";
import { FavoriteButton } from "@/components/favorite-button";
import { ProductGallery } from "@/components/product-gallery";
import { ProductTabs } from "@/components/product-tabs";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { StickyProductCta } from "@/components/sticky-product-cta";
import { addToCartAction } from "@/app/(commerce)/carrito/actions";

interface RelatedProductRow {
  id: string;
  slug: string;
  name: string;
  brand_id: string | null;
}

interface PublicProductDetail {
  id: string;
  sku: string;
  slug: string;
  name: string;
  short_description: string | null;
  description: string | null;
  category_id: string;
  brand_id: string | null;
  stock_status: string;
  video_url: string | null;
}

interface ProductBenefitRow {
  id: string;
  title: string;
  description: string;
  position: number;
}

interface CategoryRow {
  id: string;
  name: string;
  slug: string;
}

interface BrandRow {
  id: string;
  name: string;
}

interface ProductImageRow {
  url: string;
  alt: string | null;
  position: number;
  is_primary: boolean;
}

interface AttributeDefinitionRow {
  id: string;
  key: string;
  label: string;
  unit: string | null;
  data_type: string;
  position: number;
}

interface ProductAttributeRow {
  definition_id: string;
  value_text: string | null;
  value_number: number | null;
  value_boolean: boolean | null;
}

async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(serverEnv.NEXT_PUBLIC_SUPABASE_URL, serverEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    getAll: () => cookieStore.getAll(),
    setAll: () => {},
  });
}

async function getProduct(slug: string) {
  const supabase = await getSupabase();
  const { data } = await supabase
    .from("public_products")
    .select("id,sku,slug,name,short_description,description,category_id,brand_id,stock_status,video_url")
    .eq("slug", slug)
    .maybeSingle();
  return { supabase, product: data as PublicProductDetail | null };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { supabase, product } = await getProduct(slug);
  if (!product) return { title: "Producto no encontrado" };

  const { data: imageData } = await supabase
    .from("product_images")
    .select("url")
    .eq("product_id", product.id)
    .eq("is_primary", true)
    .maybeSingle();
  const image = (imageData as { url: string } | null)?.url;

  return {
    title: product.name,
    description: product.short_description ?? undefined,
    alternates: { canonical: `/catalogo/${product.slug}` },
    openGraph: {
      title: product.name,
      description: product.short_description ?? undefined,
      url: `/catalogo/${product.slug}`,
      type: "website",
      ...(image ? { images: [{ url: image }] } : {}),
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: product.name,
      description: product.short_description ?? undefined,
      ...(image ? { images: [image] } : {}),
    },
  };
}

/** Convierte una URL de YouTube/Vimeo (formato de enlace normal, el que
 * pega el master en /admin/productos) a su URL de embed — validado en
 * `updateProductVideo` (packages/core), acá solo se transforma. */
function toEmbedUrl(videoUrl: string): string | null {
  const youtubeWatch = videoUrl.match(/youtube\.com\/watch\?v=([\w-]+)/);
  if (youtubeWatch) return `https://www.youtube.com/embed/${youtubeWatch[1]}`;
  const youtubeShort = videoUrl.match(/youtu\.be\/([\w-]+)/);
  if (youtubeShort) return `https://www.youtube.com/embed/${youtubeShort[1]}`;
  if (videoUrl.includes("player.vimeo.com/video/")) return videoUrl;
  const vimeo = videoUrl.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return null;
}

function formatAttributeValue(def: AttributeDefinitionRow, attr: ProductAttributeRow): string | null {
  if (def.data_type === "boolean") {
    if (attr.value_boolean === null) return null;
    return attr.value_boolean ? "Sí" : "No";
  }
  if (def.data_type === "number") {
    if (attr.value_number === null) return null;
    return def.unit ? `${attr.value_number} ${def.unit}` : String(attr.value_number);
  }
  if (attr.value_text === null) return null;
  return def.unit ? `${attr.value_text} ${def.unit}` : attr.value_text;
}

export default async function ProductoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { supabase, product } = await getProduct(slug);
  if (!product) notFound();

  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id ?? null;

  const [{ data: categoryData }, { data: brandData }, { data: imagesData }, { data: definitionsData }, { data: attributesData }, { data: benefitsData }] =
    await Promise.all([
      supabase.from("categories").select("id,name,slug").eq("id", product.category_id).maybeSingle() as unknown as Promise<{
        data: CategoryRow | null;
      }>,
      product.brand_id
        ? (supabase.from("brands").select("id,name").eq("id", product.brand_id).maybeSingle() as unknown as Promise<{
            data: BrandRow | null;
          }>)
        : Promise.resolve({ data: null }),
      supabase
        .from("product_images")
        .select("url,alt,position,is_primary")
        .eq("product_id", product.id)
        .order("position") as unknown as Promise<{ data: ProductImageRow[] | null }>,
      supabase
        .from("attribute_definitions")
        .select("id,key,label,unit,data_type,position")
        .eq("category_id", product.category_id)
        .order("position") as unknown as Promise<{ data: AttributeDefinitionRow[] | null }>,
      supabase
        .from("product_attributes")
        .select("definition_id,value_text,value_number,value_boolean")
        .eq("product_id", product.id) as unknown as Promise<{ data: ProductAttributeRow[] | null }>,
      supabase
        .from("product_benefits")
        .select("id,title,description,position")
        .eq("product_id", product.id)
        .order("position") as unknown as Promise<{ data: ProductBenefitRow[] | null }>,
    ]);

  const category = categoryData;
  const brand = brandData;
  const images = [...(imagesData ?? [])].sort((a, b) => Number(b.is_primary) - Number(a.is_primary));
  const definitions = definitionsData ?? [];
  const attributesByDefinition = new Map((attributesData ?? []).map((a) => [a.definition_id, a]));
  const benefits = benefitsData ?? [];

  const specs = definitions
    .map((def) => {
      const attr = attributesByDefinition.get(def.id);
      if (!attr) return null;
      const value = formatAttributeValue(def, attr);
      if (value === null) return null;
      return { label: def.label, value };
    })
    .filter((s): s is { label: string; value: string } => s !== null);

  let priceRow: { price_cop: number | null; price_synced_at: string | null } | null = null;
  let isFavorited = false;
  if (userId) {
    const [{ data: priceData }, { data: favoriteData }] = await Promise.all([
      supabase.from("products").select("price_cop,price_synced_at").eq("id", product.id).maybeSingle(),
      supabase.from("favorites").select("product_id").eq("profile_id", userId).eq("product_id", product.id).maybeSingle(),
    ]);
    priceRow = priceData;
    isFavorited = Boolean(favoriteData);
  }
  const resolution = resolvePrice(
    { priceCop: priceRow?.price_cop ?? null, priceSyncedAt: priceRow?.price_synced_at ?? null },
    { userId },
  );

  // "Otros equipos que pueden interesarte": misma categoría, excluye el
  // producto actual — nunca una recomendación fabricada por afinidad que
  // no exista todavía como dato real.
  const { data: relatedData } = await supabase
    .from("public_products")
    .select("id,slug,name,brand_id")
    .eq("category_id", product.category_id)
    .neq("id", product.id)
    .limit(4);
  const related = (relatedData as RelatedProductRow[] | null) ?? [];
  const relatedIds = related.map((r) => r.id);

  const [{ data: relatedImagesData }, relatedPriceRows, { data: relatedFavoritesData }] = await Promise.all([
    relatedIds.length > 0
      ? supabase.from("product_images").select("product_id,url,alt").in("product_id", relatedIds).eq("is_primary", true)
      : Promise.resolve({ data: [] }),
    userId && relatedIds.length > 0
      ? supabase.from("products").select("id,price_cop,price_synced_at").in("id", relatedIds)
      : Promise.resolve({ data: null }),
    userId && relatedIds.length > 0
      ? supabase.from("favorites").select("product_id").eq("profile_id", userId).in("product_id", relatedIds)
      : Promise.resolve({ data: null }),
  ]);
  const relatedImageByProduct = new Map(
    ((relatedImagesData as { product_id: string; url: string; alt: string | null }[] | null) ?? []).map((img) => [img.product_id, img]),
  );
  const relatedPriceByProduct = new Map(
    ((relatedPriceRows.data as { id: string; price_cop: number | null; price_synced_at: string | null }[] | null) ?? []).map((p) => [
      p.id,
      p,
    ]),
  );
  const relatedFavoritedIds = new Set(((relatedFavoritesData as { product_id: string }[] | null) ?? []).map((f) => f.product_id));

  const relatedBrandIds = [...new Set(related.map((r) => r.brand_id).filter((id): id is string => Boolean(id)))];
  const { data: relatedBrandsData } =
    relatedBrandIds.length > 0 ? await supabase.from("brands").select("id,name").in("id", relatedBrandIds) : { data: [] };
  const relatedBrandById = new Map(((relatedBrandsData as BrandRow[] | null) ?? []).map((b) => [b.id, b]));

  // schema.org/Product sin bloque `offers` — el precio nunca entra al
  // JSON-LD, ni con sesión: un rastreador siempre lo ve como anónimo
  // (docs/12-MODULE-CATALOG.md sección 9).
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.short_description ?? product.description ?? undefined,
    brand: brand ? { "@type": "Brand", name: brand.name } : undefined,
    image: images.map((img) => img.url),
  };

  const siteUrl = serverEnv.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Catálogo", item: `${siteUrl}/catalogo` },
      ...(category
        ? [{ "@type": "ListItem", position: 2, name: category.name, item: `${siteUrl}/catalogo?categoria=${category.slug}` }]
        : []),
      { "@type": "ListItem", position: category ? 3 : 2, name: product.name, item: `${siteUrl}/catalogo/${product.slug}` },
    ],
  };

  // Solo 4, para el bento de specs rápidas arriba del CTA — el resto vive
  // completo en la pestaña "Especificaciones técnicas" más abajo.
  const quickSpecs = specs.slice(0, 4);

  return (
    <div className="mx-auto flex max-w-[1280px] flex-col gap-8 px-4 py-12 md:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd).replace(/</g, "\\u003c") }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, "\\u003c") }}
      />
      <nav aria-label="Miga de pan" className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-text-muted">
        <Link href="/" className="hover:text-brand">
          Inicio
        </Link>
        <Icon name="chevronRight" size={14} />
        <Link href="/catalogo" className="hover:text-brand">
          Catálogo
        </Link>
        {category ? (
          <>
            <Icon name="chevronRight" size={14} />
            <Link href={`/catalogo?categoria=${category.slug}`} className="hover:text-brand">
              {category.name}
            </Link>
          </>
        ) : null}
        <Icon name="chevronRight" size={14} />
        <span className="font-semibold text-text">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <ProductGallery
            images={images.map((img) => ({ url: img.url, alt: img.alt }))}
            productName={product.name}
          />
        </div>

        <div className="flex flex-col gap-6 lg:col-span-5">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs text-text-muted">
              <span>
                SKU: <strong className="font-mono text-text">{product.sku}</strong>
              </span>
              {brand ? (
                <>
                  <span className="h-1 w-1 rounded-full bg-border-strong" />
                  <span>
                    Marca: <strong className="font-mono text-text">{brand.name}</strong>
                  </span>
                </>
              ) : null}
              {category ? (
                <>
                  <span className="h-1 w-1 rounded-full bg-border-strong" />
                  <span>
                    Categoría: <strong className="font-mono text-text">{category.name}</strong>
                  </span>
                </>
              ) : null}
            </div>

            <div className="flex items-start justify-between gap-4">
              <h1 className="text-2xl font-extrabold tracking-tight text-text md:text-3xl">{product.name}</h1>
              {userId ? <FavoriteButton productId={product.id} initialFavorited={isFavorited} /> : null}
            </div>

            {product.short_description ? <p className="text-text-muted">{product.short_description}</p> : null}

            {product.stock_status === "in_stock" ? (
              <div className="mt-1 inline-flex w-fit items-center gap-2 rounded-md border border-success/30 bg-success/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-success">
                <Icon name="checkCircle" size={16} />
                Disponible en stock
              </div>
            ) : null}
          </div>

          {quickSpecs.length > 0 ? (
            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border">
              {quickSpecs.map((spec) => (
                <div key={spec.label} className="flex flex-col gap-1 bg-bg-alt p-4">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">{spec.label}</span>
                  <span className="text-lg font-bold text-text">{spec.value}</span>
                </div>
              ))}
            </div>
          ) : null}

          <CompareToggle productId={product.id} categoryId={product.category_id} />

          <div id="purchase-box" className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-6 shadow-sm">
            {resolution.visible ? (
              <div>
                <p className="text-2xl font-bold text-text">{formatCop(resolution.priceCop)}</p>
                {resolution.confidence === "unconfirmed" ? (
                  <p className="mt-1 text-sm text-text-muted">Precio sujeto a confirmación.</p>
                ) : null}
              </div>
            ) : (
              <p className="font-medium text-brand">
                {userId ? (
                  "Precio no disponible por el momento. Solicita una cotización."
                ) : (
                  <Link href="/login" className="hover:underline">
                    Inicia sesión para ver precios
                  </Link>
                )}
              </p>
            )}

            {userId ? (
              <form action={addToCartAction} className="flex flex-col gap-3">
                <input type="hidden" name="productId" value={product.id} />
                <input type="hidden" name="quantity" value="1" />
                <AddToCartButton />
              </form>
            ) : null}

            <Link
              href="/contacto"
              className="flex w-full items-center justify-center gap-2 rounded-[var(--radius)] border border-border py-2.5 text-sm font-semibold text-text transition-colors hover:bg-bg-alt"
            >
              <Icon name="headset" size={18} />
              Hablar con un asesor
            </Link>
          </div>
        </div>
      </div>

      <ProductTabs description={product.description} specs={specs} />

      {/* Beneficios — bloques alternados foto/texto, benchmark
          es.hunter.com. Solo si el master cargó al menos uno desde
          /admin/productos/[id]; si no, la ficha se ve igual que antes. */}
      {benefits.length > 0 ? (
        <div className="flex flex-col">
          {benefits.map((benefit, index) => {
            const image = images[index % images.length] ?? images[0] ?? null;
            const imageOnRight = index % 2 === 0;

            const textBlock = (
              <div className="flex flex-col justify-center gap-3 px-4 py-10 md:px-6">
                <h3 className="text-2xl font-bold text-text">{benefit.title}</h3>
                <p className="text-text-muted">{benefit.description}</p>
              </div>
            );
            const imageBlock = image ? (
              <div className="relative aspect-[4/3] w-full md:aspect-auto md:h-full md:min-h-[280px]">
                <Image src={image.url} alt={benefit.title} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
              </div>
            ) : null;

            return (
              <div key={benefit.id} className={`grid grid-cols-1 border-t border-border md:grid-cols-2 ${imageOnRight ? "" : "md:[&>*:first-child]:order-2"}`}>
                {textBlock}
                {imageBlock}
              </div>
            );
          })}
        </div>
      ) : null}

      {/* Video opcional — solo si el master cargó una URL válida de
          YouTube/Vimeo desde /admin/productos/[id]. */}
      {product.video_url && toEmbedUrl(product.video_url) ? (
        <div className="aspect-video w-full overflow-hidden rounded-lg border border-border">
          <iframe
            src={toEmbedUrl(product.video_url) ?? undefined}
            title={`Video de ${product.name}`}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : null}

      {related.length > 0 ? (
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-bold text-text">Otros equipos que pueden interesarte</h2>
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
            {related.map((r) => {
              const relatedBrand = r.brand_id ? relatedBrandById.get(r.brand_id) : undefined;
              const relatedImage = relatedImageByProduct.get(r.id);
              const relatedPriceRow = relatedPriceByProduct.get(r.id);
              const relatedResolution = resolvePrice(
                { priceCop: relatedPriceRow?.price_cop ?? null, priceSyncedAt: relatedPriceRow?.price_synced_at ?? null },
                { userId },
              );
              return (
                <Link key={r.id} href={`/catalogo/${r.slug}`}>
                  <ProductCard
                    name={r.name}
                    brandName={relatedBrand?.name ?? null}
                    imageUrl={relatedImage?.url ?? null}
                    imageAlt={relatedImage?.alt ?? r.name}
                    price={
                      relatedResolution.visible
                        ? {
                            visible: true,
                            label: formatCop(relatedResolution.priceCop),
                            unconfirmed: relatedResolution.confidence === "unconfirmed",
                          }
                        : { visible: false }
                    }
                    cornerAction={
                      userId ? <FavoriteButton productId={r.id} initialFavorited={relatedFavoritedIds.has(r.id)} /> : undefined
                    }
                  />
                </Link>
              );
            })}
          </div>
        </div>
      ) : null}

      <StickyProductCta
        productId={product.id}
        productName={product.name}
        isLoggedIn={userId !== null}
        priceVisible={resolution.visible}
        priceLabel={resolution.visible ? formatCop(resolution.priceCop) : null}
        priceUnconfirmed={resolution.visible && resolution.confidence === "unconfirmed"}
        anchorId="purchase-box"
      />
    </div>
  );
}
