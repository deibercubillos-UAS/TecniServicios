import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@tecni/db";
import { formatCop, serverEnv } from "@tecni/shared";

import { checkoutDirectItemsAction, removeCartItemAction, requestQuoteFromCartAction, updateCartItemQuantityAction } from "./actions";
import { getCartSummary, type CartSummaryItem } from "./get-cart-summary";

export const metadata: Metadata = {
  title: "Carrito",
};

async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(serverEnv.NEXT_PUBLIC_SUPABASE_URL, serverEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    getAll: () => cookieStore.getAll(),
    setAll: () => {},
  });
}

export default async function CarritoPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; added?: string }>;
}) {
  const { error, added } = await searchParams;
  const supabase = await getSupabase();

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    redirect("/login?next=/carrito");
  }

  const { data: membership } = await supabase
    .from("company_members")
    .select("company_id")
    .eq("profile_id", userData.user.id)
    .order("is_primary", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!membership) {
    return (
      <div className="mx-auto max-w-[800px] px-4 py-16">
        <h1 className="mb-4 text-2xl font-bold text-text">Carrito</h1>
        <p className="text-text-muted">Tu cuenta todavía no está asociada a una empresa.</p>
      </div>
    );
  }

  const { directItems, quoteItems, thresholdCop } = await getCartSummary(supabase);
  const items = [...directItems, ...quoteItems];

  function renderSection(title: string, rows: CartSummaryItem[]) {
    if (rows.length === 0) return null;
    const total = rows.reduce((sum, row) => sum + row.unitPriceCop * row.quantity, 0);
    return (
      <section className="rounded-lg border border-border">
        <h2 className="border-b border-border bg-bg-alt px-4 py-3 font-semibold text-text">{title}</h2>
        <ul className="divide-y divide-border">
          {rows.map((row) => {
            return (
              <li key={row.id} className="flex flex-wrap items-center justify-between gap-4 px-4 py-3">
                <div>
                  <Link href={row.productSlug ? `/catalogo/${row.productSlug}` : "#"} className="font-medium text-text hover:text-brand">
                    {row.productName}
                  </Link>
                  <p className="text-sm text-text-muted">{formatCop(row.unitPriceCop)} c/u</p>
                </div>
                <div className="flex items-center gap-3">
                  <form action={updateCartItemQuantityAction} className="flex items-center gap-2">
                    <input type="hidden" name="cartItemId" value={row.id} />
                    <input
                      type="number"
                      name="quantity"
                      defaultValue={row.quantity}
                      min={1}
                      className="w-16 rounded-[var(--radius)] border border-border bg-surface px-2 py-1 text-sm"
                    />
                    <button type="submit" className="text-sm text-brand hover:underline">
                      Actualizar
                    </button>
                  </form>
                  <form action={removeCartItemAction}>
                    <input type="hidden" name="cartItemId" value={row.id} />
                    <button type="submit" className="text-sm text-danger hover:underline">
                      Quitar
                    </button>
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
        <p className="border-t border-border px-4 py-3 text-right font-semibold text-text">Subtotal: {formatCop(total)}</p>
      </section>
    );
  }

  return (
    <div className="mx-auto flex max-w-[800px] flex-col gap-6 px-4 py-16">
      <h1 className="text-2xl font-bold text-text">Carrito</h1>

      {added ? (
        <p className="rounded-[var(--radius)] border border-success bg-success/10 px-3 py-2 text-sm text-success">
          Producto agregado al carrito.
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="rounded-[var(--radius)] border border-danger bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>
      ) : null}

      {items.length === 0 ? (
        <p className="text-text-muted">
          Tu carrito está vacío.{" "}
          <Link href="/catalogo" className="text-brand hover:underline">
            Ver catálogo
          </Link>
        </p>
      ) : (
        <>
          {renderSection("Compra directa", directItems)}
          {directItems.length > 0 ? (
            <form action={checkoutDirectItemsAction}>
              <button
                type="submit"
                className="rounded-[var(--radius)] bg-brand px-4 py-2 text-sm font-semibold text-text-inverse transition-colors hover:bg-brand-hover"
              >
                Comprar
              </button>
            </form>
          ) : null}
          {renderSection("Requiere cotización", quoteItems)}
          {quoteItems.length > 0 ? (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-text-muted">
                Los productos de {formatCop(thresholdCop)} o más se cotizan asistidos por un vendedor — no se pagan en línea.
              </p>
              <form action={requestQuoteFromCartAction}>
                <button
                  type="submit"
                  className="rounded-[var(--radius)] bg-brand px-4 py-2 text-sm font-semibold text-text-inverse transition-colors hover:bg-brand-hover"
                >
                  Solicitar cotización
                </button>
              </form>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
