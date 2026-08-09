import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { createServerClient } from "@tecni/db";
import { serverEnv } from "@tecni/shared";

export const metadata: Metadata = {
  title: "Promociones — Panel maestro",
};

interface PromotionRow {
  id: string;
  name: string;
  discount_type: string;
  discount_value: number;
  product_id: string | null;
  category_id: string | null;
  is_active: boolean;
}

async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(serverEnv.NEXT_PUBLIC_SUPABASE_URL, serverEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    getAll: () => cookieStore.getAll(),
    setAll: () => {},
  });
}

function formatDiscount(type: string, value: number): string {
  return type === "percentage" ? `${value}%` : `$${value.toLocaleString("es-CO")} COP`;
}

export default async function AdminPromocionesPage({ searchParams }: { searchParams: Promise<{ created?: string }> }) {
  const { created } = await searchParams;
  const supabase = await getSupabase();

  const { data: promosData } = await supabase
    .from("promotions")
    .select("id,name,discount_type,discount_value,product_id,category_id,is_active")
    .order("name");
  const promotions = (promosData as PromotionRow[] | null) ?? [];

  return (
    <div className="mx-auto flex max-w-[700px] flex-col gap-6 px-4 py-16">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold text-text">Promociones</h1>
        <Link
          href="/admin/promociones/nueva"
          className="rounded-[var(--radius)] bg-brand px-4 py-2 text-sm font-semibold text-text-inverse transition-colors hover:bg-brand-hover"
        >
          Nueva promoción
        </Link>
      </div>

      {created ? (
        <p className="rounded-[var(--radius)] border border-success bg-success/10 px-3 py-2 text-sm text-success">Promoción creada.</p>
      ) : null}

      {promotions.length === 0 ? (
        <p className="text-text-muted">Sin promociones.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-border rounded-lg border border-border">
          {promotions.map((promo) => (
            <li key={promo.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
              <div>
                <Link href={`/admin/promociones/${promo.id}`} className="font-medium text-text hover:text-brand">
                  {promo.name}
                </Link>
                <p className="text-xs text-text-muted">
                  {formatDiscount(promo.discount_type, promo.discount_value)} · {promo.product_id ? "producto" : "categoría"}
                </p>
              </div>
              {!promo.is_active ? (
                <span className="rounded-full border border-border px-3 py-1 text-xs font-medium text-text-muted">Inactiva</span>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
