import type { createServerClient } from "@tecni/db";
import { createServiceRoleClient } from "@tecni/db";
import { serverEnv } from "@tecni/shared";
import { splitCartByThreshold } from "@tecni/core";

type SupabaseClient = ReturnType<typeof createServerClient>;

export interface CartSummaryItem {
  id: string;
  productId: string;
  productSlug: string | null;
  productName: string;
  brandName: string | null;
  imageUrl: string | null;
  quantity: number;
  unitPriceCop: number;
}

export interface CartSummary {
  directItems: CartSummaryItem[];
  quoteItems: CartSummaryItem[];
  thresholdCop: number;
  directSubtotalCop: number;
}

const EMPTY_SUMMARY: CartSummary = { directItems: [], quoteItems: [], thresholdCop: 5_000_000, directSubtotalCop: 0 };

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
  brand_id: string | null;
}

interface BrandRow {
  id: string;
  name: string;
}

interface ProductImageRow {
  product_id: string;
  url: string;
}

/** Resumen del carrito de la empresa del usuario autenticado, ya separado
 * en compra directa / cotización (`splitCartByThreshold`, el umbral real
 * de `settings.quote_threshold_cop`, nunca hardcodeado). Usado tanto por
 * la página completa `/carrito` como por el drawer — antes esta lógica
 * (auth → membresía → carrito → items → productos → umbral → split)
 * estaba duplicada inline en `carrito/page.tsx`. */
export async function getCartSummary(client: SupabaseClient): Promise<CartSummary> {
  const { data: userData } = await client.auth.getUser();
  if (!userData.user) return EMPTY_SUMMARY;

  const { data: membership } = await client
    .from("company_members")
    .select("company_id")
    .eq("profile_id", userData.user.id)
    .order("is_primary", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!membership) return EMPTY_SUMMARY;

  const { data: cart } = await client
    .from("carts")
    .select("id")
    .eq("company_id", membership["company_id"] as string)
    .limit(1)
    .maybeSingle();
  if (!cart) return EMPTY_SUMMARY;

  const { data: itemsData } = await client
    .from("cart_items")
    .select("id,product_id,quantity,unit_price_cop")
    .eq("cart_id", cart["id"] as string);
  const items = (itemsData as CartItemRow[] | null) ?? [];
  if (items.length === 0) return EMPTY_SUMMARY;

  const productIds = items.map((item) => item.product_id);
  const { data: productsData } = await client.from("products").select("id,slug,name,brand_id").in("id", productIds);
  const products = (productsData as ProductRow[] | null) ?? [];
  const productsById = new Map(products.map((p) => [p.id, p]));

  const brandIds = [...new Set(products.map((p) => p.brand_id).filter((id): id is string => Boolean(id)))];
  const { data: brandsData } = brandIds.length > 0 ? await client.from("brands").select("id,name").in("id", brandIds) : { data: [] };
  const brandsById = new Map(((brandsData as BrandRow[] | null) ?? []).map((b) => [b.id, b.name]));

  const { data: imagesData } =
    productIds.length > 0
      ? await client.from("product_images").select("product_id,url").in("product_id", productIds).eq("is_primary", true)
      : { data: [] as ProductImageRow[] };
  const imageByProduct = new Map(((imagesData as ProductImageRow[] | null) ?? []).map((img) => [img.product_id, img.url]));

  // `settings` no tiene ninguna política de RLS (bloqueada por completo,
  // decisión de la Fase 1) — el umbral es configuración operativa, se lee
  // con service_role, la única forma de que el valor real (editable desde
  // el panel maestro) llegue acá sin hardcodearlo.
  const serviceClient = createServiceRoleClient(serverEnv.NEXT_PUBLIC_SUPABASE_URL, serverEnv.SUPABASE_SERVICE_ROLE_KEY);
  const { data: thresholdSetting } = await serviceClient.from("settings").select("value").eq("key", "quote_threshold_cop").maybeSingle();
  const thresholdCop = typeof thresholdSetting?.["value"] === "number" ? (thresholdSetting["value"] as number) : 5_000_000;

  const splitInput = items.map((item) => ({
    id: item.id,
    productId: item.product_id,
    quantity: item.quantity,
    unitPriceCop: item.unit_price_cop ?? 0,
  }));
  const { directItems, quoteItems } = splitCartByThreshold(splitInput, thresholdCop);

  function toSummaryItem(row: (typeof splitInput)[number]): CartSummaryItem {
    const product = productsById.get(row.productId);
    return {
      id: row.id,
      productId: row.productId,
      productSlug: product?.slug ?? null,
      productName: product?.name ?? "Producto",
      brandName: product?.brand_id ? (brandsById.get(product.brand_id) ?? null) : null,
      imageUrl: imageByProduct.get(row.productId) ?? null,
      quantity: row.quantity,
      unitPriceCop: row.unitPriceCop,
    };
  }

  const direct = directItems.map(toSummaryItem);
  const directSubtotalCop = direct.reduce((sum, item) => sum + item.unitPriceCop * item.quantity, 0);

  return {
    directItems: direct,
    quoteItems: quoteItems.map(toSummaryItem),
    thresholdCop,
    directSubtotalCop,
  };
}
