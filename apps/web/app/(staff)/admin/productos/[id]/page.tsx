import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { createServerClient } from "@tecni/db";
import { serverEnv } from "@tecni/shared";

import { updateProductAction } from "../actions";

export const metadata: Metadata = {
  title: "Editar producto — Panel maestro",
};

interface OptionRow {
  id: string;
  name: string;
}

interface ProductRow {
  id: string;
  sku: string;
  slug: string;
  name: string;
  short_description: string | null;
  description: string | null;
  type: string;
  category_id: string;
  brand_id: string | null;
  is_serialized: boolean;
  warranty_months: number | null;
  is_active: boolean;
  is_featured: boolean;
}

async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(serverEnv.NEXT_PUBLIC_SUPABASE_URL, serverEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    getAll: () => cookieStore.getAll(),
    setAll: () => {},
  });
}

export default async function EditarProductoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; updated?: string }>;
}) {
  const { id } = await params;
  const { error, updated } = await searchParams;
  const supabase = await getSupabase();

  const { data: productData } = await supabase
    .from("products")
    .select("id,sku,slug,name,short_description,description,type,category_id,brand_id,is_serialized,warranty_months,is_active,is_featured")
    .eq("id", id)
    .maybeSingle();
  const product = productData as ProductRow | null;

  if (!product) {
    return (
      <div className="mx-auto max-w-[700px] px-4 py-16">
        <h1 className="mb-4 text-2xl font-bold text-text">Producto no encontrado</h1>
        <Link href="/admin/productos" className="text-brand hover:underline">
          Ver productos
        </Link>
      </div>
    );
  }

  const { data: categoriesData } = await supabase.from("categories").select("id,name").order("name");
  const { data: brandsData } = await supabase.from("brands").select("id,name").order("name");
  const categories = (categoriesData as OptionRow[] | null) ?? [];
  const brands = (brandsData as OptionRow[] | null) ?? [];

  return (
    <div className="mx-auto flex max-w-[700px] flex-col gap-6 px-4 py-16">
      <h1 className="text-2xl font-bold text-text">{product.name}</h1>
      <p className="text-sm text-text-muted">
        SKU {product.sku} · slug {product.slug} — no editables acá (clave de sincronización con Siigo / enlaces ya indexados).
      </p>

      {updated ? (
        <p className="rounded-[var(--radius)] border border-success bg-success/10 px-3 py-2 text-sm text-success">Producto actualizado.</p>
      ) : null}
      {error ? (
        <p className="rounded-[var(--radius)] border border-danger bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>
      ) : null}

      <form action={updateProductAction} className="flex flex-col gap-4">
        <input type="hidden" name="productId" value={product.id} />

        <div className="flex flex-col gap-1">
          <label htmlFor="name" className="text-sm text-text-muted">
            Nombre
          </label>
          <input id="name" name="name" required defaultValue={product.name} className="rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm" />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="shortDescription" className="text-sm text-text-muted">
            Descripción corta
          </label>
          <input
            id="shortDescription"
            name="shortDescription"
            defaultValue={product.short_description ?? ""}
            className="rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="description" className="text-sm text-text-muted">
            Descripción
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            defaultValue={product.description ?? ""}
            className="rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label htmlFor="type" className="text-sm text-text-muted">
              Tipo
            </label>
            <select id="type" name="type" defaultValue={product.type} className="rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm">
              <option value="equipment">Equipo</option>
              <option value="part">Repuesto</option>
              <option value="supply">Insumo</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="warrantyMonths" className="text-sm text-text-muted">
              Garantía (meses)
            </label>
            <input
              id="warrantyMonths"
              name="warrantyMonths"
              type="number"
              min={0}
              defaultValue={product.warranty_months ?? undefined}
              className="rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label htmlFor="categoryId" className="text-sm text-text-muted">
              Categoría
            </label>
            <select
              id="categoryId"
              name="categoryId"
              required
              defaultValue={product.category_id}
              className="rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm"
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="brandId" className="text-sm text-text-muted">
              Marca
            </label>
            <select
              id="brandId"
              name="brandId"
              defaultValue={product.brand_id ?? ""}
              className="rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm"
            >
              <option value="">Sin marca</option>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 text-sm text-text">
          <label className="flex items-center gap-2">
            <input type="checkbox" name="isSerialized" value="1" defaultChecked={product.is_serialized} /> Genera postventa (serializado)
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="isActive" value="1" defaultChecked={product.is_active} /> Activo
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="isFeatured" value="1" defaultChecked={product.is_featured} /> Destacado
          </label>
        </div>

        <button
          type="submit"
          className="self-start rounded-[var(--radius)] bg-brand px-4 py-2 text-sm font-semibold text-text-inverse transition-colors hover:bg-brand-hover"
        >
          Guardar cambios
        </button>
      </form>

      <Link href="/admin/productos" className="text-sm text-brand hover:underline">
        Ver productos
      </Link>
    </div>
  );
}
