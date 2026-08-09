import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { createServerClient } from "@tecni/db";
import { serverEnv } from "@tecni/shared";

export const metadata: Metadata = {
  title: "Categorías — Panel maestro",
};

interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
}

async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(serverEnv.NEXT_PUBLIC_SUPABASE_URL, serverEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    getAll: () => cookieStore.getAll(),
    setAll: () => {},
  });
}

export default async function AdminCategoriasPage({ searchParams }: { searchParams: Promise<{ created?: string }> }) {
  const { created } = await searchParams;
  const supabase = await getSupabase();

  const { data: categoriesData } = await supabase.from("categories").select("id,name,slug,is_active").order("name");
  const categories = (categoriesData as CategoryRow[] | null) ?? [];

  return (
    <div className="mx-auto flex max-w-[700px] flex-col gap-6 px-4 py-16">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold text-text">Categorías</h1>
        <Link
          href="/admin/categorias/nueva"
          className="rounded-[var(--radius)] bg-brand px-4 py-2 text-sm font-semibold text-text-inverse transition-colors hover:bg-brand-hover"
        >
          Nueva categoría
        </Link>
      </div>

      {created ? (
        <p className="rounded-[var(--radius)] border border-success bg-success/10 px-3 py-2 text-sm text-success">Categoría creada.</p>
      ) : null}

      {categories.length === 0 ? (
        <p className="text-text-muted">Sin categorías.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-border rounded-lg border border-border">
          {categories.map((category) => (
            <li key={category.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
              <div>
                <Link href={`/admin/categorias/${category.id}`} className="font-medium text-text hover:text-brand">
                  {category.name}
                </Link>
                <p className="text-xs text-text-muted">{category.slug}</p>
              </div>
              {!category.is_active ? (
                <span className="rounded-full border border-border px-3 py-1 text-xs font-medium text-text-muted">Inactiva</span>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
