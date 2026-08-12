import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { createServerClient } from "@tecni/db";
import { serverEnv } from "@tecni/shared";

import { deleteCategoryImageAction, updateCategoryAction, uploadCategoryImageAction } from "../actions";

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

  return (
    <div className="mx-auto flex max-w-[700px] flex-col gap-6 px-4 py-16">
      <h1 className="text-2xl font-bold text-text">{category.name}</h1>

      {updated ? (
        <p className="rounded-[var(--radius)] border border-success bg-success/10 px-3 py-2 text-sm text-success">Categoría actualizada.</p>
      ) : null}
      {imageUploaded ? (
        <p className="rounded-[var(--radius)] border border-success bg-success/10 px-3 py-2 text-sm text-success">Foto actualizada.</p>
      ) : null}
      {imageDeleted ? (
        <p className="rounded-[var(--radius)] border border-success bg-success/10 px-3 py-2 text-sm text-success">Foto eliminada.</p>
      ) : null}
      {error ? (
        <p role="alert" className="rounded-[var(--radius)] border border-danger bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>
      ) : null}

      <div className="flex flex-col gap-3 rounded-[var(--radius)] border border-border bg-surface p-4">
        <h2 className="text-sm font-semibold text-text">Foto de categoría</h2>
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
          <input
            type="file"
            name="image"
            accept="image/*"
            required
            aria-label="Subir foto de categoría"
            className="text-sm text-text"
          />
          <button
            type="submit"
            className="rounded-[var(--radius)] bg-brand px-3 py-2 text-sm font-semibold text-text-inverse transition-colors hover:bg-brand-hover"
          >
            {category.image_url ? "Reemplazar foto" : "Subir foto"}
          </button>
        </form>

        {category.image_url ? (
          <form action={deleteCategoryImageAction}>
            <input type="hidden" name="categoryId" value={category.id} />
            <button type="submit" className="text-sm font-medium text-danger hover:underline">
              Eliminar foto
            </button>
          </form>
        ) : null}
      </div>

      <form action={updateCategoryAction} className="flex flex-col gap-4">
        <input type="hidden" name="categoryId" value={category.id} />

        <div className="flex flex-col gap-1">
          <label htmlFor="slug" className="text-sm text-text-muted">
            Slug
          </label>
          <input id="slug" name="slug" required defaultValue={category.slug} className="rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm" />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="name" className="text-sm text-text-muted">
            Nombre
          </label>
          <input id="name" name="name" required defaultValue={category.name} className="rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm" />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="description" className="text-sm text-text-muted">
            Descripción
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            defaultValue={category.description ?? ""}
            className="rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="parentId" className="text-sm text-text-muted">
            Categoría padre
          </label>
          <select
            id="parentId"
            name="parentId"
            defaultValue={category.parent_id ?? ""}
            className="rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm"
          >
            <option value="">Sin padre</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <label className="flex items-center gap-2 text-sm text-text">
          <input type="checkbox" name="isActive" value="1" defaultChecked={category.is_active} /> Activa
        </label>

        <button
          type="submit"
          className="self-start rounded-[var(--radius)] bg-brand px-4 py-2 text-sm font-semibold text-text-inverse transition-colors hover:bg-brand-hover"
        >
          Guardar cambios
        </button>
      </form>

      <Link href="/admin/categorias" className="text-sm text-brand hover:underline">
        Ver categorías
      </Link>
    </div>
  );
}
