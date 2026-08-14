import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { createServerClient } from "@tecni/db";
import { serverEnv } from "@tecni/shared";
import { Icon } from "@tecni/ui";

import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { FileSizeGuardForm } from "@/components/file-size-guard-form";
import { StatusBadge } from "@/components/status-badge";
import { UploadSubmitButton } from "@/components/upload-submit-button";

import { deleteBrandAction, deleteBrandLogoAction, updateBrandAction, uploadBrandLogoAction } from "../actions";

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
  searchParams: Promise<{ error?: string; created?: string; updated?: string; logoUploaded?: string; logoDeleted?: string }>;
}) {
  const { id } = await params;
  const { error, created, updated, logoUploaded, logoDeleted } = await searchParams;
  const supabase = await getSupabase();

  const { data: brandData } = await supabase.from("brands").select("id,slug,name,logo_url,is_active").eq("id", id).maybeSingle();
  const brand = brandData as BrandRow | null;

  if (!brand) {
    return (
      <div className="mx-auto max-w-[700px] px-4 py-16">
        <h1 className="mb-4 text-2xl font-bold text-text">Marca no encontrada</h1>
        <Link href="/admin/categorias?seccion=marcas" className="text-brand hover:underline">
          Ver marcas
        </Link>
      </div>
    );
  }

  const { count: productCount } = await supabase.from("products").select("id", { count: "exact", head: true }).eq("brand_id", id);

  return (
    <div className="mx-auto flex max-w-[700px] flex-col gap-6 px-4 py-16">
      <nav aria-label="Miga de pan" className="flex flex-wrap items-center gap-2 text-sm text-text-muted">
        <Link href="/admin/categorias?seccion=marcas" className="hover:text-brand">
          Categorías y marcas
        </Link>
        <Icon name="chevronRight" size={14} />
        <span className="truncate text-text">{brand.name}</span>
      </nav>

      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-text">{brand.name}</h1>
          <p className="text-sm text-text-muted">
            slug {brand.slug} — no editable acá (rompería enlaces ya indexados) · {productCount ?? 0} producto{productCount === 1 ? "" : "s"} asociado
            {productCount === 1 ? "" : "s"}
          </p>
        </div>
        {brand.is_active ? (
          <StatusBadge label="Activa" tone="success" icon="checkCircle" />
        ) : (
          <StatusBadge label="Inactiva" tone="muted" icon="close" />
        )}
      </div>

      {created ? (
        <p className="flex items-center gap-2 rounded-[var(--radius)] border border-success bg-success/10 px-3 py-2 text-sm text-success">
          <Icon name="checkCircle" size={16} />
          Marca creada. Súbele un logo antes de activarla.
        </p>
      ) : null}
      {updated ? (
        <p className="flex items-center gap-2 rounded-[var(--radius)] border border-success bg-success/10 px-3 py-2 text-sm text-success">
          <Icon name="checkCircle" size={16} />
          Marca actualizada.
        </p>
      ) : null}
      {logoUploaded ? (
        <p className="flex items-center gap-2 rounded-[var(--radius)] border border-success bg-success/10 px-3 py-2 text-sm text-success">
          <Icon name="checkCircle" size={16} />
          Logo actualizado.
        </p>
      ) : null}
      {logoDeleted ? (
        <p className="flex items-center gap-2 rounded-[var(--radius)] border border-success bg-success/10 px-3 py-2 text-sm text-success">
          <Icon name="checkCircle" size={16} />
          Logo eliminado.
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="flex items-center gap-2 rounded-[var(--radius)] border border-danger bg-danger/10 px-3 py-2 text-sm text-danger">
          <Icon name="close" size={16} />
          {error}
        </p>
      ) : null}

      <section className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5">
        <h2 className="flex items-center gap-2 font-bold text-text">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-subtle text-brand">
            <Icon name="image" size={16} />
          </span>
          Logo de marca
        </h2>
        <p className="text-sm text-text-muted">
          Se muestra en la franja "Distribuidor autorizado de" de la home. Preferible sobre fondo transparente o blanco.
        </p>

        {brand.logo_url ? (
          <img src={brand.logo_url} alt="" className="h-16 w-auto max-w-xs rounded-[var(--radius)] border border-border bg-white object-contain p-2" />
        ) : (
          <p className="text-sm text-text-muted">Sin logo todavía — se muestra el nombre de la marca como respaldo.</p>
        )}

        <FileSizeGuardForm action={uploadBrandLogoAction} maxMB={4} className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <input type="hidden" name="brandId" value={brand.id} />
            <input type="file" name="logo" accept="image/*" required aria-label="Subir logo de marca" className="text-sm text-text" />
            <UploadSubmitButton
              pendingLabel="Subiendo…"
              className="rounded-[var(--radius)] bg-brand px-3 py-2 text-sm font-semibold text-text-inverse transition-colors hover:bg-brand-hover disabled:cursor-wait disabled:opacity-70"
            >
              {brand.logo_url ? "Reemplazar logo" : "Subir logo"}
            </UploadSubmitButton>
          </div>
          <p className="text-xs text-text-muted">Máximo 4 MB.</p>
        </FileSizeGuardForm>

        {brand.logo_url ? (
          <form action={deleteBrandLogoAction} className="w-fit">
            <input type="hidden" name="brandId" value={brand.id} />
            <button type="submit" className="text-sm font-medium text-danger hover:underline">
              Eliminar logo
            </button>
          </form>
        ) : null}
      </section>

      <form action={updateBrandAction} className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5">
        <input type="hidden" name="brandId" value={brand.id} />
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
            defaultValue={brand.name}
            className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2 text-sm focus:border-brand focus:outline-none"
          />
        </div>

        <label className="flex items-start gap-2 text-sm text-text">
          <input type="checkbox" name="isActive" value="1" defaultChecked={brand.is_active} className="mt-0.5" />
          <span>
            <span className="font-medium">Activa</span>
            <span className="block text-xs text-text-muted">Aparece en la franja "Distribuidor autorizado de" de la home. Desmárcala para ocultarla.</span>
          </span>
        </label>

        <button
          type="submit"
          className="self-start rounded-[var(--radius)] bg-brand px-4 py-2.5 text-sm font-semibold text-text-inverse transition-colors hover:bg-brand-hover"
        >
          Guardar cambios
        </button>
      </form>

      <section className="flex flex-col gap-3 rounded-xl border border-danger/40 bg-danger/5 p-5">
        <h2 className="flex items-center gap-2 font-bold text-danger">
          <Icon name="trash" size={16} />
          Zona de peligro
        </h2>
        {productCount && productCount > 0 ? (
          <p className="text-sm text-text-muted">
            No se puede eliminar: tiene {productCount} producto{productCount === 1 ? "" : "s"} asociado{productCount === 1 ? "" : "s"}. Muévelos a otra
            marca primero (edítalos desde{" "}
            <Link href="/admin/productos" className="text-brand hover:underline">
              Productos
            </Link>
            ).
          </p>
        ) : (
          <>
            <p className="text-sm text-text-muted">Elimina la marca por completo. No se puede deshacer.</p>
            <form action={deleteBrandAction} className="w-fit">
              <input type="hidden" name="brandId" value={brand.id} />
              <ConfirmSubmitButton
                confirmMessage={`¿Eliminar la marca "${brand.name}"? No se puede deshacer.`}
                className="rounded-[var(--radius)] border border-danger px-4 py-2 text-sm font-semibold text-danger transition-colors hover:bg-danger/10"
              >
                Eliminar marca
              </ConfirmSubmitButton>
            </form>
          </>
        )}
      </section>

      <Link href="/admin/categorias?seccion=marcas" className="text-sm text-brand hover:underline">
        Ver marcas
      </Link>
    </div>
  );
}
