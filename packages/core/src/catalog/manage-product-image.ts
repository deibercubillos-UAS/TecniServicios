import type { SupabaseClient } from "@supabase/supabase-js";

export interface AddProductImageInput {
  productId: string;
  url: string;
  alt?: string;
  isPrimary?: boolean;
}

export interface AddProductImageResult {
  id: string;
}

/**
 * Inserta la fila después de que la imagen ya subió a R2 (docs/11-STORAGE-
 * R2.md sección 3) — nunca al revés. `product_images_write_master`
 * (05-RLS-SECURITY-A.md) ya limita esto a master, confía en RLS.
 */
export async function addProductImage(client: SupabaseClient, input: AddProductImageInput): Promise<AddProductImageResult> {
  const { count } = await client
    .from("product_images")
    .select("id", { count: "exact", head: true })
    .eq("product_id", input.productId);
  const position = count ?? 0;

  if (input.isPrimary) {
    await client.from("product_images").update({ is_primary: false }).eq("product_id", input.productId);
  }

  const { data, error } = await client
    .from("product_images")
    .insert({
      product_id: input.productId,
      url: input.url,
      alt: input.alt || null,
      position,
      is_primary: input.isPrimary ?? position === 0,
    })
    .select("id")
    .single();
  if (error || !data) {
    throw new Error("No se pudo guardar la imagen.");
  }

  return { id: data["id"] as string };
}

export async function deleteProductImage(client: SupabaseClient, imageId: string): Promise<{ url: string }> {
  const { data: image } = await client.from("product_images").select("url").eq("id", imageId).maybeSingle();
  if (!image) {
    throw new Error("Imagen no encontrada.");
  }

  const { error } = await client.from("product_images").delete().eq("id", imageId);
  if (error) {
    throw new Error("No se pudo eliminar la imagen.");
  }

  return { url: image["url"] as string };
}

export async function setPrimaryProductImage(client: SupabaseClient, productId: string, imageId: string): Promise<void> {
  await client.from("product_images").update({ is_primary: false }).eq("product_id", productId);
  const { error } = await client.from("product_images").update({ is_primary: true }).eq("id", imageId);
  if (error) {
    throw new Error("No se pudo marcar la imagen como principal.");
  }
}
