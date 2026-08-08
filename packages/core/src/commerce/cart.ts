import type { SupabaseClient } from "@supabase/supabase-js";
import { resolvePrice } from "../catalog/resolve-price";

export interface CartContext {
  userId: string;
  companyId: string;
}

export interface AddCartItemInput {
  productId: string;
  quantity: number;
}

/**
 * Un carrito por empresa (docs/13-MODULE-COMMERCE.md sección 3, regla de
 * negocio 5.4 de CLAUDE.md: "una empresa, varios usuarios"). Si la empresa
 * todavía no tiene carrito, lo crea. `carts_owner` (RLS) ya garantiza que
 * `client` solo puede tocar carritos de su propia empresa — esta función no
 * repite esa validación, confía en RLS como la capa real.
 */
export async function getOrCreateCartId(client: SupabaseClient, ctx: CartContext): Promise<string> {
  const { data: existing, error: selectError } = await client
    .from("carts")
    .select("id")
    .eq("company_id", ctx.companyId)
    .limit(1)
    .maybeSingle();
  if (selectError) {
    throw new Error("No se pudo acceder al carrito.");
  }
  if (existing) {
    return existing["id"] as string;
  }

  const { data: created, error: insertError } = await client
    .from("carts")
    .insert({ profile_id: ctx.userId, company_id: ctx.companyId })
    .select("id")
    .single();
  if (insertError || !created) {
    throw new Error("No se pudo crear el carrito.");
  }
  return created["id"] as string;
}

/**
 * Agrega un producto al carrito de la empresa. El precio se **congela** en
 * `cart_items.unit_price_cop` en este momento, vía `resolvePrice()` — nunca
 * se vuelve a leer `products.price_cop` después de agregado (docs/13-MODULE-
 * COMMERCE.md sección 3). Si el producto ya está en el carrito, suma la
 * cantidad (no reemplaza) y conserva el precio ya congelado — agregar de
 * nuevo el mismo producto no debe "actualizar" un precio que cambió en
 * Siigo mientras tanto, eso rompería la promesa de precio congelado.
 */
export async function addCartItem(
  client: SupabaseClient,
  input: AddCartItemInput,
  ctx: CartContext,
): Promise<void> {
  if (input.quantity <= 0) {
    throw new Error("La cantidad debe ser mayor a cero.");
  }

  const { data: product, error: productError } = await client
    .from("products")
    .select("price_cop,price_synced_at")
    .eq("id", input.productId)
    .maybeSingle();
  if (productError || !product) {
    throw new Error("No se pudo encontrar el producto.");
  }

  const resolution = resolvePrice(
    { priceCop: product["price_cop"] as number | null, priceSyncedAt: product["price_synced_at"] as string | null },
    { userId: ctx.userId },
  );
  if (!resolution.visible) {
    throw new Error("El precio de este producto no está disponible en este momento.");
  }

  const cartId = await getOrCreateCartId(client, ctx);

  const { data: existingItem, error: existingError } = await client
    .from("cart_items")
    .select("id,quantity")
    .eq("cart_id", cartId)
    .eq("product_id", input.productId)
    .maybeSingle();
  if (existingError) {
    throw new Error("No se pudo agregar el producto al carrito.");
  }

  if (existingItem) {
    const { error: updateError } = await client
      .from("cart_items")
      .update({ quantity: (existingItem["quantity"] as number) + input.quantity })
      .eq("id", existingItem["id"] as string);
    if (updateError) {
      throw new Error("No se pudo agregar el producto al carrito.");
    }
    return;
  }

  const { error: insertError } = await client.from("cart_items").insert({
    cart_id: cartId,
    product_id: input.productId,
    quantity: input.quantity,
    unit_price_cop: resolution.priceCop,
  });
  if (insertError) {
    throw new Error("No se pudo agregar el producto al carrito.");
  }
}

/** Nunca toca `unit_price_cop` — solo la cantidad. El precio congelado se
 * mantiene aunque el usuario cambie cuánto quiere. */
export async function updateCartItemQuantity(
  client: SupabaseClient,
  cartItemId: string,
  quantity: number,
): Promise<void> {
  if (quantity <= 0) {
    throw new Error("La cantidad debe ser mayor a cero.");
  }
  const { error } = await client.from("cart_items").update({ quantity }).eq("id", cartItemId);
  if (error) {
    throw new Error("No se pudo actualizar la cantidad.");
  }
}

export async function removeCartItem(client: SupabaseClient, cartItemId: string): Promise<void> {
  const { error } = await client.from("cart_items").delete().eq("id", cartItemId);
  if (error) {
    throw new Error("No se pudo quitar el producto del carrito.");
  }
}
