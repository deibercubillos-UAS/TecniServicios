import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { createServerClient } from "@tecni/db";
import { serverEnv } from "@tecni/shared";

import { updateBrandAction } from "../actions";

export const metadata: Metadata = {
  title: "Editar marca — Panel maestro",
};

interface BrandRow {
  id: string;
  slug: string;
  name: string;
  logo_url: string | null;
  is_active: boolean;
}

async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(serverEnv.NEXT_PUBLIC_SUPABASE_URL, serverEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    getAll: () => cookieStore.getAll(),
    setAll: () => {},
  });
}

export default async function EditarMarcaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; updated?: string }>;
}) {
  const { id } = await params;
  const { error, updated } = await searchParams;
  const supabase = await getSupabase();

  const { data: brandData } = await supabase.from("brands").select("id,slug,name,logo_url,is_active").eq("id", id).maybeSingle();
  const brand = brandData as BrandRow | null;

  if (!brand) {
    return (
      <div className="mx-auto max-w-[700px] px-4 py-16">
        <h1 className="mb-4 text-2xl font-bold text-text">Marca no encontrada</h1>
        <Link href="/admin/marcas" className="text-brand hover:underline">
          Ver marcas
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-[700px] flex-col gap-6 px-4 py-16">
      <h1 className="text-2xl font-bold text-text">{brand.name}</h1>

      {updated ? (
        <p className="rounded-[var(--radius)] border border-success bg-success/10 px-3 py-2 text-sm text-success">Marca actualizada.</p>
      ) : null}
      {error ? (
        <p className="rounded-[var(--radius)] border border-danger bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>
      ) : null}

      <form action={updateBrandAction} className="flex flex-col gap-4">
        <input type="hidden" name="brandId" value={brand.id} />

        <div className="flex flex-col gap-1">
          <label htmlFor="slug" className="text-sm text-text-muted">
            Slug
          </label>
          <input id="slug" name="slug" required defaultValue={brand.slug} className="rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm" />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="name" className="text-sm text-text-muted">
            Nombre
          </label>
          <input id="name" name="name" required defaultValue={brand.name} className="rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm" />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="logoUrl" className="text-sm text-text-muted">
            URL del logo (opcional — sin subida de archivo, sin R2)
          </label>
          <input
            id="logoUrl"
            name="logoUrl"
            type="url"
            defaultValue={brand.logo_url ?? ""}
            className="rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm"
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-text">
          <input type="checkbox" name="isActive" value="1" defaultChecked={brand.is_active} /> Activa
        </label>

        <button
          type="submit"
          className="self-start rounded-[var(--radius)] bg-brand px-4 py-2 text-sm font-semibold text-text-inverse transition-colors hover:bg-brand-hover"
        >
          Guardar cambios
        </button>
      </form>

      <Link href="/admin/marcas" className="text-sm text-brand hover:underline">
        Ver marcas
      </Link>
    </div>
  );
}
