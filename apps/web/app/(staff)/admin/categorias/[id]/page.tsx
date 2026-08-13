import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { createServerClient } from "@tecni/db";
import { serverEnv } from "@tecni/shared";
import { Icon } from "@tecni/ui";

import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { StatusBadge } from "@/components/status-badge";
import { deleteCategoryAction, deleteCategoryImageAction, updateCategoryAction, uploadCategoryImageAction } from "../actions";

export const metadata: Metadata = {
  title: "Editar categoría — Panel maestro",
};

interface OptionRow {
  id: string;
  name: string;
}

interface CategoryRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  parent_id: string | null;
  is_active: boolean;
  image_url: string | null;
}

async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(serverEnv.NEXT_PUBLIC_SUPABASE_URL, serverEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    getAll: () => cookieStore.getAll(),
    setAll: () => {},
  });
}

export default async function EditarCategoriaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; updated?: string; imageUploaded?: string; imageDeleted?: string }>;
}) {
  const { id } = await params;
  const { error, updated, imageUploaded, imageDeleted } = await searchParams;
  const supabase = await getSupabase();

  const { data: categoryData } = await supabase.from("categories").select("id,slug,name,description,parent_id,is_active,image_url").eq("id", id).maybeSingle();
  const category = categoryData as CategoryRow | null;

  if (!category) {
    return (
      <div className="mx-auto max-w-[700px] px-4 py-16">
        <h1 className="mb-4 text-2xl font-bold text-text">Categoría no encontrada</h1>
        <Link href="/admin/categorias" className="text-brand hover:underline">
          Ver categorías
        </Link>
      </div>
    );
  }

  const { data: categoriesData } = await supabase.from("categories").select("id,name").neq("id", id).order("name");
  const categories = (categoriesData as OptionRow[] | null) ?? [];

  const { count: productCount } = await supabase.from("products").select("id", { count: "exact", head: true }).eq("category_id", id);

  return (
    <div className="mx-auto flex max-w-[700px] flex-col gap-6 px-4 py-16">
      <nav aria-label="Miga de pan" className="flex flex-wrap items-center gap-2 text-sm text-text-muted">
        <Link href="/admin/categorias" className="hover:text-brand">
          Categorías y marcas
        </Link>
        <Icon name="chevronRight" size={14} />
        <span className="truncate text-text">{category.name}</span>
      </nav>

      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-text">{category.name}</h1>
          <p className="text-sm text-text-muted">
            slug {category.slug} · {productCount ?? 0} producto{productCount === 1 ? "" : "s"} asociado{productCount === 1 ? "" : "s"}
          </p>
        </div>
        {category.is_active ? (
          <StatusBadge label="Activa" tone="success" icon="checkCircle" />
        ) : (
          <StatusBadge label="Inactiva" tone="muted" icon="close" />
        )}
      </div>

      {updated ? (
        <p className="flex items-center gap-2 rounded-[var(--radius)] border border-success bg-success/10 px-3 py-2 text-sm text-success">
          <Icon name="checkCircle" size={16} />
          Categoría actualizada.
        </p>
      ) : null}
      {imageUploaded ? (
        <p className="flex items-center gap-2 rounded-[var(--radius)] border border-success bg-success/10 px-3 py-2 text-sm text-success">
          <Icon name="checkCircle" size={16} />
          Foto actualizada.
        </p>
      ) : null}
      {imageDeleted ? (
        <p className="flex items-center gap-2 rounded-[var(--radius)] border border-success bg-success/10 px-3 py-2 text-sm text-success">
          <Icon name="checkCircle" size={16} />
          Foto eliminada.
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
          Foto de categoría
        </h2>
        <p className="text-sm text-text-muted">
          Foto real horizontal (16:9 o similar) para la card destacada de categoría en home y catálogo. Se muestra con
          un degradado oscuro y el nombre superpuesto — evita fotos con texto propio.
        </p>

        {category.image_url ? (
          <img src={category.image_url} alt="" className="h-40 w-full max-w-md rounded-[var(--radius)] object-cover" />
        ) : (
          <p className="text-sm text-text-muted">Sin foto todavía — se usa el ícono de categoría como respaldo.</p>
        )}

        <form action={uploadCategoryImageAction} className="flex flex-wrap items-center gap-3">
          <input type="hidden" name="categoryId" value={category.id} />
          <input type="file" name="image" accept="image/*" required aria-label="Subir foto de categoría" className="text-sm text-text" />
          <button
            type="submit"
            className="rounded-[var(--radius)] bg-brand px-3 py-2 text-sm font-semibold text-text-inverse transition-colors hover:bg-brand-hover"
          >
            {category.image_url ? "Reemplazar foto" : "Subir foto"}
          </button>
        </form>

        {category.image_url ? (
          <form action={deleteCategoryImageAction} className="w-fit">
            <input type="hidden" name="categoryId" value={category.id} />
            <button type="submit" className="text-sm font-medium text-danger hover:underline">
              Eliminar foto
            </button>
          </form>
        ) : null}
      </section>

      <form action={updateCategoryAction} className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5">
        <input type="hidden" name="categoryId" value={category.id} />
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
            defaultValue={category.name}
            className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2 text-sm focus:border-brand focus:outline-none"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="slug" className="text-sm font-medium text-text-muted">
            Slug (URL)
          </label>
          <input
            id="slug"
            name="slug"
            required
            defaultValue={category.slug}
            className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2 text-sm focus:border-brand focus:outline-none"
          />
          <p className="text-xs text-text-muted">Cambiarlo rompe enlaces ya indexados al catálogo por categoría — edítalo solo si es necesario.</p>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="description" className="text-sm font-medium text-text-muted">
            Descripción
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            defaultValue={category.description ?? ""}
            className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2 text-sm focus:border-brand focus:outline-none"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="parentId" className="text-sm font-medium text-text-muted">
            Categoría padre
          </label>
          <select
            id="parentId"
            name="parentId"
            defaultValue={category.parent_id ?? ""}
            className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2 text-sm focus:border-brand focus:outline-none"
          >
            <option value="">Sin padre</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <label className="flex items-start gap-2 text-sm text-text">
          <input type="checkbox" name="isActive" value="1" defaultChecked={category.is_active} className="mt-0.5" />
          <span>
            <span className="font-medium">Activa</span>
            <span className="block text-xs text-text-muted">Visible en el catálogo público y en los filtros. Desmárcala para ocultarla sin eliminarla.</span>
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
            categoría primero (edítalos desde <Link href="/admin/productos" className="text-brand hover:underline">Productos</Link>).
          </p>
        ) : (
          <>
            <p className="text-sm text-text-muted">Elimina la categoría por completo. No se puede deshacer.</p>
            <form action={deleteCategoryAction} className="w-fit">
              <input type="hidden" name="categoryId" value={category.id} />
              <ConfirmSubmitButton
                confirmMessage={`¿Eliminar la categoría "${category.name}"? No se puede deshacer.`}
                className="rounded-[var(--radius)] border border-danger px-4 py-2 text-sm font-semibold text-danger transition-colors hover:bg-danger/10"
              >
                Eliminar categoría
              </ConfirmSubmitButton>
            </form>
          </>
        )}
      </section>

      <Link href="/admin/categorias" className="text-sm text-brand hover:underline">
        Ver categorías
      </Link>
    </div>
  );
}
