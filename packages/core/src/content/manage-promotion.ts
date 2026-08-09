import type { SupabaseClient } from "@supabase/supabase-js";

export const ALLOWED_DISCOUNT_TYPES = ["percentage", "fixed_amount"] as const;
export type DiscountType = (typeof ALLOWED_DISCOUNT_TYPES)[number];

export interface PromotionInput {
  name: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  productId?: string;
  categoryId?: string;
  startsAt?: string;
  endsAt?: string;
  isActive: boolean;
}

export interface CreatePromotionResult {
  promotionId: string;
}

export interface UpdatePromotionResult {
  promotionId: string;
}

function assertValid(input: PromotionInput): void {
  if (input.name.trim().length === 0) {
    throw new Error("El nombre es obligatorio.");
  }
  if (!ALLOWED_DISCOUNT_TYPES.includes(input.discountType)) {
    throw new Error("Tipo de descuento inválido.");
  }
  if (input.discountType === "percentage" && (input.discountValue < 0 || input.discountValue > 100)) {
    throw new Error("El porcentaje de descuento debe estar entre 0 y 100.");
  }
  if (input.discountValue < 0) {
    throw new Error("El valor de descuento no puede ser negativo.");
  }
  const hasProduct = Boolean(input.productId);
  const hasCategory = Boolean(input.categoryId);
  if (hasProduct === hasCategory) {
    throw new Error("La promoción debe tener exactamente un alcance: producto o categoría.");
  }
  if (input.startsAt && input.endsAt && input.startsAt >= input.endsAt) {
    throw new Error("La fecha de inicio debe ser anterior a la de fin.");
  }
}

export async function createPromotion(client: SupabaseClient, input: PromotionInput): Promise<CreatePromotionResult> {
  assertValid(input);

  const { data, error } = await client
    .from("promotions")
    .insert({
      name: input.name,
      description: input.description || null,
      discount_type: input.discountType,
      discount_value: input.discountValue,
      product_id: input.productId || null,
      category_id: input.categoryId || null,
      starts_at: input.startsAt || null,
      ends_at: input.endsAt || null,
      is_active: input.isActive,
    })
    .select("id")
    .single();
  if (error || !data) {
    throw new Error("No se pudo crear la promoción.");
  }

  return { promotionId: data["id"] as string };
}

export async function updatePromotion(client: SupabaseClient, promotionId: string, input: PromotionInput): Promise<UpdatePromotionResult> {
  assertValid(input);

  const { data, error } = await client
    .from("promotions")
    .update({
      name: input.name,
      description: input.description || null,
      discount_type: input.discountType,
      discount_value: input.discountValue,
      product_id: input.productId || null,
      category_id: input.categoryId || null,
      starts_at: input.startsAt || null,
      ends_at: input.endsAt || null,
      is_active: input.isActive,
    })
    .eq("id", promotionId)
    .select("id")
    .single();
  if (error || !data) {
    throw new Error("No se pudo actualizar la promoción.");
  }

  return { promotionId: data["id"] as string };
}
