import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { createServerClient } from "@tecni/db";
import { serverEnv } from "@tecni/shared";
import { Icon } from "@tecni/ui";

import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { StatusBadge } from "@/components/status-badge";
import { deleteProductAction, publishProductAction } from "./actions";

export const metadata: Metadata = {
  title: "Productos — Panel maestro",
};

interface ProductRow {
  id: string;
  sku: string;
  name: string;
  is_active: boolean;
  category_id: string;
  brand_id: string | null;
  categories: { name: string } | null;
  brands: { name: string } | null;
}

interface OptionRow {
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

export default async function AdminProductosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; categoria?: string; estado?: string; created?: string; published?: string; deleted?: string }>;
}) {
  const { q, categoria, estado, created, published, deleted } = await searchParams;
  const supabase = await getSupabase();

  const { data: categoriesData } = await supabase.from("categories").select("id,name").order("name");
  const categories = (categoriesData as OptionRow[] | null) ?? [];

  // El middleware ya exige master para llegar a /admin.
  // `products_read_authenticated` (05-RLS-SECURITY-A.md, Fase 2) deja ver
  // todo el catálogo con sesión, incluidos los productos inactivos.
  let query = supabase
    .from("products")
    .select("id,sku,name,is_active,category_id,brand_id,categories(name),brands(name)")
    .is("deleted_at", null)
    .order("name", { ascending: true })
    .limit(100);
  if (q && q.trim().length > 0) {
    query = query.ilike("name", `%${q.trim()}%`);
  }
  if (categoria) {
    query = query.eq("category_id", categoria);
  }
  const { data: productsData } = await query;
  const allProducts = (productsData as unknown as ProductRow[] | null) ?? [];

  // Un producto inactivo sin fotos es "nuevo, falta completar" (borrador
  // recién creado por importación o, a futuro, por la sincronización con
  // Siigo — docs/08-INTEGRATION-SIIGO.md sección 2.1); inactivo con fotos
  // es una decisión deliberada del master de ocultarlo.
  const inactiveIds = allProducts.filter((p) => !p.is_active).map((p) => p.id);
  const { data: imagesData } =
    inactiveIds.length > 0 ? await supabase.from("product_images").select("product_id,url").in("product_id", inactiveIds).eq("is_primary", true) : { data: [] };
  const imageByProduct = new Map(((imagesData as { product_id: string; url: string }[] | null) ?? []).map((i) => [i.product_id, i.url]));

  const activeProductIds = allProducts.filter((p) => p.is_active).map((p) => p.id);
  const { data: activeImagesData } =
    activeProductIds.length > 0
      ? await supabase.from("product_images").select("product_id,url").in("product_id", activeProductIds).eq("is_primary", true)
      : { data: [] };
  for (const row of (activeImagesData as { product_id: string; url: string }[] | null) ?? []) {
    imageByProduct.set(row.product_id, row.url);
  }

  const withStatus = allProducts.map((p) => ({
    ...p,
    imageUrl: imageByProduct.get(p.id) ?? null,
    isDraft: !p.is_active && !imageByProduct.has(p.id),
  }));

  const products = estado
    ? withStatus.filter((p) => (estado === "activo" ? p.is_active : estado === "borrador" ? p.isDraft : !p.is_active && !p.isDraft))
    : withStatus;

  const counts = {
    total: withStatus.length,
    activos: withStatus.filter((p) => p.is_active).length,
    borradores: withStatus.filter((p) => p.isDraft).length,
    inactivos: withStatus.filter((p) => !p.is_active && !p.isDraft).length,
  };

  return (
    <div className="mx-auto flex max-w-[1100px] flex-col gap-6 px-4 py-16">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-text">Productos</h1>
          <p className="text-sm text-text-muted">
            {counts.total} en total · {counts.activos} publicados · {counts.borradores} borradores · {counts.inactivos} inactivos
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/productos/importar"
            className="flex items-center gap-2 rounded-[var(--radius)] border border-border px-4 py-2 text-sm font-semibold text-text transition-colors hover:border-brand"
          >
            <Icon name="document" size={16} />
            Importar desde Excel
          </Link>
          <Link
            href="/admin/productos/nuevo"
            className="flex items-center gap-2 rounded-[var(--radius)] bg-brand px-4 py-2 text-sm font-semibold text-text-inverse transition-colors hover:bg-brand-hover"
          >
            <Icon name="box" size={16} />
            Nuevo producto
          </Link>
        </div>
      </div>

      {created ? (
        <p className="flex items-center gap-2 rounded-[var(--radius)] border border-success bg-success/10 px-3 py-2 text-sm text-success">
          <Icon name="checkCircle" size={16} />
          Producto creado. Ahora súbele al menos una foto y su ficha técnica antes de publicarlo.
        </p>
      ) : null}
      {published ? (
        <p className="flex items-center gap-2 rounded-[var(--radius)] border border-success bg-success/10 px-3 py-2 text-sm text-success">
          <Icon name="checkCircle" size={16} />
          Producto publicado — ya es visible en el catálogo.
        </p>
      ) : null}
      {deleted ? (
        <p className="flex items-center gap-2 rounded-[var(--radius)] border border-success bg-success/10 px-3 py-2 text-sm text-success">
          <Icon name="checkCircle" size={16} />
          Producto eliminado.
        </p>
      ) : null}

      <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 sm:flex-row sm:items-end">
        <form className="flex flex-1 gap-2">
          {categoria ? <input type="hidden" name="categoria" value={categoria} /> : null}
          {estado ? <input type="hidden" name="estado" value={estado} /> : null}
          <div className="flex flex-1 flex-col gap-1">
            <label htmlFor="q" className="text-xs font-medium text-text-muted">
              Buscar por nombre
            </label>
            <input
              id="q"
              type="text"
              name="q"
              defaultValue={q ?? ""}
              placeholder="Ej: balanceadora, HawkEye, Bosch..."
              className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            className="self-end rounded-[var(--radius)] border border-border px-4 py-2 text-sm font-medium text-text hover:border-brand"
          >
            Buscar
          </button>
        </form>

        <form className="flex gap-2">
          {q ? <input type="hidden" name="q" value={q} /> : null}
          {estado ? <input type="hidden" name="estado" value={estado} /> : null}
          <div className="flex flex-col gap-1">
            <label htmlFor="categoria" className="text-xs font-medium text-text-muted">
              Categoría
            </label>
            <select
              id="categoria"
              name="categoria"
              defaultValue={categoria ?? ""}
              className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2 text-sm"
            >
              <option value="">Todas las categorías</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="self-end rounded-[var(--radius)] border border-border px-4 py-2 text-sm font-medium text-text hover:border-brand"
          >
            Filtrar
          </button>
        </form>

        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-text-muted">Estado</span>
          <div className="flex gap-1">
            {[
              { value: "", label: "Todos" },
              { value: "activo", label: "Publicados" },
              { value: "borrador", label: "Borradores" },
              { value: "inactivo", label: "Inactivos" },
            ].map((opt) => {
              const params = new URLSearchParams();
              if (q) params.set("q", q);
              if (categoria) params.set("categoria", categoria);
              if (opt.value) params.set("estado", opt.value);
              const href = params.toString() ? `?${params.toString()}` : "";
              const isCurrent = (estado ?? "") === opt.value;
              return (
                <Link
                  key={opt.value}
                  href={`/admin/productos${href}`}
                  className={`rounded-[var(--radius)] border px-3 py-2 text-xs font-semibold transition-colors ${
                    isCurrent ? "border-brand bg-brand-subtle text-brand" : "border-border text-text-muted hover:border-brand"
                  }`}
                >
                  {opt.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-bg-alt px-6 py-16 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-subtle text-brand">
            <Icon name="box" size={26} />
          </span>
          <p className="font-semibold text-text">
            {q || categoria || estado ? "Ningún producto coincide con este filtro." : "Todavía no hay productos."}
          </p>
          {q || categoria || estado ? (
            <Link href="/admin/productos" className="text-sm font-medium text-brand hover:underline">
              Quitar filtros
            </Link>
          ) : (
            <Link
              href="/admin/productos/nuevo"
              className="rounded-[var(--radius)] bg-brand px-4 py-2 text-sm font-semibold text-text-inverse hover:bg-brand-hover"
            >
              Crear el primer producto
            </Link>
          )}
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <li key={product.id} className="group relative flex gap-3 rounded-xl border border-border bg-surface p-3 transition-colors hover:border-brand">
              <Link href={`/admin/productos/${product.id}`} className="flex min-w-0 flex-1 gap-3">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-bg-alt">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <Icon name="image" size={22} className="text-text-muted" />
                  )}
                </div>
                <div className="flex min-w-0 flex-col gap-1">
                  <p className="truncate font-medium text-text group-hover:text-brand">{product.name}</p>
                  <p className="truncate text-xs text-text-muted">
                    {product.sku} · {product.categories?.name ?? "Sin categoría"}
                    {product.brands?.name ? ` · ${product.brands.name}` : ""}
                  </p>
                  {product.is_active ? (
                    <StatusBadge label="Publicado" tone="success" icon="checkCircle" />
                  ) : product.isDraft ? (
                    <StatusBadge label="Borrador — falta completar" tone="warning" icon="clock" />
                  ) : (
                    <StatusBadge label="Inactivo" tone="muted" icon="close" />
                  )}
                </div>
              </Link>
              <div className="flex shrink-0 flex-col gap-1 self-start">
                {!product.is_active ? (
                  <form action={publishProductAction}>
                    <input type="hidden" name="productId" value={product.id} />
                    <button
                      type="submit"
                      title="Publicar en el catálogo"
                      aria-label={`Publicar ${product.name}`}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-text-muted transition-colors hover:border-success hover:bg-success/10 hover:text-success"
                    >
                      <Icon name="checkCircle" size={16} />
                    </button>
                  </form>
                ) : null}
                <form action={deleteProductAction}>
                  <input type="hidden" name="productId" value={product.id} />
                  <ConfirmSubmitButton
                    confirmMessage={`¿Eliminar "${product.name}"? Deja de verse en el catálogo y en este panel. No se puede deshacer desde acá.`}
                    title="Eliminar producto"
                    aria-label={`Eliminar ${product.name}`}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-text-muted transition-colors hover:border-danger hover:bg-danger/10 hover:text-danger"
                  >
                    <Icon name="trash" size={16} />
                  </ConfirmSubmitButton>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
