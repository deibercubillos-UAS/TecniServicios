import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { createServerClient } from "@tecni/db";
import { serverEnv } from "@tecni/shared";
import { Icon } from "@tecni/ui";

import { StatusBadge } from "@/components/status-badge";
import { publishProductAction } from "./actions";

export const metadata: Metadata = {
  title: "Productos — Panel maestro",
};

interface ProductRow {
  id: string;
  sku: string;
  name: string;
  is_active: boolean;
  categories: { name: string } | null;
}

async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(serverEnv.NEXT_PUBLIC_SUPABASE_URL, serverEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    getAll: () => cookieStore.getAll(),
    setAll: () => {},
  });
}

export default async function AdminProductosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; created?: string; published?: string }>;
}) {
  const { q, created, published } = await searchParams;
  const supabase = await getSupabase();

  // El middleware ya exige master para llegar a /admin.
  // `products_read_authenticated` (05-RLS-SECURITY-A.md, Fase 2) deja ver
  // todo el catálogo con sesión, incluidos los productos inactivos.
  let query = supabase
    .from("products")
    .select("id,sku,name,is_active,categories(name)")
    .order("name", { ascending: true })
    .limit(50);
  if (q && q.trim().length > 0) {
    query = query.ilike("name", `%${q.trim()}%`);
  }
  const { data: productsData } = await query;
  const products = (productsData as unknown as ProductRow[] | null) ?? [];

  // Un producto inactivo sin fotos es "nuevo, falta completar" (borrador
  // recién creado por importación o, a futuro, por la sincronización con
  // Siigo — docs/08-INTEGRATION-SIIGO.md sección 2.1); inactivo con fotos
  // es una decisión deliberada del master de ocultarlo.
  const inactiveIds = products.filter((p) => !p.is_active).map((p) => p.id);
  const { data: imagesData } =
    inactiveIds.length > 0 ? await supabase.from("product_images").select("product_id").in("product_id", inactiveIds) : { data: [] };
  const productsWithImages = new Set(((imagesData as { product_id: string }[] | null) ?? []).map((i) => i.product_id));

  return (
    <div className="mx-auto flex max-w-[900px] flex-col gap-6 px-4 py-16">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold text-text">Productos</h1>
        <div className="flex gap-2">
          <Link
            href="/admin/productos/importar"
            className="rounded-[var(--radius)] border border-border px-4 py-2 text-sm font-semibold text-text transition-colors hover:border-brand"
          >
            Importar Excel
          </Link>
          <Link
            href="/admin/productos/nuevo"
            className="rounded-[var(--radius)] bg-brand px-4 py-2 text-sm font-semibold text-text-inverse transition-colors hover:bg-brand-hover"
          >
            Nuevo producto
          </Link>
        </div>
      </div>

      {created ? (
        <p className="rounded-[var(--radius)] border border-success bg-success/10 px-3 py-2 text-sm text-success">Producto creado.</p>
      ) : null}
      {published ? (
        <p className="rounded-[var(--radius)] border border-success bg-success/10 px-3 py-2 text-sm text-success">
          Producto publicado en el catálogo.
        </p>
      ) : null}

      <form className="flex gap-2">
        <input
          type="text"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Buscar por nombre"
          className="flex-1 rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm"
        />
        <button type="submit" className="rounded-[var(--radius)] border border-border px-4 py-2 text-sm font-medium text-text hover:border-brand">
          Buscar
        </button>
      </form>

      {products.length === 0 ? (
        <p className="text-text-muted">Sin productos.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-border rounded-lg border border-border">
          {products.map((product) => {
            const isDraft = !product.is_active && !productsWithImages.has(product.id);
            return (
              <li key={product.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                <div>
                  <Link href={`/admin/productos/${product.id}`} className="font-medium text-text hover:text-brand">
                    {product.name}
                  </Link>
                  <p className="text-xs text-text-muted">
                    {product.sku} · {product.categories?.name ?? "Sin categoría"}
                  </p>
                </div>
                {!product.is_active ? (
                  <div className="flex items-center gap-2">
                    {isDraft ? (
                      <StatusBadge label="Nuevo — falta completar" tone="warning" icon="clock" />
                    ) : (
                      <StatusBadge label="Inactivo" tone="muted" icon="close" />
                    )}
                    <form action={publishProductAction}>
                      <input type="hidden" name="productId" value={product.id} />
                      <button
                        type="submit"
                        className="flex items-center gap-1 rounded-[var(--radius)] border border-border px-3 py-1.5 text-xs font-semibold text-text hover:border-brand"
                      >
                        <Icon name="checkCircle" size={12} />
                        Publicar
                      </button>
                    </form>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
