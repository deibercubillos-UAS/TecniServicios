import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { createServerClient } from "@tecni/db";
import { serverEnv } from "@tecni/shared";

import { updateCategoryAction } from "../actions";

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
  searchParams: Promise<{ error?: string; updated?: string }>;
}) {
  const { id } = await params;
  const { error, updated } = await searchParams;
  const supabase = await getSupabase();

  const { data: categoryData } = await supabase.from("categories").select("id,slug,name,description,parent_id,is_active").eq("id", id).maybeSingle();
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
      {error ? (
        <p role="alert" className="rounded-[var(--radius)] border border-danger bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>
      ) : null}

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
