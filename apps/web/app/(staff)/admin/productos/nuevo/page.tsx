import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { createServerClient } from "@tecni/db";
import { serverEnv } from "@tecni/shared";
import { Icon } from "@tecni/ui";

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
      <nav aria-label="Miga de pan" className="flex items-center gap-2 text-sm text-text-muted">
        <Link href="/admin/productos" className="hover:text-brand">
          Productos
        </Link>
        <Icon name="chevronRight" size={14} />
        <span className="text-text">Nuevo producto</span>
      </nav>

      <div>
        <h1 className="text-2xl font-bold text-text">Nuevo producto</h1>
        <p className="text-sm text-text-muted">
          Nace como borrador. Al crearlo pasas directo a su ficha completa, donde subes fotos, especificaciones
          técnicas y el manual de postventa antes de publicarlo — igual que al editar un producto existente.
        </p>
      </div>

      {categories.length === 0 ? (
        <p className="flex items-center gap-2 rounded-[var(--radius)] border border-warning bg-warning/10 px-3 py-2 text-sm text-warning">
          <Icon name="clock" size={16} />
          Todavía no hay categorías creadas.{" "}
          <Link href="/admin/categorias/nueva" className="font-semibold underline">
            Crea una primero
          </Link>
          .
        </p>
      ) : null}

      {error ? (
        <p role="alert" className="flex items-center gap-2 rounded-[var(--radius)] border border-danger bg-danger/10 px-3 py-2 text-sm text-danger">
          <Icon name="close" size={16} />
          {error}
        </p>
      ) : null}

      <form action={createProductAction} className="flex flex-col gap-6">
        <section className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5">
          <h2 className="flex items-center gap-2 font-bold text-text">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-subtle text-brand">
              <Icon name="document" size={16} />
            </span>
            Datos básicos
          </h2>

          <div className="flex flex-col gap-1">
            <label htmlFor="sku" className="text-sm font-medium text-text-muted">
              SKU
            </label>
            <input
              id="sku"
              name="sku"
              required
              placeholder="Ej: BAL-COR-900"
              className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2 text-sm focus:border-brand focus:outline-none"
            />
            <p className="text-xs text-text-muted">Código único del producto — es la clave de sincronización con Siigo. No se puede cambiar después.</p>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="name" className="text-sm font-medium text-text-muted">
              Nombre
            </label>
            <input
              id="name"
              name="name"
              required
              placeholder="Ej: Balanceadora Corghi EM9080"
              className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2 text-sm focus:border-brand focus:outline-none"
            />
            <p className="text-xs text-text-muted">La URL del producto (slug) se genera sola a partir de este nombre.</p>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="shortDescription" className="text-sm font-medium text-text-muted">
              Descripción corta
            </label>
            <input
              id="shortDescription"
              name="shortDescription"
              placeholder="Una línea — se ve en las cards del catálogo"
              className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2 text-sm focus:border-brand focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="description" className="text-sm font-medium text-text-muted">
              Descripción
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              placeholder="Descripción completa — se ve en la ficha de producto"
              className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2 text-sm focus:border-brand focus:outline-none"
            />
          </div>
        </section>

        <section className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5">
          <h2 className="flex items-center gap-2 font-bold text-text">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-subtle text-brand">
              <Icon name="sliders" size={16} />
            </span>
            Clasificación
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label htmlFor="categoryId" className="text-sm font-medium text-text-muted">
                Categoría
              </label>
              <select
                id="categoryId"
                name="categoryId"
                required
                disabled={categories.length === 0}
                className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2 text-sm focus:border-brand focus:outline-none"
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-text-muted">Define qué especificaciones técnicas se piden más adelante.</p>
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="brandId" className="text-sm font-medium text-text-muted">
                Marca
              </label>
              <select
                id="brandId"
                name="brandId"
                className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2 text-sm focus:border-brand focus:outline-none"
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

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label htmlFor="type" className="text-sm font-medium text-text-muted">
                Tipo
              </label>
              <select id="type" name="type" className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2 text-sm focus:border-brand focus:outline-none">
                <option value="equipment">Equipo</option>
                <option value="part">Repuesto</option>
                <option value="supply">Insumo</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="warrantyMonths" className="text-sm font-medium text-text-muted">
                Garantía (meses)
              </label>
              <input
                id="warrantyMonths"
                name="warrantyMonths"
                type="number"
                min={0}
                placeholder="Ej: 12"
                className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2 text-sm focus:border-brand focus:outline-none"
              />
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-5">
          <h2 className="flex items-center gap-2 font-bold text-text">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-subtle text-brand">
              <Icon name="checkCircle" size={16} />
            </span>
            Visibilidad
          </h2>

          <label className="flex items-start gap-2 text-sm text-text">
            <input type="checkbox" name="isSerialized" value="1" className="mt-0.5" />
            <span>
              <span className="font-medium">Genera postventa</span>
              <span className="block text-xs text-text-muted">
                Márcalo si es un equipo (no un repuesto o insumo): al venderse crea manual, agenda de mantenimiento e historial de servicio para el cliente.
              </span>
            </span>
          </label>
          <label className="flex items-start gap-2 text-sm text-text">
            <input type="checkbox" name="isActive" value="1" className="mt-0.5" />
            <span>
              <span className="font-medium">Activo (publicado)</span>
              <span className="block text-xs text-text-muted">
                Déjalo sin marcar por ahora — súbele fotos y ficha técnica primero, luego publícalo desde su ficha o desde la lista de productos.
              </span>
            </span>
          </label>
          <label className="flex items-start gap-2 text-sm text-text">
            <input type="checkbox" name="isFeatured" value="1" className="mt-0.5" />
            <span>
              <span className="font-medium">Destacado</span>
              <span className="block text-xs text-text-muted">Aparece resaltado en secciones especiales del catálogo.</span>
            </span>
          </label>
          <label className="flex items-start gap-2 text-sm text-text">
            <input type="checkbox" name="isBestseller" value="1" className="mt-0.5" />
            <span>
              <span className="font-medium">Lo más vendido</span>
              <span className="block text-xs text-text-muted">Selección manual tuya — aparece en la sección "Lo más vendido" de la home.</span>
            </span>
          </label>
        </section>

        <button
          type="submit"
          disabled={categories.length === 0}
          className="self-start rounded-[var(--radius)] bg-brand px-5 py-2.5 text-sm font-semibold text-text-inverse transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-40"
        >
          Crear y continuar
        </button>
      </form>
    </div>
  );
}
