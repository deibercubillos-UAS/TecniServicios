import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { createServerClient } from "@tecni/db";
import { formatCop, serverEnv } from "@tecni/shared";
import { getAllowedCatalogSorts, isCatalogSortAllowed, resolvePrice, type CatalogSort } from "@tecni/core";
import { Icon, ProductCard } from "@tecni/ui";

import { CompareToggle } from "@/components/compare-toggle";
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
  category_id: string;
  created_at: string;
}

interface SearchProductRow {
  id: string;
  slug: string;
  name: string;
  brand_id: string | null;
  category_id: string;
  created_at: string;
  rank: number;
}

interface CatalogoSearchParams {
  categoria?: string;
  marca?: string;
  orden?: string;
  after?: string;
  q?: string;
  precio_min?: string;
  precio_max?: string;
  [key: string]: string | undefined;
}

async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(serverEnv.NEXT_PUBLIC_SUPABASE_URL, serverEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    getAll: () => cookieStore.getAll(),
    setAll: () => {},
  });
}

/** Escapa un valor para usarlo dentro del filtro `.or()` de PostgREST
 * (sintaxis en https://postgrest.org/en/stable/references/api/tables_views.html#operators):
 * comillas dobles alrededor, `\` y `"` escapados. Sin esto, un valor con
 * coma o paréntesis rompería o alteraría el filtro compuesto. */
