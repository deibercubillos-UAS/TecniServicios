import type { SupabaseClient } from "@supabase/supabase-js";

export interface CategoryContentInput {
  name: string;
  description?: string;
  parentId?: string;
  isActive: boolean;
}

export interface CategoryInput extends CategoryContentInput {
  slug: string;
}

export interface CreateCategoryResult {
  categoryId: string;
}

export interface UpdateCategoryResult {
  categoryId: string;
}

function assertValidContent(input: CategoryContentInput): void {
  if (input.name.trim().length === 0) {
    throw new Error("El nombre es obligatorio.");
  }
}

export async function createCategory(client: SupabaseClient, input: CategoryInput): Promise<CreateCategoryResult> {
  assertValidContent(input);
  if (input.slug.trim().length === 0) {
    throw new Error("El slug es obligatorio.");
  }

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
    throw new Error(describeCategoryWriteError(error, "crear"));
  }

  return { categoryId: data["id"] as string };
}

/** Mismo criterio que `describeProductWriteError` (`manage-product.ts`):
 * nunca se filtra el error crudo de Postgres al cliente — se registra en
 * el servidor con una referencia corta y se devuelve una causa probable. */
function describeCategoryWriteError(error: { code?: string; message?: string } | null, action: "crear" | "actualizar"): string {
  const reference = Date.now().toString(36).slice(-6).toUpperCase();
  console.error(`[manage-category] No se pudo ${action} la categoría (ref ${reference}):`, error);

  if (error?.code === "23505") {
    return `Ya existe otra categoría con ese slug. (ref ${reference})`;
  }

  return `No se pudo ${action} la categoría. (ref ${reference})`;
}

/** `slug` no se edita acá — cambiarlo rompería enlaces ya indexados al
 * catálogo por categoría (mismo criterio que `sku`/`slug` de productos,
 * `manage-product.ts`). Si algún día hace falta corregirlo, es una
 * decisión aparte, no un campo más del formulario de edición. */
export async function updateCategory(client: SupabaseClient, categoryId: string, input: CategoryContentInput): Promise<UpdateCategoryResult> {
  assertValidContent(input);

  const { data, error } = await client
    .from("categories")
    .update({
      name: input.name,
      description: input.description || null,
      parent_id: input.parentId || null,
      is_active: input.isActive,
    })
    .eq("id", categoryId)
    .select("id")
    .single();
  if (error || !data) {
    throw new Error(describeCategoryWriteError(error, "actualizar"));
  }

  return { categoryId: data["id"] as string };
}

export interface DeleteCategoryResult {
  /** false cuando la categoría no se pudo borrar físicamente (solo
   * tenía productos eliminados en su historial) y se desactivó en su
   * lugar — ver comentario de `deleteCategory`. */
  hardDeleted: boolean;
}

/**
 * `categories` no tiene `deleted_at` (no es un registro de negocio con
 * historial que proteger, a diferencia de productos/pedidos —
 * `04-DATABASE-SCHEMA-A.md`). El `DELETE` es real, pero la base lo
 * bloquea si hay productos o promociones que referencian la categoría
 * (`products_category_id_fkey`/`promotions_category_id_fkey`, sin
 * `ON DELETE CASCADE`).
 *
 * `products.deleted_at` es borrado lógico (`deleteProduct`): un
 * producto "eliminado" desde el panel sigue existiendo en la tabla y
 * sigue bloqueando el `DELETE` de su categoría por la FK, aunque ya no
 * aparezca en ningún listado — eso confundía al usuario ("ya eliminé
 * los productos, la categoría dice que todavía tiene"). Si el bloqueo
 * es solo por productos ya eliminados (sin productos activos ni
 * promociones), no se puede borrar la fila sin perder ese historial,
 * así que la categoría se desactiva (`is_active = false`) — mismo
 * efecto visible para el usuario: desaparece del catálogo y del panel.
 */
export async function deleteCategory(client: SupabaseClient, categoryId: string): Promise<DeleteCategoryResult> {
  const { error } = await client.from("categories").delete().eq("id", categoryId);
  if (!error) {
    return { hardDeleted: true };
  }
  if (error.code !== "23503") {
    throw new Error("No se pudo eliminar la categoría.");
  }

  const [{ count: activeProductCount }, { count: promotionCount }] = await Promise.all([
    client.from("products").select("id", { count: "exact", head: true }).eq("category_id", categoryId).is("deleted_at", null),
    client.from("promotions").select("id", { count: "exact", head: true }).eq("category_id", categoryId),
  ]);

  if ((activeProductCount ?? 0) > 0) {
    throw new Error("No se puede eliminar: todavía tiene productos activos asociados. Muévelos a otra categoría primero.");
  }
  if ((promotionCount ?? 0) > 0) {
    throw new Error("No se puede eliminar: todavía tiene promociones asociadas. Elimínalas o muévelas primero.");
  }

  const { error: deactivateError } = await client.from("categories").update({ is_active: false }).eq("id", categoryId);
  if (deactivateError) {
    throw new Error("No se pudo eliminar la categoría.");
  }
  return { hardDeleted: false };
}

export type MoveCategoryDirection = "up" | "down";

/**
 * Intercambia `position` con el vecino adyacente en el orden actual —
 * mismo criterio simple que arrastrar una fila en una lista de dos, sin
 * necesitar drag-and-drop client-side (docs/tasks/done/DONE-reordenar-
 * categorias-navbar.md). Si `categoryId` ya está en el extremo hacia el
 * que se mueve, no hace nada (la UI ya deshabilita el botón — esto es
 * la segunda capa). `categories_write_master` (05-RLS-SECURITY-A.md)
 * ya limita esto a master, no se repite acá.
 */
export async function moveCategory(client: SupabaseClient, categoryId: string, direction: MoveCategoryDirection): Promise<void> {
  const { data, error } = await client.from("categories").select("id,position").order("position", { ascending: true }).order("id", { ascending: true });
  if (error || !data) {
    throw new Error("No se pudo leer el orden de categorías.");
  }

  const rows = data as { id: string; position: number }[];
  const index = rows.findIndex((row) => row.id === categoryId);
  if (index === -1) {
    throw new Error("Categoría no encontrada.");
  }

  const neighborIndex = direction === "up" ? index - 1 : index + 1;
  if (neighborIndex < 0 || neighborIndex >= rows.length) {
    return;
  }

  const current = rows[index]!;
  const neighbor = rows[neighborIndex]!;

  const [{ error: firstError }, { error: secondError }] = await Promise.all([
    client.from("categories").update({ position: neighbor.position }).eq("id", current.id),
    client.from("categories").update({ position: current.position }).eq("id", neighbor.id),
  ]);
  if (firstError || secondError) {
    throw new Error("No se pudo reordenar la categoría.");
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
