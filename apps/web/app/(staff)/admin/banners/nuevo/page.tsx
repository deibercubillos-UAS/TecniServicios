import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { createServerClient } from "@tecni/db";
import { serverEnv } from "@tecni/shared";
import { Icon } from "@tecni/ui";

import { FileSizeGuardForm } from "@/components/file-size-guard-form";
import { NewBannerFields } from "@/components/new-banner-fields";
import { SubmitButton } from "@/components/submit-button";
import { BANNER_PLACEMENT_GROUPS } from "@/lib/banner-placement";
import { SITE_PAGES } from "@/lib/site-pages";

import { createBannerAction } from "../actions";

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

export default async function NuevoBannerPage({ searchParams }: { searchParams: Promise<{ error?: string; placement?: string }> }) {
  const { error, placement } = await searchParams;
  const initialPlacement = BANNER_PLACEMENT_GROUPS.some((group) => group.placement === placement) ? (placement as string) : "home_hero";

  const supabase = await getSupabase();
  const { data: categoriesData } = await supabase.from("categories").select("slug,name").order("name");
  const categoryOptions = ((categoriesData as { slug: string; name: string }[] | null) ?? []).map((c) => ({
    value: `/catalogo?categoria=${c.slug}`,
    label: c.name,
  }));

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

      <FileSizeGuardForm action={createBannerAction} maxMB={4} className="flex flex-col gap-6">
        <NewBannerFields
          initialPlacement={initialPlacement}
          pages={SITE_PAGES.map((p) => ({ value: p.value, label: p.label }))}
          categories={categoryOptions}
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