function quoteFilterValue(value: string): string {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
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

  const [{ data: categoriesData }, { data: brandsData }, { data: countsData }] = await Promise.all([
    supabase
      .from("categories")
      .select("id,parent_id,slug,name")
      .eq("is_active", true)
      .order("position") as unknown as Promise<{ data: CategoryRow[] | null }>,
    supabase.from("brands").select("id,slug,name").eq("is_active", true).order("name") as unknown as Promise<{
      data: BrandRow[] | null;
    }>,
    // Conteo real por categoría/marca del catálogo completo (sin aplicar los
    // filtros activos) — nunca un número inventado, pero tampoco un facet
    // recalculado por combinación de filtros (fuera de alcance por ahora).
    supabase.from("public_products").select("category_id,brand_id") as unknown as Promise<{
      data: { category_id: string; brand_id: string | null }[] | null;
    }>,
  ]);
  const categories = categoriesData ?? [];
  const brands = brandsData ?? [];

  const categoryCounts = new Map<string, number>();
  const brandCounts = new Map<string, number>();
  for (const row of countsData ?? []) {
    categoryCounts.set(row.category_id, (categoryCounts.get(row.category_id) ?? 0) + 1);
    if (row.brand_id) brandCounts.set(row.brand_id, (brandCounts.get(row.brand_id) ?? 0) + 1);
  }
  const totalProductCount = (countsData ?? []).length;

  const selectedCategory = params.categoria ? categories.find((c) => c.slug === params.categoria) : undefined;
  const categoryIds = selectedCategory
    ? [selectedCategory.id, ...categories.filter((c) => c.parent_id === selectedCategory.id).map((c) => c.id)]
    : null;

  const selectedBrand = params.marca ? brands.find((b) => b.slug === params.marca) : undefined;

  const searchQuery = params.q?.trim() || null;
  const hasActiveSearch = searchQuery !== null;
  const requestedSort = params.orden ?? (hasActiveSearch ? "relevance" : "name");
  const sortColumn: CatalogSort = isCatalogSortAllowed(requestedSort, hasActiveSearch)
    ? (requestedSort as CatalogSort)
    : "name";
  const sortColumnDb = sortColumn === "newest" ? "created_at" : "name";
  const ascending = sortColumn !== "newest";

  let searchRows: SearchProductRow[] = [];
  if (searchQuery) {
    const { data } = await supabase.rpc("search_products", { search_query: searchQuery });
    searchRows = (data as SearchProductRow[] | null) ?? [];
  }
  const searchIds = searchQuery ? new Set(searchRows.map((r) => r.id)) : null;

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

  if (searchIds !== null) {
    matchingProductIds =
      matchingProductIds === null ? [...searchIds] : matchingProductIds.filter((id) => searchIds.has(id));
  }

  // Precio es privado a usuarios anónimos (regla de negocio 5.1) — el filtro
  // de precio solo puede aplicarse con sesión real, contra el precio real de
  // `products`, nunca contra un rango inventado o visible sin login.
  const priceMin = params.precio_min ? Number(params.precio_min) : null;
  const priceMax = params.precio_max ? Number(params.precio_max) : null;
  if (userId && (priceMin || priceMax)) {
    let priceQuery = supabase.from("products").select("id").eq("is_active", true);
    if (priceMin) priceQuery = priceQuery.gte("price_cop", priceMin);
    if (priceMax) priceQuery = priceQuery.lte("price_cop", priceMax);
    const { data: priceIdsData } = await priceQuery;
    const ids = ((priceIdsData as { id: string }[] | null) ?? []).map((r) => r.id);
    matchingProductIds = matchingProductIds === null ? ids : matchingProductIds.filter((id) => ids.includes(id));
  }

  const cursor = decodeCursor(params.after);

  let products: PublicProductRow[];
  let hasMore: boolean;

  if (sortColumn === "relevance") {
    // Ya viene ordenado por rank desde search_products — se filtra y pagina en
    // memoria (dataset acotado en esta fase, sin inventario real todavía).
    const filtered = searchRows.filter((r) => {
      if (categoryIds && !categoryIds.includes(r.category_id)) return false;
      if (selectedBrand && r.brand_id !== selectedBrand.id) return false;
      if (matchingProductIds !== null && !matchingProductIds.includes(r.id)) return false;
      return true;
    });
    const startIndex = cursor ? filtered.findIndex((r) => r.id === cursor.id) + 1 : 0;
    const page = filtered.slice(startIndex, startIndex + PAGE_SIZE + 1);
    hasMore = page.length > PAGE_SIZE;
    products = page.slice(0, PAGE_SIZE).map((r) => ({
      id: r.id,
      slug: r.slug,
      name: r.name,
      brand_id: r.brand_id,
      category_id: r.category_id,
      created_at: r.created_at,
    }));
  } else {
    let query = supabase
      .from("public_products")
      .select("id,slug,name,brand_id,category_id,created_at")
      .order(sortColumnDb, { ascending })
      .order("id", { ascending: true })
      .limit(PAGE_SIZE + 1);

    if (categoryIds) query = query.in("category_id", categoryIds);
    if (selectedBrand) query = query.eq("brand_id", selectedBrand.id);
    if (matchingProductIds !== null) query = query.in("id", matchingProductIds);
    if (cursor) {
      const op = ascending ? "gt" : "lt";
      const value = quoteFilterValue(cursor.value);
      // cursor.id ya se valida como UUID en decodeCursor (cursor.ts) — nunca
      // necesita comillas. cursor.value es texto libre (nombre de producto o
      // fecha) y viaja siempre citado, para que no pueda inyectar sintaxis de
      // filtro de PostgREST (comas, paréntesis) en un `after` forjado a mano.
      query = query.or(`${sortColumnDb}.${op}.${value},and(${sortColumnDb}.eq.${value},id.gt.${cursor.id})`);
    }

    const { data: productsData } = await query;
    const rows = (productsData as PublicProductRow[] | null) ?? [];
    hasMore = rows.length > PAGE_SIZE;
    products = rows.slice(0, PAGE_SIZE);
  }

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
      ? encodeCursor(
          sortColumn === "relevance" ? "_" : sortColumnDb === "name" ? lastProduct.name : lastProduct.created_at,
          lastProduct.id,
        )
      : null;

  const hasActiveFilters = Boolean(
    params.categoria || params.marca || params.precio_min || params.precio_max || attributeDefinitions.some((def) =>
      def.data_type === "enum" ? params[`attr_${def.key}`] : params[`attr_${def.key}_min`] || params[`attr_${def.key}_max`],
    ),
  );
  const clearFiltersHref = buildHref(params, {
    categoria: undefined,
    marca: undefined,
    precio_min: undefined,
    precio_max: undefined,
    after: undefined,
    ...Object.fromEntries(attributeDefinitions.flatMap((def) => [
      [`attr_${def.key}`, undefined],
      [`attr_${def.key}_min`, undefined],
      [`attr_${def.key}_max`, undefined],
    ])),
  });

  return (
    <div className="mx-auto flex max-w-[1280px] flex-col gap-8 px-4 py-12 md:flex-row md:px-6">
      <aside className="flex shrink-0 flex-col gap-6 self-start rounded-lg border border-border bg-surface p-5 md:sticky md:top-24 md:w-72">
        <div className="flex items-center justify-between border-b-2 border-brand pb-3">
          <h2 className="flex items-center gap-2 text-lg font-bold text-text">
            <Icon name="sliders" size={20} className="text-brand" />
            Filtros
          </h2>
          {hasActiveFilters ? (
            <Link href={clearFiltersHref} className="flex items-center gap-1 text-xs font-medium text-text-muted hover:text-brand">
              <Icon name="close" size={14} />
              Limpiar
            </Link>
          ) : null}
        </div>

        <div className="flex flex-col gap-3 border-b border-border pb-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">Categorías</h3>
          <ul className="flex flex-col gap-2 pl-1">
            <li>
              <Link
                href={buildHref(params, { categoria: undefined, after: undefined })}
                className={`flex items-center justify-between gap-2 text-sm transition-colors ${
                  !selectedCategory ? "font-semibold text-brand" : "text-text hover:text-brand"
                }`}
              >
                Todas
                <span className="text-xs text-text-muted">{totalProductCount}</span>
              </Link>
            </li>
            {categories
              .filter((c) => c.parent_id === null)
              .map((c) => (
                <li key={c.id}>
                  <Link
                    href={buildHref(params, { categoria: c.slug, after: undefined })}
                    className={`flex items-center justify-between gap-2 text-sm transition-colors ${
                      selectedCategory?.id === c.id ? "font-semibold text-brand" : "text-text hover:text-brand"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                          selectedCategory?.id === c.id ? "bg-brand" : "bg-border-strong"
                        }`}
                      />
                      {c.name}
                    </span>
                    <span className="text-xs text-text-muted">{categoryCounts.get(c.id) ?? 0}</span>
                  </Link>
                </li>
              ))}
          </ul>
        </div>

        <div className="flex flex-col gap-3 border-b border-border pb-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">Marcas</h3>
          <ul className="flex flex-col gap-2 pl-1">
            <li>
              <Link
                href={buildHref(params, { marca: undefined, after: undefined })}
                className={`flex items-center justify-between gap-2 text-sm transition-colors ${
                  !selectedBrand ? "font-semibold text-brand" : "text-text hover:text-brand"
                }`}
              >
                Todas
                <span className="text-xs text-text-muted">{totalProductCount}</span>
              </Link>
            </li>
            {brands.map((b) => (
              <li key={b.id}>
                <Link
                  href={buildHref(params, { marca: b.slug, after: undefined })}
                  className={`flex items-center justify-between gap-2 text-sm transition-colors ${
                    selectedBrand?.id === b.id ? "font-semibold text-brand" : "text-text hover:text-brand"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                        selectedBrand?.id === b.id ? "bg-brand" : "bg-border-strong"
                      }`}
                    />
                    {b.name}
                  </span>
                  <span className="text-xs text-text-muted">{brandCounts.get(b.id) ?? 0}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <form method="get" action="/catalogo" className="flex flex-col gap-6">
          {params.categoria ? <input type="hidden" name="categoria" value={params.categoria} /> : null}
          {params.marca ? <input type="hidden" name="marca" value={params.marca} /> : null}
          {params.orden ? <input type="hidden" name="orden" value={params.orden} /> : null}
          {params.q ? <input type="hidden" name="q" value={params.q} /> : null}

          {userId ? (
            <div className="flex flex-col gap-3 border-b border-border pb-5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">Precio (COP)</h3>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  step={1000}
                  name="precio_min"
                  defaultValue={params.precio_min ?? ""}
                  placeholder="Mín."
                  className="w-full rounded-[var(--radius)] border border-border bg-bg px-2 py-1.5 text-sm focus:border-brand focus:outline-none"
                />
                <span className="text-text-muted">–</span>
                <input
                  type="number"
                  min={0}
                  step={1000}
                  name="precio_max"
                  defaultValue={params.precio_max ?? ""}
                  placeholder="Máx."
                  className="w-full rounded-[var(--radius)] border border-border bg-bg px-2 py-1.5 text-sm focus:border-brand focus:outline-none"
                />
              </div>
            </div>
          ) : (
            <p className="border-b border-border pb-5 text-xs text-text-muted">
              <Link href="/login" className="font-medium text-brand hover:underline">
                Inicia sesión
              </Link>{" "}
              para filtrar por precio.
            </p>
          )}

          {attributeDefinitions.map((def) => (
            <div key={def.id} className="flex flex-col gap-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                {def.label}
                {def.unit ? ` (${def.unit})` : ""}
              </h3>
              {def.data_type === "enum" ? (
                <div className="flex flex-col gap-2 pl-1">
                  {(def.options ?? []).map((option) => (
                    <label key={option} className="group flex cursor-pointer items-center gap-2 text-sm text-text">
                      <input
                        type="checkbox"
                        name={`attr_${def.key}`}
                        value={option}
                        defaultChecked={([] as string[])
                          .concat((params[`attr_${def.key}`] as unknown as string | string[] | undefined) ?? [])
                          .includes(option)}
                        className="h-4 w-4 rounded border-border-strong text-brand focus:ring-2 focus:ring-brand"
                      />
                      <span className="transition-colors group-hover:text-brand">{option}</span>
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
                    className="w-full rounded-[var(--radius)] border border-border bg-bg px-2 py-1.5 text-sm focus:border-brand focus:outline-none"
                  />
                  <span className="text-text-muted">–</span>
                  <input
                    type="number"
                    name={`attr_${def.key}_max`}
                    defaultValue={params[`attr_${def.key}_max`] ?? ""}
                    placeholder="Máx."
                    className="w-full rounded-[var(--radius)] border border-border bg-bg px-2 py-1.5 text-sm focus:border-brand focus:outline-none"
                  />
                </div>
              ) : null}
            </div>
          ))}

          <button
            type="submit"
            className="rounded-[var(--radius)] bg-brand px-4 py-2.5 text-sm font-semibold text-text-inverse transition-colors hover:bg-brand-hover"
          >
            Aplicar filtros
          </button>
        </form>
      </aside>

      <div className="flex-1">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text">{selectedCategory ? selectedCategory.name : "Catálogo"}</h1>
            {searchQuery ? (
              <p className="mt-1 text-sm text-text-muted">
                Resultados para &ldquo;{searchQuery}&rdquo; —{" "}
                <Link href={buildHref(params, { q: undefined, after: undefined })} className="text-brand hover:underline">
                  quitar búsqueda
                </Link>
              </p>
            ) : null}
          </div>
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
                <div key={product.id} className="flex flex-col gap-1">
                  <Link href={`/catalogo/${product.slug}`}>
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
                  <CompareToggle productId={product.id} categoryId={product.category_id} />
                </div>
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
