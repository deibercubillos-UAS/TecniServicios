import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { createServerClient } from "@tecni/db";
import { formatCop, serverEnv } from "@tecni/shared";
import { getAllowedCatalogSorts, isCatalogSortAllowed, resolvePrice, type CatalogSort } from "@tecni/core";
import { ProductCard } from "@tecni/ui";

import { decodeCursor, encodeCursor } from "./cursor";

export const metadata: Metadata = {
  title: "Catálogo — Tecni Equipos y Servicios SAS",
  description:
    "Maquinaria, herramientas, repuestos y consumibles para el sector automotriz en Colombia.",
};

const PAGE_SIZE = 24;

interface CategoryRow {
  id: string;
  parent_id: string | null;
  slug: string;
  name: string;
}

interface BrandRow {
  id: string;
  slug: string;
  name: string;
}

interface AttributeDefinitionRow {
  id: string;
  key: string;
  label: string;
  unit: string | null;
  data_type: string;
  options: string[] | null;
}

interface PublicProductRow {
  id: string;
  slug: string;
  name: string;
  brand_id: string | null;
  created_at: string;
}

interface CatalogoSearchParams {
  categoria?: string;
  marca?: string;
  orden?: string;
  after?: string;
  [key: string]: string | undefined;
}

async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(serverEnv.NEXT_PUBLIC_SUPABASE_URL, serverEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    getAll: () => cookieStore.getAll(),
    setAll: () => {},
  });
}

function buildHref(params: CatalogoSearchParams, overrides: Record<string, string | undefined>) {
  const merged = { ...params, ...overrides };
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(merged)) {
    if (value) search.set(key, value);
  }
  const qs = search.toString();
  return qs ? `/catalogo?${qs}` : "/catalogo";
}

