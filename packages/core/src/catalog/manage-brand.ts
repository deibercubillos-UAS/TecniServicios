import type { SupabaseClient } from "@supabase/supabase-js";

export interface BrandInput {
  slug: string;
  name: string;
  logoUrl?: string;
  isActive: boolean;
}

export interface CreateBrandResult {
  brandId: string;
}

export interface UpdateBrandResult {
  brandId: string;
}

function assertValid(input: BrandInput): void {
  if (input.name.trim().length === 0) {
    throw new Error("El nombre es obligatorio.");
  }
  if (input.slug.trim().length === 0) {
    throw new Error("El slug es obligatorio.");
  }
}

export async function createBrand(client: SupabaseClient, input: BrandInput): Promise<CreateBrandResult> {
  assertValid(input);

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
    throw new Error("No se pudo crear la marca.");
  }

  return { brandId: data["id"] as string };
}

export async function updateBrand(client: SupabaseClient, brandId: string, input: BrandInput): Promise<UpdateBrandResult> {
  assertValid(input);

  const { data, error } = await client
    .from("brands")
    .update({
      slug: input.slug,
      name: input.name,
      logo_url: input.logoUrl || null,
      is_active: input.isActive,
    })
    .eq("id", brandId)
    .select("id")
    .single();
  if (error || !data) {
    throw new Error("No se pudo actualizar la marca.");
  }

  return { brandId: data["id"] as string };
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
