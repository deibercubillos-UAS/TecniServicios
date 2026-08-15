import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { createServerClient } from "@tecni/db";
import { serverEnv } from "@tecni/shared";
import { Icon } from "@tecni/ui";

import { PromotionDiscountFields } from "@/components/promotion-discount-fields";
import { PromotionScopeFields } from "@/components/promotion-scope-fields";
import { StatusBadge } from "@/components/status-badge";
import { SubmitButton } from "@/components/submit-button";

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
      <nav aria-label="Miga de pan" className="flex flex-wrap items-center gap-2 text-sm text-text-muted">
        <Link href="/admin/promociones" className="hover:text-brand">
          Promociones
        </Link>
        <Icon name="chevronRight" size={14} />
        <span className="truncate text-text">{promo.name}</span>
      </nav>

      <div className="flex flex-wrap items-start justify-between gap-2">
        <h1 className="text-2xl font-bold text-text">{promo.name}</h1>
        {promo.is_active ? (
          <StatusBadge label="Activa" tone="success" icon="checkCircle" />
        ) : (
          <StatusBadge label="Inactiva" tone="muted" icon="close" />
        )}
      </div>

      {updated ? (
        <p className="flex items-center gap-2 rounded-[var(--radius)] border border-success bg-success/10 px-3 py-2 text-sm text-success">
          <Icon name="checkCircle" size={16} />
          Promoción actualizada.
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="flex items-center gap-2 rounded-[var(--radius)] border border-danger bg-danger/10 px-3 py-2 text-sm text-danger">
          <Icon name="close" size={16} />
          {error}
        </p>
      ) : null}

      <form action={updatePromotionAction} className="flex flex-col gap-6">
        <input type="hidden" name="promotionId" value={promo.id} />

        <section className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5">
          <h2 className="flex items-center gap-2 font-bold text-text">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-subtle text-brand">
              <Icon name="document" size={16} />
            </span>
            Datos básicos
          </h2>

          <div className="flex flex-col gap-1">
            <label htmlFor="name" className="text-sm font-medium text-text-muted">
              Nombre
            </label>
            <input
              id="name"
              name="name"
              required
              defaultValue={promo.name}
              className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2 text-sm focus:border-brand focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="description" className="text-sm font-medium text-text-muted">
              Descripción (opcional)
            </label>
            <textarea
              id="description"
              name="description"
              rows={2}
              defaultValue={promo.description ?? ""}
              className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2 text-sm focus:border-brand focus:outline-none"
            />
          </div>
        </section>

        <section className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5">
          <h2 className="flex items-center gap-2 font-bold text-text">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-subtle text-brand">
              <Icon name="sliders" size={16} />
            </span>
            Descuento y alcance
          </h2>

          <PromotionDiscountFields defaultType={promo.discount_type} defaultValue={String(promo.discount_value)} />

          <PromotionScopeFields
            products={products}
            categories={categories}
            defaultScope={scope}
            defaultProductId={promo.product_id ?? ""}
            defaultCategoryId={promo.category_id ?? ""}
          />
        </section>

        <section className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5">
          <h2 className="flex items-center gap-2 font-bold text-text">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-subtle text-brand">
              <Icon name="clock" size={16} />
            </span>
            Vigencia
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label htmlFor="startsAt" className="text-sm font-medium text-text-muted">
                Vigente desde (opcional)
              </label>
              <input
                id="startsAt"
                name="startsAt"
                type="datetime-local"
                defaultValue={toLocalInputValue(promo.starts_at)}
                className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2 text-sm focus:border-brand focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="endsAt" className="text-sm font-medium text-text-muted">
                Vigente hasta (opcional)
              </label>
              <input
                id="endsAt"
                name="endsAt"
                type="datetime-local"
                defaultValue={toLocalInputValue(promo.ends_at)}
                className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2 text-sm focus:border-brand focus:outline-none"
              />
            </div>
          </div>

          <label className="flex items-start gap-2 text-sm text-text">
            <input type="checkbox" name="isActive" value="1" defaultChecked={promo.is_active} className="mt-0.5" />
            <span>
              <span className="font-medium">Activa</span>
              <span className="block text-xs text-text-muted">Visible en catálogo y home. Desmárcala para ocultarla sin eliminarla.</span>
            </span>
          </label>
        </section>

        <SubmitButton
          pendingLabel="Guardando…"
          className="self-start rounded-[var(--radius)] bg-brand px-4 py-2.5 text-sm font-semibold text-text-inverse transition-colors hover:bg-brand-hover disabled:cursor-wait disabled:opacity-70"
        >
          Guardar cambios
        </SubmitButton>
      </form>

      <Link href="/admin/promociones" className="text-sm text-brand hover:underline">
        Ver promociones
      </Link>
    </div>
  );
}
