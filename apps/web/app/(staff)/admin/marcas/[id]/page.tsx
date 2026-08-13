import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { createServerClient } from "@tecni/db";
import { serverEnv } from "@tecni/shared";

import { deleteBrandLogoAction, updateBrandAction, uploadBrandLogoAction } from "../actions";

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
  searchParams: Promise<{ error?: string; updated?: string; logoUploaded?: string; logoDeleted?: string }>;
}) {
  const { id } = await params;
  const { error, updated, logoUploaded, logoDeleted } = await searchParams;
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
      {logoUploaded ? (
        <p className="rounded-[var(--radius)] border border-success bg-success/10 px-3 py-2 text-sm text-success">Logo actualizado.</p>
      ) : null}
      {logoDeleted ? (
        <p className="rounded-[var(--radius)] border border-success bg-success/10 px-3 py-2 text-sm text-success">Logo eliminado.</p>
      ) : null}
      {error ? (
        <p role="alert" className="rounded-[var(--radius)] border border-danger bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>
      ) : null}

      <div className="flex flex-col gap-3 rounded-[var(--radius)] border border-border bg-surface p-4">
        <h2 className="text-sm font-semibold text-text">Logo de marca</h2>
        <p className="text-sm text-text-muted">
          Se muestra en la franja "Distribuidor autorizado de" de la home. Preferible sobre fondo transparente o
          blanco.
        </p>

        {brand.logo_url ? (
          <img src={brand.logo_url} alt="" className="h-16 w-auto max-w-xs rounded-[var(--radius)] border border-border bg-white object-contain p-2" />
        ) : (
          <p className="text-sm text-text-muted">Sin logo todavía — se muestra el nombre de la marca como respaldo.</p>
        )}

        <form action={uploadBrandLogoAction} className="flex flex-wrap items-center gap-3">
          <input type="hidden" name="brandId" value={brand.id} />
          <input type="file" name="logo" accept="image/*" required aria-label="Subir logo de marca" className="text-sm text-text" />
          <button
            type="submit"
            className="rounded-[var(--radius)] bg-brand px-3 py-2 text-sm font-semibold text-text-inverse transition-colors hover:bg-brand-hover"
          >
            {brand.logo_url ? "Reemplazar logo" : "Subir logo"}
          </button>
        </form>

        {brand.logo_url ? (
          <form action={deleteBrandLogoAction}>
            <input type="hidden" name="brandId" value={brand.id} />
            <button type="submit" className="text-sm font-medium text-danger hover:underline">
              Eliminar logo
            </button>
          </form>
        ) : null}
      </div>

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
