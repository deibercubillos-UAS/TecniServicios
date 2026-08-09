import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { createServerClient } from "@tecni/db";
import { serverEnv } from "@tecni/shared";

import { updatePromotionAction } from "../actions";

export const metadata: Metadata = {
  title: "Editar promoción — Panel maestro",
};

interface OptionRow {
  id: string;
  name: string;
}

interface PromotionRow {
  id: string;
  name: string;
  description: string | null;
  discount_type: string;
  discount_value: number;
  product_id: string | null;
  category_id: string | null;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
}

async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(serverEnv.NEXT_PUBLIC_SUPABASE_URL, serverEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    getAll: () => cookieStore.getAll(),
    setAll: () => {},
  });
}

function toLocalInputValue(iso: string | null): string {
  if (!iso) return "";
  return iso.slice(0, 16);
}

export default async function EditarPromocionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; updated?: string }>;
}) {
  const { id } = await params;
  const { error, updated } = await searchParams;
  const supabase = await getSupabase();

  const { data: promoData } = await supabase
    .from("promotions")
    .select("id,name,description,discount_type,discount_value,product_id,category_id,starts_at,ends_at,is_active")
    .eq("id", id)
    .maybeSingle();
  const promo = promoData as PromotionRow | null;

  if (!promo) {
    return (
      <div className="mx-auto max-w-[700px] px-4 py-16">
        <h1 className="mb-4 text-2xl font-bold text-text">Promoción no encontrada</h1>
        <Link href="/admin/promociones" className="text-brand hover:underline">
          Ver promociones
        </Link>
      </div>
    );
  }

  const { data: productsData } = await supabase.from("products").select("id,name").order("name").limit(200);
  const { data: categoriesData } = await supabase.from("categories").select("id,name").order("name");
  const products = (productsData as OptionRow[] | null) ?? [];
  const categories = (categoriesData as OptionRow[] | null) ?? [];
  const scope = promo.product_id ? "product" : "category";

  return (
    <div className="mx-auto flex max-w-[700px] flex-col gap-6 px-4 py-16">
      <h1 className="text-2xl font-bold text-text">{promo.name}</h1>

      {updated ? (
        <p className="rounded-[var(--radius)] border border-success bg-success/10 px-3 py-2 text-sm text-success">Promoción actualizada.</p>
      ) : null}
      {error ? (
        <p className="rounded-[var(--radius)] border border-danger bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>
      ) : null}

      <form action={updatePromotionAction} className="flex flex-col gap-4">
        <input type="hidden" name="promotionId" value={promo.id} />

        <div className="flex flex-col gap-1">
          <label htmlFor="name" className="text-sm text-text-muted">
            Nombre
          </label>
          <input id="name" name="name" required defaultValue={promo.name} className="rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm" />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="description" className="text-sm text-text-muted">
            Descripción (opcional)
          </label>
          <textarea
            id="description"
            name="description"
            rows={2}
            defaultValue={promo.description ?? ""}
            className="rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label htmlFor="discountType" className="text-sm text-text-muted">
              Tipo de descuento
            </label>
            <select
              id="discountType"
              name="discountType"
              defaultValue={promo.discount_type}
              className="rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm"
            >
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
              defaultValue={promo.discount_value}
              className="rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm"
            />
          </div>
        </div>

        <fieldset className="flex flex-col gap-2 rounded-[var(--radius)] border border-border p-3">
          <legend className="px-1 text-sm text-text-muted">Alcance — exactamente uno</legend>
          <label className="flex items-center gap-2 text-sm text-text">
            <input type="radio" name="scope" value="product" defaultChecked={scope === "product"} /> Un producto
          </label>
          <select name="productId" defaultValue={promo.product_id ?? ""} className="rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm">
            <option value="">Seleccionar producto</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm text-text">
            <input type="radio" name="scope" value="category" defaultChecked={scope === "category"} /> Una categoría
          </label>
          <select name="categoryId" defaultValue={promo.category_id ?? ""} className="rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm">
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
            <input
              id="startsAt"
              name="startsAt"
              type="datetime-local"
              defaultValue={toLocalInputValue(promo.starts_at)}
              className="rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="endsAt" className="text-sm text-text-muted">
              Vigente hasta (opcional)
            </label>
            <input
              id="endsAt"
              name="endsAt"
              type="datetime-local"
              defaultValue={toLocalInputValue(promo.ends_at)}
              className="rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm"
            />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-text">
          <input type="checkbox" name="isActive" value="1" defaultChecked={promo.is_active} /> Activa
        </label>

        <button
          type="submit"
          className="self-start rounded-[var(--radius)] bg-brand px-4 py-2 text-sm font-semibold text-text-inverse transition-colors hover:bg-brand-hover"
        >
          Guardar cambios
        </button>
      </form>

      <Link href="/admin/promociones" className="text-sm text-brand hover:underline">
        Ver promociones
      </Link>
    </div>
  );
}
