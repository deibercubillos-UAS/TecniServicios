import type { Metadata } from "next";
import { cookies } from "next/headers";
import { createServerClient } from "@tecni/db";
import { serverEnv } from "@tecni/shared";

import { createPromotionAction } from "../actions";

export const metadata: Metadata = {
  title: "Nueva promoción — Panel maestro",
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

export default async function NuevaPromocionPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const supabase = await getSupabase();

  const { data: productsData } = await supabase.from("products").select("id,name").order("name").limit(200);
  const { data: categoriesData } = await supabase.from("categories").select("id,name").order("name");
  const products = (productsData as OptionRow[] | null) ?? [];
  const categories = (categoriesData as OptionRow[] | null) ?? [];

  return (
    <div className="mx-auto flex max-w-[700px] flex-col gap-6 px-4 py-16">
      <h1 className="text-2xl font-bold text-text">Nueva promoción</h1>
      <p className="text-sm text-text-muted">
        Se muestra en el catálogo (badge/franja). No cambia el precio real — sigue viniendo de Siigo (pendiente de decisión, ver
        `docs/15-MODULE-CONTENT.md`).
      </p>

      {error ? (
        <p role="alert" className="rounded-[var(--radius)] border border-danger bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>
      ) : null}

      <form action={createPromotionAction} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="name" className="text-sm text-text-muted">
            Nombre
          </label>
          <input id="name" name="name" required className="rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm" />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="description" className="text-sm text-text-muted">
            Descripción (opcional)
          </label>
          <textarea id="description" name="description" rows={2} className="rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm" />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label htmlFor="discountType" className="text-sm text-text-muted">
              Tipo de descuento
            </label>
            <select id="discountType" name="discountType" className="rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm">
              <option value="percentage">Porcentaje</option>
              <option value="fixed_amount">Monto fijo (COP)</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="discountValue" className="text-sm text-text-muted">
              Valor
            </label>
            <input
              id="discountValue"
              name="discountValue"
              type="number"
              min={0}
              step="0.01"
              required
              className="rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm"
            />
          </div>
        </div>

        <fieldset className="flex flex-col gap-2 rounded-[var(--radius)] border border-border p-3">
          <legend className="px-1 text-sm text-text-muted">Alcance — exactamente uno</legend>
          <label className="flex items-center gap-2 text-sm text-text">
            <input type="radio" name="scope" value="product" defaultChecked /> Un producto
          </label>
          <select name="productId" className="rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm">
            <option value="">Seleccionar producto</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm text-text">
            <input type="radio" name="scope" value="category" /> Una categoría
          </label>
          <select name="categoryId" className="rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm">
            <option value="">Seleccionar categoría</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </fieldset>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label htmlFor="startsAt" className="text-sm text-text-muted">
              Vigente desde (opcional)
            </label>
            <input id="startsAt" name="startsAt" type="datetime-local" className="rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm" />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="endsAt" className="text-sm text-text-muted">
              Vigente hasta (opcional)
            </label>
            <input id="endsAt" name="endsAt" type="datetime-local" className="rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm" />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-text">
          <input type="checkbox" name="isActive" value="1" defaultChecked /> Activa
        </label>

        <button
          type="submit"
          className="self-start rounded-[var(--radius)] bg-brand px-4 py-2 text-sm font-semibold text-text-inverse transition-colors hover:bg-brand-hover"
        >
          Crear promoción
        </button>
      </form>
    </div>
  );
}
