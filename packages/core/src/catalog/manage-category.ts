import type { SupabaseClient } from "@supabase/supabase-js";

export interface CategoryInput {
  slug: string;
  name: string;
  description?: string;
  parentId?: string;
  isActive: boolean;
}

export interface CreateCategoryResult {
  categoryId: string;
}

export interface UpdateCategoryResult {
  categoryId: string;
}

function assertValid(input: CategoryInput): void {
  if (input.name.trim().length === 0) {
    throw new Error("El nombre es obligatorio.");
  }
  if (input.slug.trim().length === 0) {
    throw new Error("El slug es obligatorio.");
  }
}

export async function createCategory(client: SupabaseClient, input: CategoryInput): Promise<CreateCategoryResult> {
  assertValid(input);

  const { data, error } = await client
    .from("categories")
    .insert({
      slug: input.slug,
      name: input.name,
      description: input.description || null,
      parent_id: input.parentId || null,
      is_active: input.isActive,
    })
    .select("id")
    .single();
  if (error || !data) {
    throw new Error("No se pudo crear la categoría.");
  }

  return { categoryId: data["id"] as string };
}

export async function updateCategory(client: SupabaseClient, categoryId: string, input: CategoryInput): Promise<UpdateCategoryResult> {
  assertValid(input);

  const { data, error } = await client
    .from("categories")
    .update({
      slug: input.slug,
      name: input.name,
      description: input.description || null,
      parent_id: input.parentId || null,
      is_active: input.isActive,
    })
    .eq("id", categoryId)
    .select("id")
    .single();
  if (error || !data) {
    throw new Error("No se pudo actualizar la categoría.");
  }

  return { categoryId: data["id"] as string };
}

/**
 * `categories` no tiene `deleted_at` (no es un registro de negocio con
 * historial que proteger, a diferencia de productos/pedidos —
 * `04-DATABASE-SCHEMA-A.md`). El `DELETE` es real, pero la base lo
 * bloquea solas si hay productos o promociones que referencian la
 * categoría (`products_category_id_fkey`/`promotions_category_id_fkey`,
 * sin `ON DELETE CASCADE`) — ese error se traduce a un mensaje claro acá.
 */
export async function deleteCategory(client: SupabaseClient, categoryId: string): Promise<void> {
  const { error } = await client.from("categories").delete().eq("id", categoryId);
  if (error) {
    if (error.code === "23503") {
      throw new Error("No se puede eliminar: todavía tiene productos o promociones asociadas. Muévelos a otra categoría primero.");
    }
    throw new Error("No se pudo eliminar la categoría.");
  }
}

/** Foto hero de categoría (`CategoryHeroCard`, docs/03-UI-COMPONENTS.md
 * sección 3) — separada de `updateCategory` porque el flujo de subida a
 * R2 es su propia acción (mismo criterio que `addProductImage`). */
export async function updateCategoryImage(client: SupabaseClient, categoryId: string, imageUrl: string | null): Promise<UpdateCategoryResult> {
  const { data, error } = await client
    .from("categories")
    .update({ image_url: imageUrl })
    .eq("id", categoryId)
    .select("id")
    .single();
  if (error || !data) {
    throw new Error("No se pudo actualizar la foto de la categoría.");
  }

  return { categoryId: data["id"] as string };
}
