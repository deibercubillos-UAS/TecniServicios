import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { createServerClient } from "@tecni/db";
import { serverEnv } from "@tecni/shared";
import { Icon } from "@tecni/ui";

import { FileSizeGuardForm } from "@/components/file-size-guard-form";
import { NewBannerFields } from "@/components/new-banner-fields";
import { SettingFieldInput } from "@/components/setting-field-input";
import { SubmitButton } from "@/components/submit-button";
import { BANNER_PLACEMENT_GROUPS } from "@/lib/banner-placement";
import { HOME_HERO_TEXT_FIELDS } from "@/lib/settings-config";
import { SITE_PAGES } from "@/lib/site-pages";

import { createBannerAction, updateHeroTextAction } from "../actions";

export const metadata: Metadata = {
  title: "Nuevo banner — Panel maestro",
};

async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(serverEnv.NEXT_PUBLIC_SUPABASE_URL, serverEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    getAll: () => cookieStore.getAll(),
    setAll: () => {},
  });
}

export default async function NuevoBannerPage({ searchParams }: { searchParams: Promise<{ error?: string; placement?: string; heroTextUpdated?: string }> }) {
  const { error, placement, heroTextUpdated } = await searchParams;
  const initialPlacement = BANNER_PLACEMENT_GROUPS.some((group) => group.placement === placement) ? (placement as string) : "home_hero";

  const supabase = await getSupabase();
  const [{ data: categoriesData }, { data: heroSettingsData }] = await Promise.all([
    supabase.from("categories").select("id,slug,name").order("name"),
    initialPlacement === "home_hero" ? supabase.from("settings").select("key,value").like("key", "home_hero_%") : Promise.resolve({ data: [] }),
  ]);
  const heroSettingByKey = new Map(((heroSettingsData as { key: string; value: unknown }[] | null) ?? []).map((s) => [s.key, s.value]));
  const categoriesRows = (categoriesData as { id: string; slug: string; name: string }[] | null) ?? [];
  const categoryOptions = categoriesRows.map((c) => ({
    value: `/catalogo/categoria/${c.slug}`,
    label: c.name,
  }));
  const categoryIdOptions = categoriesRows.map((c) => ({ id: c.id, name: c.name }));

  return (
    <div className="mx-auto flex max-w-[700px] flex-col gap-6 px-4 py-16">
      <nav aria-label="Miga de pan" className="flex items-center gap-2 text-sm text-text-muted">
        <Link href="/admin/banners" className="hover:text-brand">
          Banners
        </Link>
        <Icon name="chevronRight" size={14} />
        <span className="text-text">Nuevo banner</span>
      </nav>

      <div>
        <h1 className="text-2xl font-bold text-text">Nuevo banner</h1>
        <p className="text-sm text-text-muted">Nace inactivo — no se muestra en el sitio hasta que lo actives, ya revisado.</p>
      </div>

      {error ? (
        <p role="alert" className="flex items-center gap-2 rounded-[var(--radius)] border border-danger bg-danger/10 px-3 py-2 text-sm text-danger">
          <Icon name="close" size={16} />
          {error}
        </p>
      ) : null}
      {heroTextUpdated ? (
        <p className="flex items-center gap-2 rounded-[var(--radius)] border border-success bg-success/10 px-3 py-2 text-sm text-success">
          <Icon name="checkCircle" size={16} />
          Texto del hero actualizado.
        </p>
      ) : null}

      {initialPlacement === "home_hero" ? (
        <details className="group rounded-xl border border-border bg-surface p-5">
          <summary className="flex cursor-pointer list-none items-center gap-2 font-bold text-text">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-subtle text-brand">
              <Icon name="document" size={16} />
            </span>
            Texto del hero (badge, título, descripción, botones)
            <Icon name="chevronDown" size={16} className="ml-auto text-text-muted transition-transform group-open:rotate-180" />
          </summary>
          <p className="mb-4 mt-3 text-xs text-text-muted">
            Un solo texto compartido por todas las fotos de "Home hero" — se guarda aparte, no hace falta crear este banner
            primero.
          </p>
          <form action={updateHeroTextAction} className="flex flex-col gap-4">
            <input type="hidden" name="returnTo" value="/admin/banners/nuevo?placement=home_hero" />
            {HOME_HERO_TEXT_FIELDS.map((field) => (
              <SettingFieldInput key={field.key} field={field} currentValue={heroSettingByKey.get(field.key)} />
            ))}
            <SubmitButton
              pendingLabel="Guardando…"
              className="w-fit rounded-[var(--radius)] bg-brand px-4 py-2 text-sm font-semibold text-text-inverse transition-colors hover:bg-brand-hover disabled:cursor-wait disabled:opacity-70"
            >
              Guardar texto del hero
            </SubmitButton>
          </form>
        </details>
      ) : null}

      <FileSizeGuardForm action={createBannerAction} maxMB={4} className="flex flex-col gap-6">
        <NewBannerFields
          initialPlacement={initialPlacement}
          pages={SITE_PAGES.map((p) => ({ value: p.value, label: p.label }))}
          categories={categoryOptions}
          categoryIdOptions={categoryIdOptions}
        />

        <SubmitButton
          pendingLabel="Creando…"
          className="self-start rounded-[var(--radius)] bg-brand px-4 py-2.5 text-sm font-semibold text-text-inverse transition-colors hover:bg-brand-hover disabled:cursor-wait disabled:opacity-70"
        >
          Crear banner
        </SubmitButton>
      </FileSizeGuardForm>

      <Link href="/admin/banners" className="text-sm text-brand hover:underline">
        Ver banners
      </Link>
    </div>
  );
}
