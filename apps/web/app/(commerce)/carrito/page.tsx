import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient, createServiceRoleClient } from "@tecni/db";
import { formatCop, serverEnv } from "@tecni/shared";
import { splitCartByThreshold } from "@tecni/core";

import { checkoutDirectItemsAction, removeCartItemAction, requestQuoteFromCartAction, updateCartItemQuantityAction } from "./actions";

export const metadata: Metadata = {
  title: "Carrito — Tecni Equipos y Servicios SAS",
};

interface CartItemRow {
  id: string;
  product_id: string;
  quantity: number;
  unit_price_cop: number | null;
}

interface ProductRow {
  id: string;
  slug: string;
  name: string;
}

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

  const { data: cart } = await supabase
    .from("carts")
    .select("id")
    .eq("company_id", membership["company_id"] as string)
    .limit(1)
    .maybeSingle();

  const { data: itemsData } = cart
    ? await supabase.from("cart_items").select("id,product_id,quantity,unit_price_cop").eq("cart_id", cart["id"] as string)
    : { data: [] as CartItemRow[] };
  const items = (itemsData as CartItemRow[] | null) ?? [];

  const productIds = items.map((item) => item.product_id);
  const { data: productsData } =
    productIds.length > 0
      ? await supabase.from("products").select("id,slug,name").in("id", productIds)
      : { data: [] as ProductRow[] };
  const productsById = new Map(((productsData as ProductRow[] | null) ?? []).map((p) => [p.id, p]));

  // `settings` no tiene ninguna política de RLS (bloqueada por completo,
  // decisión de la Fase 1) — ni siquiera `authenticated` puede leerla. El
  // umbral es configuración operativa, no un dato de usuario, así que se lee
  // con service_role, la única forma de que el valor real (editable desde
  // el panel maestro) llegue a esta página sin hardcodearlo.
  const serviceClient = createServiceRoleClient(serverEnv.NEXT_PUBLIC_SUPABASE_URL, serverEnv.SUPABASE_SERVICE_ROLE_KEY);
  const { data: thresholdSetting } = await serviceClient
    .from("settings")
    .select("value")
    .eq("key", "quote_threshold_cop")
    .maybeSingle();
  const thresholdCop = typeof thresholdSetting?.["value"] === "number" ? (thresholdSetting["value"] as number) : 5_000_000;

  const splitInput = items.map((item) => ({
    id: item.id,
    productId: item.product_id,
    quantity: item.quantity,
    unitPriceCop: item.unit_price_cop ?? 0,
  }));
  const { directItems, quoteItems } = splitCartByThreshold(splitInput, thresholdCop);

  function renderSection(title: string, rows: typeof splitInput) {
    if (rows.length === 0) return null;
    const total = rows.reduce((sum, row) => sum + row.unitPriceCop * row.quantity, 0);
    return (
      <section className="rounded-lg border border-border">
        <h2 className="border-b border-border bg-bg-alt px-4 py-3 font-semibold text-text">{title}</h2>
        <ul className="divide-y divide-border">
          {rows.map((row) => {
            const product = productsById.get(row.productId);
            return (
              <li key={row.id} className="flex flex-wrap items-center justify-between gap-4 px-4 py-3">
                <div>
                  <Link href={product ? `/catalogo/${product.slug}` : "#"} className="font-medium text-text hover:text-brand">
                    {product?.name ?? "Producto"}
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
        <p className="rounded-[var(--radius)] border border-danger bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>
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
