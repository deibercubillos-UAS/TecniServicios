import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { createServerClient } from "@tecni/db";
import { serverEnv } from "@tecni/shared";
import { Icon } from "@tecni/ui";

import { StatusBadge } from "@/components/status-badge";

export const metadata: Metadata = {
  title: "Categorías y marcas — Panel maestro",
};

interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  image_url: string | null;
}

interface BrandRow {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  logo_url: string | null;
}

async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(serverEnv.NEXT_PUBLIC_SUPABASE_URL, serverEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    getAll: () => cookieStore.getAll(),
    setAll: () => {},
  });
}

export default async function AdminCategoriasYMarcasPage({
  searchParams,
}: {
  searchParams: Promise<{ seccion?: string; created?: string }>;
}) {
  const { seccion, created } = await searchParams;
  const isBrands = seccion === "marcas";
  const supabase = await getSupabase();

  const [{ data: categoriesData }, { data: brandsData }] = await Promise.all([
    supabase.from("categories").select("id,name,slug,is_active,image_url").order("name"),
    supabase.from("brands").select("id,name,slug,is_active,logo_url").order("name"),
  ]);
  const categories = (categoriesData as CategoryRow[] | null) ?? [];
  const brands = (brandsData as BrandRow[] | null) ?? [];

  return (
    <div className="mx-auto flex max-w-[1000px] flex-col gap-6 px-4 py-16">
      <div>
        <h1 className="text-2xl font-bold text-text">Categorías y marcas</h1>
        <p className="text-sm text-text-muted">La organización del catálogo: en qué categoría entra cada producto y de qué marca es.</p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border">
        <nav className="flex gap-1">
          <Link
            href="/admin/categorias"
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
              !isBrands ? "border-brand text-brand" : "border-transparent text-text-muted hover:text-text"
            }`}
          >
            <Icon name="sliders" size={16} />
            Categorías ({categories.length})
          </Link>
          <Link
            href="/admin/categorias?seccion=marcas"
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
              isBrands ? "border-brand text-brand" : "border-transparent text-text-muted hover:text-text"
            }`}
          >
            <Icon name="medal" size={16} />
            Marcas ({brands.length})
          </Link>
        </nav>
        <Link
          href={isBrands ? "/admin/marcas/nueva" : "/admin/categorias/nueva"}
          className="mb-2 flex items-center gap-2 rounded-[var(--radius)] bg-brand px-4 py-2 text-sm font-semibold text-text-inverse transition-colors hover:bg-brand-hover"
        >
          <Icon name="box" size={16} />
          {isBrands ? "Nueva marca" : "Nueva categoría"}
        </Link>
      </div>

      {created ? (
        <p className="flex items-center gap-2 rounded-[var(--radius)] border border-success bg-success/10 px-3 py-2 text-sm text-success">
          <Icon name="checkCircle" size={16} />
          {isBrands ? "Marca creada." : "Categoría creada."}
        </p>
      ) : null}

      {isBrands ? (
        brands.length === 0 ? (
          <EmptyState label="Sin marcas todavía." href="/admin/marcas/nueva" cta="Crear la primera marca" />
        ) : (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {brands.map((brand) => (
              <li key={brand.id}>
                <Link
                  href={`/admin/marcas/${brand.id}`}
                  className="group flex items-center gap-3 rounded-xl border border-border bg-surface p-3 transition-colors hover:border-brand"
                >
                  <Thumbnail url={brand.logo_url} fallbackIcon="medal" contain />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-text group-hover:text-brand">{brand.name}</p>
                    <p className="truncate text-xs text-text-muted">{brand.slug}</p>
                    <div className="mt-1">
                      {brand.is_active ? (
                        <StatusBadge label="Activa" tone="success" icon="checkCircle" />
                      ) : (
                        <StatusBadge label="Inactiva" tone="muted" icon="close" />
                      )}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )
      ) : categories.length === 0 ? (
        <EmptyState label="Sin categorías todavía." href="/admin/categorias/nueva" cta="Crear la primera categoría" />
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <li key={category.id}>
              <Link
                href={`/admin/categorias/${category.id}`}
                className="group flex items-center gap-3 rounded-xl border border-border bg-surface p-3 transition-colors hover:border-brand"
              >
                <Thumbnail url={category.image_url} fallbackIcon="image" contain={false} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-text group-hover:text-brand">{category.name}</p>
                  <p className="truncate text-xs text-text-muted">{category.slug}</p>
                  <div className="mt-1">
                    {category.is_active ? (
                      <StatusBadge label="Activa" tone="success" icon="checkCircle" />
                    ) : (
                      <StatusBadge label="Inactiva" tone="muted" icon="close" />
                    )}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Thumbnail({ url, fallbackIcon, contain }: { url: string | null; fallbackIcon: "image" | "medal"; contain: boolean }) {
  return (
    <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-bg-alt">
      {url ? (
        <img src={url} alt="" className={`h-full w-full ${contain ? "object-contain p-1.5" : "object-cover"}`} />
      ) : (
        <Icon name={fallbackIcon} size={20} className="text-text-muted" />
      )}
    </div>
  );
}

function EmptyState({ label, href, cta }: { label: string; href: string; cta: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-bg-alt px-6 py-16 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-subtle text-brand">
        <Icon name="box" size={26} />
      </span>
      <p className="font-semibold text-text">{label}</p>
      <Link href={href} className="rounded-[var(--radius)] bg-brand px-4 py-2 text-sm font-semibold text-text-inverse hover:bg-brand-hover">
        {cta}
      </Link>
    </div>
  );
}
