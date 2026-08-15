import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { createServerClient } from "@tecni/db";
import { serverEnv } from "@tecni/shared";
import { Icon } from "@tecni/ui";

import { PromotionDiscountFields } from "@/components/promotion-discount-fields";
import { PromotionScopeFields } from "@/components/promotion-scope-fields";
import { SubmitButton } from "@/components/submit-button";

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
      <nav aria-label="Miga de pan" className="flex items-center gap-2 text-sm text-text-muted">
        <Link href="/admin/promociones" className="hover:text-brand">
          Promociones
        </Link>
        <Icon name="chevronRight" size={14} />
        <span className="text-text">Nueva promoción</span>
      </nav>

      <div>
        <h1 className="text-2xl font-bold text-text">Nueva promoción</h1>
        <p className="text-sm text-text-muted">
          Se muestra como badge/franja en el catálogo y, si está activa, en la sección de descuentos del home. No cambia el precio real — sigue
          viniendo de Siigo.
        </p>
      </div>

      {error ? (
        <p role="alert" className="flex items-center gap-2 rounded-[var(--radius)] border border-danger bg-danger/10 px-3 py-2 text-sm text-danger">
          <Icon name="close" size={16} />
          {error}
        </p>
      ) : null}

      <form action={createPromotionAction} className="flex flex-col gap-6">
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
            <input id="name" name="name" required className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2 text-sm focus:border-brand focus:outline-none" />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="description" className="text-sm font-medium text-text-muted">
              Descripción (opcional)
            </label>
            <textarea
              id="description"
              name="description"
              rows={2}
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

          <PromotionDiscountFields defaultType="percentage" defaultValue="" />

          <PromotionScopeFields products={products} categories={categories} defaultScope="product" defaultProductId="" defaultCategoryId="" />
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
                className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2 text-sm focus:border-brand focus:outline-none"
              />
            </div>
          </div>

          <label className="flex items-start gap-2 text-sm text-text">
            <input type="checkbox" name="isActive" value="1" defaultChecked className="mt-0.5" />
            <span>
              <span className="font-medium">Activa</span>
              <span className="block text-xs text-text-muted">Desmárcala si quieres crearla y activarla más tarde.</span>
            </span>
          </label>
        </section>

        <SubmitButton
          pendingLabel="Creando…"
          className="self-start rounded-[var(--radius)] bg-brand px-4 py-2.5 text-sm font-semibold text-text-inverse transition-colors hover:bg-brand-hover disabled:cursor-wait disabled:opacity-70"
        >
          Crear promoción
        </SubmitButton>
      </form>

      <Link href="/admin/promociones" className="text-sm text-brand hover:underline">
        Ver promociones
      </Link>
    </div>
  );
}
