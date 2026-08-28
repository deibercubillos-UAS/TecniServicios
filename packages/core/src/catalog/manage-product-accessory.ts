import type { SupabaseClient } from "@supabase/supabase-js";

export interface ProductAccessoryInput {
  name: string;
  description: string | null;
  position: number;
}

export interface CreateProductAccessoryResult {
  accessoryId: string;
}

function assertValid(input: ProductAccessoryInput): void {
  if (input.name.trim().length === 0) {
    throw new Error("El nombre del accesorio es obligatorio.");
  }
}

export async function createProductAccessory(
  client: SupabaseClient,
  productId: string,
  input: ProductAccessoryInput,
): Promise<CreateProductAccessoryResult> {
  assertValid(input);

  const { data, error } = await client
    .from("product_accessories")
    .insert({ product_id: productId, name: input.name, description: input.description, position: input.position })
    .select("id")
    .single();
  if (error || !data) {
    throw new Error("No se pudo crear el accesorio.");
  }

  return { accessoryId: data["id"] as string };
}

export async function updateProductAccessory(client: SupabaseClient, accessoryId: string, input: ProductAccessoryInput): Promise<void> {
  assertValid(input);

  const { error } = await client
    .from("product_accessories")
    .update({ name: input.name, description: input.description, position: input.position })
    .eq("id", accessoryId);
  if (error) {
    throw new Error("No se pudo actualizar el accesorio.");
  }
}

export async function deleteProductAccessory(client: SupabaseClient, accessoryId: string): Promise<void> {
  const { error } = await client.from("product_accessories").delete().eq("id", accessoryId);
  if (error) {
    throw new Error("No se pudo eliminar el accesorio.");
  }
}

/** Foto opcional del accesorio — separada de `updateProductAccessory`
 * porque el flujo de subida a R2 es su propia acción (mismo criterio
 * que `updateCategoryImage`). */
export async function updateProductAccessoryImage(client: SupabaseClient, accessoryId: string, imageUrl: string | null): Promise<void> {
  const { error } = await client.from("product_accessories").update({ image_url: imageUrl }).eq("id", accessoryId);
  if (error) {
    throw new Error("No se pudo actualizar la foto del accesorio.");
  }
}
