"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createServerClient, createServiceRoleClient } from "@tecni/db";
import { serverEnv } from "@tecni/shared";
import {
  addCartItem,
  updateCartItemQuantity,
  removeCartItem,
  requestQuote,
  checkoutDirectItems,
  initiateOrderPayment,
  splitCartByThreshold,
} from "@tecni/core";
import { WompiMockClient, WOMPI_DEV_EVENTS_SECRET } from "@tecni/integrations";

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

  // Sin redirect: si esto se llama desde el drawer (cualquier página, no
  // solo /carrito), redirigir sacaría al usuario de donde está y cerraría
  // el drawer de facto. `revalidatePath` en el layout refresca el badge
  // del navbar en cualquier ruta; en la página completa /carrito el efecto
  // visible es el mismo que antes (ya estaba ahí).
  revalidatePath("/", "layout");
}

/** Solicita cotización de los ítems del carrito que están en o sobre el
 * umbral (docs/13-MODULE-COMMERCE.md sección 4). Los ítems que se cotizan
 * se quitan del carrito — ya no son "carrito", son una solicitud real. */
export async function requestQuoteFromCartAction(): Promise<void> {
  const { client, ctx } = await requireCartContext();

  const { data: cart } = await client.from("carts").select("id").eq("company_id", ctx.companyId).limit(1).maybeSingle();
  if (!cart) {
    redirect("/carrito?error=" + encodeURIComponent("Tu carrito está vacío."));
  }

  const { data: itemsData } = await client
    .from("cart_items")
    .select("id,product_id,quantity,unit_price_cop")
    .eq("cart_id", cart["id"] as string);
  const items = (itemsData as { id: string; product_id: string; quantity: number; unit_price_cop: number | null }[] | null) ?? [];

  const serviceClient = createServiceRoleClient(serverEnv.NEXT_PUBLIC_SUPABASE_URL, serverEnv.SUPABASE_SERVICE_ROLE_KEY);
  const { data: thresholdSetting } = await serviceClient
    .from("settings")
    .select("value")
    .eq("key", "quote_threshold_cop")
    .maybeSingle();
  const thresholdCop = typeof thresholdSetting?.["value"] === "number" ? (thresholdSetting["value"] as number) : 5_000_000;

  const { quoteItems } = splitCartByThreshold(
    items.map((item) => ({ id: item.id, productId: item.product_id, quantity: item.quantity, unitPriceCop: item.unit_price_cop ?? 0 })),
    thresholdCop,
  );

  if (quoteItems.length === 0) {
    redirect("/carrito?error=" + encodeURIComponent("No hay productos que requieran cotización."));
  }

  try {
    await requestQuote(
      client,
      serviceClient,
      quoteItems.map((item) => ({ productId: item.productId, quantity: item.quantity, unitPriceCop: item.unitPriceCop })),
      ctx,
    );
    await client
      .from("cart_items")
      .delete()
      .in(
        "id",
        quoteItems.map((item) => item.id),
      );
  } catch (err) {
    const message = err instanceof Error ? err.message : "No se pudo solicitar la cotización.";
    redirect("/carrito?error=" + encodeURIComponent(message));
  }

  redirect("/cotizaciones?created=1");
}

/** Compra directa de los ítems bajo el umbral (docs/13-MODULE-COMMERCE.md
 * sección 5) — crea el pedido ya, sin pasar por cotización. El pago se
 * inicia después (paso 7.2); acá el pedido queda en `pending_payment`. */
export async function checkoutDirectItemsAction(): Promise<void> {
  const { client, ctx } = await requireCartContext();

  const { data: cart } = await client.from("carts").select("id").eq("company_id", ctx.companyId).limit(1).maybeSingle();
  if (!cart) {
    redirect("/carrito?error=" + encodeURIComponent("Tu carrito está vacío."));
  }

  const { data: itemsData } = await client
    .from("cart_items")
    .select("id,product_id,quantity,unit_price_cop")
    .eq("cart_id", cart["id"] as string);
  const items = (itemsData as { id: string; product_id: string; quantity: number; unit_price_cop: number | null }[] | null) ?? [];

  const serviceClient = createServiceRoleClient(serverEnv.NEXT_PUBLIC_SUPABASE_URL, serverEnv.SUPABASE_SERVICE_ROLE_KEY);
  const { data: thresholdSetting } = await serviceClient
    .from("settings")
    .select("value")
    .eq("key", "quote_threshold_cop")
    .maybeSingle();
  const thresholdCop = typeof thresholdSetting?.["value"] === "number" ? (thresholdSetting["value"] as number) : 5_000_000;

  const { directItems } = splitCartByThreshold(
    items.map((item) => ({ id: item.id, productId: item.product_id, quantity: item.quantity, unitPriceCop: item.unit_price_cop ?? 0 })),
    thresholdCop,
  );

  if (directItems.length === 0) {
    redirect("/carrito?error=" + encodeURIComponent("No hay productos de compra directa en tu carrito."));
  }

  let reference = "";
  try {
    const { orderId } = await checkoutDirectItems(
      client,
      serviceClient,
      directItems.map((item) => ({ productId: item.productId, quantity: item.quantity, unitPriceCop: item.unitPriceCop })),
      ctx,
    );
    await client
      .from("cart_items")
      .delete()
      .in(
        "id",
        directItems.map((item) => item.id),
      );

    const { data: order } = await client.from("orders").select("order_number,total_cop").eq("id", orderId).single();
    const wompiClient = new WompiMockClient(serverEnv.WOMPI_EVENTS_SECRET ?? WOMPI_DEV_EVENTS_SECRET);
    const payment = await initiateOrderPayment(wompiClient, {
      orderNumber: order?.["order_number"] as string,
      totalCop: order?.["total_cop"] as number,
    });
    reference = payment.reference;
  } catch (err) {
    const message = err instanceof Error ? err.message : "No se pudo crear el pedido.";
    redirect("/carrito?error=" + encodeURIComponent(message));
  }

  redirect("/pedidos/confirmacion?ref=" + encodeURIComponent(reference));
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

  revalidatePath("/", "layout");
}
