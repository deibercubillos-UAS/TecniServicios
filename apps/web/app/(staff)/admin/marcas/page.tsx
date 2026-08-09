import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { createServerClient } from "@tecni/db";
import { serverEnv } from "@tecni/shared";

export const metadata: Metadata = {
  title: "Marcas — Panel maestro",
};

interface BrandRow {
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

export default async function AdminMarcasPage({ searchParams }: { searchParams: Promise<{ created?: string }> }) {
  const { created } = await searchParams;
  const supabase = await getSupabase();

  const { data: brandsData } = await supabase.from("brands").select("id,name,slug,is_active").order("name");
  const brands = (brandsData as BrandRow[] | null) ?? [];

  return (
    <div className="mx-auto flex max-w-[700px] flex-col gap-6 px-4 py-16">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold text-text">Marcas</h1>
        <Link
          href="/admin/marcas/nueva"
          className="rounded-[var(--radius)] bg-brand px-4 py-2 text-sm font-semibold text-text-inverse transition-colors hover:bg-brand-hover"
        >
          Nueva marca
        </Link>
      </div>

      {created ? (
        <p className="rounded-[var(--radius)] border border-success bg-success/10 px-3 py-2 text-sm text-success">Marca creada.</p>
      ) : null}

      {brands.length === 0 ? (
        <p className="text-text-muted">Sin marcas.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-border rounded-lg border border-border">
          {brands.map((brand) => (
            <li key={brand.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
              <div>
                <Link href={`/admin/marcas/${brand.id}`} className="font-medium text-text hover:text-brand">
                  {brand.name}
                </Link>
                <p className="text-xs text-text-muted">{brand.slug}</p>
              </div>
              {!brand.is_active ? (
                <span className="rounded-full border border-border px-3 py-1 text-xs font-medium text-text-muted">Inactiva</span>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
