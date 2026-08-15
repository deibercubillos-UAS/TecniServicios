import type { SupabaseClient } from "@supabase/supabase-js";

export interface BrandContentInput {
  name: string;
  logoUrl?: string;
  isActive: boolean;
}

export interface BrandInput extends BrandContentInput {
  slug: string;
}

export interface CreateBrandResult {
  brandId: string;
}

export interface UpdateBrandResult {
  brandId: string;
}

function assertValidContent(input: BrandContentInput): void {
  if (input.name.trim().length === 0) {
    throw new Error("El nombre es obligatorio.");
  }
}

/** Nunca se filtra el error crudo de Postgres al cliente (mismo criterio
 * que `describeProductWriteError`/`describeCategoryWriteError`) — se
 * registra en el servidor con una referencia corta. */
function describeBrandWriteError(error: { code?: string; message?: string } | null, action: "crear" | "actualizar"): string {
  const reference = Date.now().toString(36).slice(-6).toUpperCase();
  console.error(`[manage-brand] No se pudo ${action} la marca (ref ${reference}):`, error);

  if (error?.code === "23505") {
    return `Ya existe otra marca con ese slug. (ref ${reference})`;
  }

  return `No se pudo ${action} la marca. (ref ${reference})`;
}

export async function createBrand(client: SupabaseClient, input: BrandInput): Promise<CreateBrandResult> {
  assertValidContent(input);
  if (input.slug.trim().length === 0) {
    throw new Error("El slug es obligatorio.");
  }

  const { data, error } = await client
    .from("brands")
    .insert({
      slug: input.slug,
      name: input.name,
      logo_url: input.logoUrl || null,
      is_active: input.isActive,
    })
    .select("id")
    .single();
  if (error || !data) {
    throw new Error(describeBrandWriteError(error, "crear"));
  }

  return { brandId: data["id"] as string };
}

/** `slug` no se edita acá — mismo criterio que productos/categorías:
 * cambiarlo rompería enlaces ya indexados. */
export async function updateBrand(client: SupabaseClient, brandId: string, input: BrandContentInput): Promise<UpdateBrandResult> {
  assertValidContent(input);

  const patch: { name: string; is_active: boolean; logo_url?: string | null } = {
    name: input.name,
    is_active: input.isActive,
  };
  if (input.logoUrl !== undefined) {
    patch.logo_url = input.logoUrl || null;
  }

  const { data, error } = await client
    .from("brands")
    .update(patch)
    .eq("id", brandId)
    .select("id")
    .single();
  if (error || !data) {
    throw new Error(describeBrandWriteError(error, "actualizar"));
  }

  return { brandId: data["id"] as string };
}

/**
 * `brands` no tiene `deleted_at` (mismo criterio que `categories` —
 * no es un registro de negocio con historial que proteger). El `DELETE`
 * es real, pero la base lo bloquea sola si hay productos que la
 * referencian (`products_brand_id_fkey`, sin `ON DELETE CASCADE`).
 */
export async function deleteBrand(client: SupabaseClient, brandId: string): Promise<void> {
  const { error } = await client.from("brands").delete().eq("id", brandId);
  if (error) {
    if (error.code === "23503") {
      throw new Error("No se puede eliminar: todavía tiene productos asociados. Muévelos a otra marca primero.");
    }
    throw new Error("No se pudo eliminar la marca.");
  }
}

/** Logo de marca subido a R2 — separado de `updateBrand` porque el flujo
 * de subida es su propia acción (mismo criterio que la foto de
 * categoría en `updateCategoryImage`). */
export async function updateBrandLogo(client: SupabaseClient, brandId: string, logoUrl: string | null): Promise<UpdateBrandResult> {
  const { data, error } = await client
    .from("brands")
    .update({ logo_url: logoUrl })
    .eq("id", brandId)
    .select("id")
    .single();
  if (error || !data) {
    throw new Error("No se pudo actualizar el logo de la marca.");
  }

  return { brandId: data["id"] as string };
}
