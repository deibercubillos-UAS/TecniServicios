import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { createServerClient } from "@tecni/db";
import { serverEnv } from "@tecni/shared";
import { Icon } from "@tecni/ui";

import { createCategoryAction } from "../actions";

export const metadata: Metadata = {
  title: "Nueva categoría — Panel maestro",
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

export default async function NuevaCategoriaPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const supabase = await getSupabase();

  const { data: categoriesData } = await supabase.from("categories").select("id,name").order("name");
  const categories = (categoriesData as OptionRow[] | null) ?? [];

  return (
    <div className="mx-auto flex max-w-[700px] flex-col gap-6 px-4 py-16">
      <nav aria-label="Miga de pan" className="flex items-center gap-2 text-sm text-text-muted">
        <Link href="/admin/categorias" className="hover:text-brand">
          Categorías y marcas
        </Link>
        <Icon name="chevronRight" size={14} />
        <span className="text-text">Nueva categoría</span>
      </nav>

      <div>
        <h1 className="text-2xl font-bold text-text">Nueva categoría</h1>
        <p className="text-sm text-text-muted">
          Nace inactiva — no aparece en el catálogo público hasta que la actives desde su ficha, ya con foto y todo
          listo. Al crearla pasas directo a esa ficha.
        </p>
      </div>

      {error ? (
        <p role="alert" className="flex items-center gap-2 rounded-[var(--radius)] border border-danger bg-danger/10 px-3 py-2 text-sm text-danger">
          <Icon name="close" size={16} />
          {error}
        </p>
      ) : null}

      <form action={createCategoryAction} className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5">
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
            placeholder="Ej: Alineación y Balanceo"
            className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2 text-sm focus:border-brand focus:outline-none"
          />
          <p className="text-xs text-text-muted">La URL de la categoría (slug) se genera sola a partir de este nombre.</p>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="description" className="text-sm font-medium text-text-muted">
            Descripción
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
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
            className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2 text-sm focus:border-brand focus:outline-none"
          >
            <option value="">Sin padre</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="self-start rounded-[var(--radius)] bg-brand px-4 py-2.5 text-sm font-semibold text-text-inverse transition-colors hover:bg-brand-hover"
        >
          Crear y continuar
        </button>
      </form>

      <Link href="/admin/categorias" className="text-sm text-brand hover:underline">
        Ver categorías
      </Link>
    </div>
  );
}
