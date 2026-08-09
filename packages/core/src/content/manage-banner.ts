import type { SupabaseClient } from "@supabase/supabase-js";

export const ALLOWED_BANNER_PLACEMENTS = ["home_hero", "catalog_top"] as const;
export type BannerPlacement = (typeof ALLOWED_BANNER_PLACEMENTS)[number];

export interface BannerInput {
  title?: string;
  imageUrl: string;
  mobileImageUrl?: string;
  linkUrl?: string;
  position: number;
  placement: BannerPlacement;
  startsAt?: string;
  endsAt?: string;
  isActive: boolean;
}

export interface CreateBannerResult {
  bannerId: string;
}

export interface UpdateBannerResult {
  bannerId: string;
}

function assertValid(input: BannerInput): void {
  if (input.imageUrl.trim().length === 0) {
    throw new Error("La imagen es obligatoria.");
  }
  if (!ALLOWED_BANNER_PLACEMENTS.includes(input.placement)) {
    throw new Error("Placement inválido.");
  }
  if (input.startsAt && input.endsAt && input.startsAt >= input.endsAt) {
    throw new Error("La fecha de inicio debe ser anterior a la de fin.");
  }
}

export async function createBanner(client: SupabaseClient, input: BannerInput): Promise<CreateBannerResult> {
  assertValid(input);

  const { data, error } = await client
    .from("banners")
    .insert({
      title: input.title || null,
      image_url: input.imageUrl,
      mobile_image_url: input.mobileImageUrl || null,
      link_url: input.linkUrl || null,
      position: input.position,
      placement: input.placement,
      starts_at: input.startsAt || null,
      ends_at: input.endsAt || null,
      is_active: input.isActive,
    })
    .select("id")
    .single();
  if (error || !data) {
    throw new Error("No se pudo crear el banner.");
  }

  return { bannerId: data["id"] as string };
}

export async function updateBanner(client: SupabaseClient, bannerId: string, input: BannerInput): Promise<UpdateBannerResult> {
  assertValid(input);

  const { data, error } = await client
    .from("banners")
    .update({
      title: input.title || null,
      image_url: input.imageUrl,
      mobile_image_url: input.mobileImageUrl || null,
      link_url: input.linkUrl || null,
      position: input.position,
      placement: input.placement,
      starts_at: input.startsAt || null,
      ends_at: input.endsAt || null,
      is_active: input.isActive,
    })
    .eq("id", bannerId)
    .select("id")
    .single();
  if (error || !data) {
    throw new Error("No se pudo actualizar el banner.");
  }

  return { bannerId: data["id"] as string };
}
