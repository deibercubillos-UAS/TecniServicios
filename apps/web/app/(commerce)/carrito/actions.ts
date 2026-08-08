"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@tecni/db";
import { serverEnv } from "@tecni/shared";
import { addCartItem, updateCartItemQuantity, removeCartItem } from "@tecni/core";

async function requireCartContext() {
  const cookieStore = await cookies();
  const client = createServerClient(
    serverEnv.NEXT_PUBLIC_SUPABASE_URL,
    serverEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      getAll: () => cookieStore.getAll(),
      setAll: (list) => {
        for (const { name, value, options } of list) {
          cookieStore.set(name, value, options);
        }
      },
    },
  );

  const { data: userData } = await client.auth.getUser();
  if (!userData.user) {
    redirect("/login?next=/carrito");
  }

  const { data: membership } = await client
    .from("company_members")
    .select("company_id")
    .eq("profile_id", userData.user.id)
    .order("is_primary", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!membership) {
    redirect("/carrito?error=" + encodeURIComponent("Tu cuenta todavía no está asociada a una empresa."));
  }

  return { client, ctx: { userId: userData.user.id, companyId: membership["company_id"] as string } };
}

export async function addToCartAction(formData: FormData): Promise<void> {
  const productId = formData.get("productId");
  const quantityRaw = formData.get("quantity");
  const quantity = typeof quantityRaw === "string" ? Number.parseInt(quantityRaw, 10) : 1;

  if (typeof productId !== "string" || productId.length === 0 || !Number.isFinite(quantity)) {
    redirect("/carrito?error=" + encodeURIComponent("Datos inválidos."));
  }

  const { client, ctx } = await requireCartContext();

  try {
    await addCartItem(client, { productId, quantity }, ctx);
  } catch (err) {
    const message = err instanceof Error ? err.message : "No se pudo agregar el producto.";
    redirect("/carrito?error=" + encodeURIComponent(message));
  }

  redirect("/carrito?added=1");
}

export async function updateCartItemQuantityAction(formData: FormData): Promise<void> {
  const cartItemId = formData.get("cartItemId");
  const quantityRaw = formData.get("quantity");
  const quantity = typeof quantityRaw === "string" ? Number.parseInt(quantityRaw, 10) : NaN;

  if (typeof cartItemId !== "string" || cartItemId.length === 0 || !Number.isFinite(quantity)) {
    redirect("/carrito?error=" + encodeURIComponent("Datos inválidos."));
  }

  const { client } = await requireCartContext();

  try {
    await updateCartItemQuantity(client, cartItemId, quantity);
  } catch (err) {
    const message = err instanceof Error ? err.message : "No se pudo actualizar la cantidad.";
    redirect("/carrito?error=" + encodeURIComponent(message));
  }

  redirect("/carrito");
}

export async function removeCartItemAction(formData: FormData): Promise<void> {
  const cartItemId = formData.get("cartItemId");
  if (typeof cartItemId !== "string" || cartItemId.length === 0) {
    redirect("/carrito?error=" + encodeURIComponent("Datos inválidos."));
  }

  const { client } = await requireCartContext();

  try {
    await removeCartItem(client, cartItemId);
  } catch (err) {
    const message = err instanceof Error ? err.message : "No se pudo quitar el producto.";
    redirect("/carrito?error=" + encodeURIComponent(message));
  }

  redirect("/carrito");
}
