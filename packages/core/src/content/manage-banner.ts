import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * `announcement_bar` reutiliza la misma tabla y el mismo patrón de
 * vigencia/`is_active` que los demás placements — la franja de anuncio del
 * navbar lee `title`/`link_url`/`icon` de acá, nunca `image_url`. Es el
 * único placement sin imagen: en su lugar el admin elige un ícono de
 * `ALLOWED_ANNOUNCEMENT_ICONS`.
 */
export const ALLOWED_BANNER_PLACEMENTS = ["home_hero", "catalog_top", "announcement_bar", "promotions", "category_hero"] as const;
export type BannerPlacement = (typeof ALLOWED_BANNER_PLACEMENTS)[number];

/** Set fijo y reducido — la franja de anuncio es una línea angosta, no
 * hay espacio para elegir entre decenas de íconos. */
export const ALLOWED_ANNOUNCEMENT_ICONS = ["bolt", "truck", "star", "shield", "phone"] as const;
export type AnnouncementIcon = (typeof ALLOWED_ANNOUNCEMENT_ICONS)[number];

export interface BannerInput {
  title?: string;
  imageUrl?: string;
  mobileImageUrl?: string;
  linkUrl?: string;
  icon?: string;
  categoryId?: string;
  position: number;
  placement: BannerPlacement;
  startsAt?: string;
  endsAt?: string;
  isActive: boolean;
}

/** `id` opcional solo para `createBanner`: la imagen se sube a R2 antes de
 * insertar la fila (a diferencia de productos/categorías/marcas, acá
 * `image_url` es `not null` — no hay estado "creado sin foto"), así que
 * el id se genera en el server action y la key de R2 lo usa desde el
 * primer momento. */
export interface CreateBannerInput extends BannerInput {
  id?: string;
}

export interface CreateBannerResult {
  bannerId: string;
}

export interface UpdateBannerResult {
  bannerId: string;
}

function assertValid(input: BannerInput): void {
  if (!ALLOWED_BANNER_PLACEMENTS.includes(input.placement)) {
    throw new Error("Placement inválido.");
  }
  if (input.placement === "announcement_bar") {
    if (input.icon && !ALLOWED_ANNOUNCEMENT_ICONS.includes(input.icon as AnnouncementIcon)) {
      throw new Error("Ícono inválido.");
    }
  } else if (!input.imageUrl || input.imageUrl.trim().length === 0) {
    throw new Error("La imagen es obligatoria.");
  }
  if (input.placement === "category_hero" && !input.categoryId) {
    throw new Error("Elige la categoría del hero.");
  }
  if (input.startsAt && input.endsAt && input.startsAt >= input.endsAt) {
    throw new Error("La fecha de inicio debe ser anterior a la de fin.");
  }
}

/** Nunca se filtra el error crudo de Postgres al cliente (mismo criterio
 * que catálogo) — se registra en el servidor con una referencia corta. */
function describeBannerWriteError(error: { code?: string; message?: string } | null, action: "crear" | "actualizar" | "eliminar"): string {
  const reference = Date.now().toString(36).slice(-6).toUpperCase();
  console.error(`[manage-banner] No se pudo ${action} el banner (ref ${reference}):`, error);
  return `No se pudo ${action} el banner. (ref ${reference})`;
}

export async function createBanner(client: SupabaseClient, input: CreateBannerInput): Promise<CreateBannerResult> {
  assertValid(input);

  const { data, error } = await client
    .from("banners")
    .insert({
      ...(input.id ? { id: input.id } : {}),
      title: input.title || null,
      image_url: input.imageUrl || null,
      mobile_image_url: input.mobileImageUrl || null,
      link_url: input.linkUrl || null,
      icon: input.icon || null,
      category_id: input.categoryId || null,
      position: input.position,
      placement: input.placement,
      starts_at: input.startsAt || null,
      ends_at: input.endsAt || null,
      is_active: input.isActive,
    })
    .select("id")
    .single();
  if (error || !data) {
    throw new Error(describeBannerWriteError(error, "crear"));
  }

  return { bannerId: data["id"] as string };
}

export async function updateBanner(client: SupabaseClient, bannerId: string, input: BannerInput): Promise<UpdateBannerResult> {
  assertValid(input);

  const { data, error } = await client
    .from("banners")
    .update({
      title: input.title || null,
      image_url: input.imageUrl || null,
      mobile_image_url: input.mobileImageUrl || null,
      link_url: input.linkUrl || null,
      icon: input.icon || null,
      category_id: input.categoryId || null,
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
    throw new Error(describeBannerWriteError(error, "actualizar"));
  }

  return { bannerId: data["id"] as string };
}

/** `banners` no tiene `deleted_at` (contenido de marketing, no un
 * registro de negocio con historial que proteger) y nada lo referencia
 * por FK, así que el `DELETE` es real y sin restricciones. */
export async function deleteBanner(client: SupabaseClient, bannerId: string): Promise<void> {
  const { error } = await client.from("banners").delete().eq("id", bannerId);
  if (error) {
    throw new Error(describeBannerWriteError(error, "eliminar"));
  }
}