export default async function CatalogoPage({
  searchParams,
}: {
  searchParams: Promise<CatalogoSearchParams>;
}) {
  const params = await searchParams;
  const supabase = await getSupabase();

  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id ?? null;

  const [{ data: categoriesData }, { data: brandsData }] = await Promise.all([
    supabase
      .from("categories")
      .select("id,parent_id,slug,name")
      .eq("is_active", true)
      .order("position") as unknown as Promise<{ data: CategoryRow[] | null }>,
    supabase.from("brands").select("id,slug,name").eq("is_active", true).order("name") as unknown as Promise<{
      data: BrandRow[] | null;
    }>,
  ]);
  const categories = categoriesData ?? [];
  const brands = brandsData ?? [];

  const selectedCategory = params.categoria ? categories.find((c) => c.slug === params.categoria) : undefined;
  const categoryIds = selectedCategory
    ? [selectedCategory.id, ...categories.filter((c) => c.parent_id === selectedCategory.id).map((c) => c.id)]
    : null;

  const selectedBrand = params.marca ? brands.find((b) => b.slug === params.marca) : undefined;

  const hasActiveSearch = false; // la búsqueda de texto completo llega en el paso 7.2
  const sortColumn: CatalogSort = isCatalogSortAllowed(params.orden ?? "name", hasActiveSearch)
    ? (params.orden as CatalogSort)
    : "name";
  const sortColumnDb = sortColumn === "newest" ? "created_at" : "name";
  const ascending = sortColumn !== "newest";

  let attributeDefinitions: AttributeDefinitionRow[] = [];
  if (selectedCategory) {
    const { data } = await supabase
      .from("attribute_definitions")
      .select("id,key,label,unit,data_type,options")
      .eq("category_id", selectedCategory.id)
      .eq("is_filterable", true)
      .order("position");
    attributeDefinitions = (data as AttributeDefinitionRow[] | null) ?? [];
  }

  let matchingProductIds: string[] | null = null;
  for (const def of attributeDefinitions) {
    if (def.data_type === "enum") {
      const selected = ([] as string[]).concat(
        (params[`attr_${def.key}`] as unknown as string | string[] | undefined) ?? [],
      );
      if (selected.length === 0) continue;
      const { data } = await supabase
        .from("product_attributes")
        .select("product_id")
        .eq("definition_id", def.id)
        .in("value_text", selected);
      const ids = ((data as { product_id: string }[] | null) ?? []).map((r) => r.product_id);
      matchingProductIds = matchingProductIds === null ? ids : matchingProductIds.filter((id) => ids.includes(id));
    } else if (def.data_type === "number") {
      const min = params[`attr_${def.key}_min`];
      const max = params[`attr_${def.key}_max`];
      if (!min && !max) continue;
      let query = supabase.from("product_attributes").select("product_id").eq("definition_id", def.id);
      if (min) query = query.gte("value_number", Number(min));
      if (max) query = query.lte("value_number", Number(max));
      const { data } = await query;
      const ids = ((data as { product_id: string }[] | null) ?? []).map((r) => r.product_id);
      matchingProductIds = matchingProductIds === null ? ids : matchingProductIds.filter((id) => ids.includes(id));
    }
  }

  const cursor = decodeCursor(params.after);

  let query = supabase
    .from("public_products")
    .select("id,slug,name,brand_id,created_at")
    .order(sortColumnDb, { ascending })
    .order("id", { ascending: true })
    .limit(PAGE_SIZE + 1);

  if (categoryIds) query = query.in("category_id", categoryIds);
  if (selectedBrand) query = query.eq("brand_id", selectedBrand.id);
  if (matchingProductIds !== null) query = query.in("id", matchingProductIds);
  if (cursor) {
    const op = ascending ? "gt" : "lt";
    query = query.or(
      `${sortColumnDb}.${op}.${cursor.value},and(${sortColumnDb}.eq.${cursor.value},id.gt.${cursor.id})`,
    );
  }

  const { data: productsData } = await query;
  const rows = (productsData as PublicProductRow[] | null) ?? [];
  const hasMore = rows.length > PAGE_SIZE;
  const products = rows.slice(0, PAGE_SIZE);
  const productIds = products.map((p) => p.id);

  const [{ data: imagesData }, priceRows] = await Promise.all([
    productIds.length > 0
      ? (supabase
          .from("product_images")
          .select("product_id,url,alt")
          .in("product_id", productIds)
          .eq("is_primary", true) as unknown as Promise<{
          data: { product_id: string; url: string; alt: string | null }[] | null;
        }>)
      : Promise.resolve({ data: [] }),
    userId && productIds.length > 0
      ? supabase.from("products").select("id,price_cop,price_synced_at").in("id", productIds)
      : Promise.resolve({ data: null }),
  ]);
  const imageByProduct = new Map((imagesData ?? []).map((img) => [img.product_id, img]));
  const priceByProduct = new Map(
    ((priceRows.data as { id: string; price_cop: number | null; price_synced_at: string | null }[] | null) ?? []).map(
      (p) => [p.id, p],
    ),
  );

  const lastProduct = products[products.length - 1];
  const nextCursor =
    hasMore && lastProduct
      ? encodeCursor(sortColumnDb === "name" ? lastProduct.name : lastProduct.created_at, lastProduct.id)
      : null;

  return (
    <div className="mx-auto flex max-w-[1280px] flex-col gap-8 px-4 py-12 md:flex-row md:px-6">
      <aside className="flex shrink-0 flex-col gap-8 md:w-64">
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-muted">Categorías</h2>
          <ul className="flex flex-col gap-1">
            <li>
              <Link
                href={buildHref(params, { categoria: undefined, after: undefined })}
                className={`block rounded-[var(--radius)] px-2 py-1 text-sm ${
                  !selectedCategory ? "bg-brand-subtle font-medium text-brand" : "text-text hover:text-brand"
                }`}
              >
                Todas
              </Link>
            </li>
            {categories
              .filter((c) => c.parent_id === null)
              .map((c) => (
                <li key={c.id}>
                  <Link
                    href={buildHref(params, { categoria: c.slug, after: undefined })}
                    className={`block rounded-[var(--radius)] px-2 py-1 text-sm ${
                      selectedCategory?.id === c.id ? "bg-brand-subtle font-medium text-brand" : "text-text hover:text-brand"
                    }`}
                  >
                    {c.name}
                  </Link>
                </li>
              ))}
          </ul>
        </div>

        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-muted">Marcas</h2>
          <ul className="flex flex-col gap-1">
            <li>
              <Link
                href={buildHref(params, { marca: undefined, after: undefined })}
                className={`block rounded-[var(--radius)] px-2 py-1 text-sm ${
                  !selectedBrand ? "bg-brand-subtle font-medium text-brand" : "text-text hover:text-brand"
                }`}
              >
                Todas
              </Link>
            </li>
            {brands.map((b) => (
              <li key={b.id}>
                <Link
                  href={buildHref(params, { marca: b.slug, after: undefined })}
                  className={`block rounded-[var(--radius)] px-2 py-1 text-sm ${
                    selectedBrand?.id === b.id ? "bg-brand-subtle font-medium text-brand" : "text-text hover:text-brand"
                  }`}
                >
                  {b.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {attributeDefinitions.length > 0 ? (
          <form method="get" action="/catalogo" className="flex flex-col gap-6">
            {params.categoria ? <input type="hidden" name="categoria" value={params.categoria} /> : null}
            {params.marca ? <input type="hidden" name="marca" value={params.marca} /> : null}
            {params.orden ? <input type="hidden" name="orden" value={params.orden} /> : null}
            {attributeDefinitions.map((def) => (
              <div key={def.id}>
                <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-text-muted">
                  {def.label}
                  {def.unit ? ` (${def.unit})` : ""}
                </h3>
                {def.data_type === "enum" ? (
                  <div className="flex flex-col gap-1">
                    {(def.options ?? []).map((option) => (
                      <label key={option} className="flex items-center gap-2 text-sm text-text">
                        <input
                          type="checkbox"
                          name={`attr_${def.key}`}
                          value={option}
                          defaultChecked={([] as string[])
                            .concat((params[`attr_${def.key}`] as unknown as string | string[] | undefined) ?? [])
                            .includes(option)}
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                ) : def.data_type === "number" ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      name={`attr_${def.key}_min`}
                      defaultValue={params[`attr_${def.key}_min`] ?? ""}
                      placeholder="Mín."
                      className="w-full rounded-[var(--radius)] border border-border bg-surface px-2 py-1 text-sm"
                    />
                    <span className="text-text-muted">–</span>
                    <input
                      type="number"
                      name={`attr_${def.key}_max`}
                      defaultValue={params[`attr_${def.key}_max`] ?? ""}
                      placeholder="Máx."
                      className="w-full rounded-[var(--radius)] border border-border bg-surface px-2 py-1 text-sm"
                    />
                  </div>
                ) : null}
              </div>
            ))}
            <button
              type="submit"
              className="rounded-[var(--radius)] border-2 border-text px-4 py-2 text-sm font-semibold text-text transition-colors hover:bg-text hover:text-text-inverse"
            >
              Aplicar filtros
            </button>
          </form>
        ) : null}
      </aside>

      <div className="flex-1">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-text">{selectedCategory ? selectedCategory.name : "Catálogo"}</h1>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-text-muted">Ordenar:</span>
            {getAllowedCatalogSorts(hasActiveSearch).map((s) => (
              <Link
                key={s}
                href={buildHref(params, { orden: s, after: undefined })}
                className={sortColumn === s ? "font-semibold text-brand" : "text-text hover:text-brand"}
              >
                {s === "name" ? "Nombre" : s === "newest" ? "Más nuevos" : "Relevancia"}
              </Link>
            ))}
          </div>
        </div>

        {products.length === 0 ? (
          <p className="text-text-muted">No hay productos con estos filtros.</p>
        ) : (
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => {
              const brand = product.brand_id ? brands.find((b) => b.id === product.brand_id) : undefined;
              const image = imageByProduct.get(product.id);
              const priceRow = priceByProduct.get(product.id);
              const resolution = resolvePrice(
                { priceCop: priceRow?.price_cop ?? null, priceSyncedAt: priceRow?.price_synced_at ?? null },
                { userId },
              );
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
                  />
                </Link>
              );
            })}
          </div>
        )}

        {nextCursor ? (
          <div className="mt-8 flex justify-center">
            <Link
              href={buildHref(params, { after: nextCursor })}
              className="rounded-[var(--radius)] border-2 border-text px-6 py-2 text-sm font-semibold text-text transition-colors hover:bg-text hover:text-text-inverse"
            >
              Ver más
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}
