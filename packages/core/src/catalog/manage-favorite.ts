import type { SupabaseClient } from "@supabase/supabase-js";

export interface ToggleFavoriteResult {
  favorited: boolean;
}

/**
 * `favorites_owner_all` (05-RLS-SECURITY-A.md) ya exige `profile_id =
 * auth.uid()` — esta función no repite esa validación, confía en RLS.
 */
export async function toggleFavorite(client: SupabaseClient, profileId: string, productId: string): Promise<ToggleFavoriteResult> {
  const { data: existing } = await client
    .from("favorites")
    .select("product_id")
    .eq("profile_id", profileId)
    .eq("product_id", productId)
    .maybeSingle();

  if (existing) {
    const { error } = await client.from("favorites").delete().eq("profile_id", profileId).eq("product_id", productId);
    if (error) throw new Error("No se pudo quitar de favoritos.");
    return { favorited: false };
  }

  const { error } = await client.from("favorites").insert({ profile_id: profileId, product_id: productId });
  if (error) throw new Error("No se pudo guardar en favoritos.");
  return { favorited: true };
}
