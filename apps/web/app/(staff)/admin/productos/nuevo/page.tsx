import type { Metadata } from "next";
import { cookies } from "next/headers";
import { createServerClient } from "@tecni/db";
import { serverEnv } from "@tecni/shared";

import { createProductAction } from "../actions";

export const metadata: Metadata = {
  title: "Nuevo producto — Panel maestro",
};

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

export default async function NuevoProductoPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const supabase = await getSupabase();

  const { data: categoriesData } = await supabase.from("categories").select("id,name").order("name");
  const { data: brandsData } = await supabase.from("brands").select("id,name").order("name");
  const categories = (categoriesData as OptionRow[] | null) ?? [];
  const brands = (brandsData as OptionRow[] | null) ?? [];

  return (
    <div className="mx-auto flex max-w-[700px] flex-col gap-6 px-4 py-16">
      <h1 className="text-2xl font-bold text-text">Nuevo producto</h1>

      {error ? (
        <p className="rounded-[var(--radius)] border border-danger bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>
      ) : null}

      <form action={createProductAction} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label htmlFor="sku" className="text-sm text-text-muted">
              SKU
            </label>
            <input id="sku" name="sku" required className="rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm" />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="slug" className="text-sm text-text-muted">
              Slug
            </label>
            <input id="slug" name="slug" required className="rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm" />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="name" className="text-sm text-text-muted">
            Nombre
          </label>
          <input id="name" name="name" required className="rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm" />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="shortDescription" className="text-sm text-text-muted">
            Descripción corta
          </label>
          <input id="shortDescription" name="shortDescription" className="rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm" />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="description" className="text-sm text-text-muted">
            Descripción
          </label>
          <textarea id="description" name="description" rows={4} className="rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm" />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label htmlFor="type" className="text-sm text-text-muted">
              Tipo
            </label>
            <select id="type" name="type" className="rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm">
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
              className="rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label htmlFor="categoryId" className="text-sm text-text-muted">
              Categoría
            </label>
            <select id="categoryId" name="categoryId" required className="rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm">
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
            <select id="brandId" name="brandId" className="rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm">
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
            <input type="checkbox" name="isSerialized" value="1" /> Genera postventa (serializado)
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="isActive" value="1" defaultChecked /> Activo
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="isFeatured" value="1" /> Destacado
          </label>
        </div>

        <button
          type="submit"
          className="self-start rounded-[var(--radius)] bg-brand px-4 py-2 text-sm font-semibold text-text-inverse transition-colors hover:bg-brand-hover"
        >
          Crear producto
        </button>
      </form>
    </div>
  );
}
