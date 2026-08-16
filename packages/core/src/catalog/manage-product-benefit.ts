import type { SupabaseClient } from "@supabase/supabase-js";

export interface ProductBenefitInput {
  title: string;
  description: string;
  position: number;
}

export interface CreateProductBenefitResult {
  benefitId: string;
}

function assertValid(input: ProductBenefitInput): void {
  if (input.title.trim().length === 0) {
    throw new Error("El título del beneficio es obligatorio.");
  }
  if (input.description.trim().length === 0) {
    throw new Error("La descripción del beneficio es obligatoria.");
  }
}

export async function createProductBenefit(
  client: SupabaseClient,
  productId: string,
  input: ProductBenefitInput,
): Promise<CreateProductBenefitResult> {
  assertValid(input);

  const { data, error } = await client
    .from("product_benefits")
    .insert({ product_id: productId, title: input.title, description: input.description, position: input.position })
    .select("id")
    .single();
  if (error || !data) {
    throw new Error("No se pudo crear el beneficio.");
  }

  return { benefitId: data["id"] as string };
}

export async function updateProductBenefit(client: SupabaseClient, benefitId: string, input: ProductBenefitInput): Promise<void> {
  assertValid(input);

  const { error } = await client
    .from("product_benefits")
    .update({ title: input.title, description: input.description, position: input.position })
    .eq("id", benefitId);
  if (error) {
    throw new Error("No se pudo actualizar el beneficio.");
  }
}

export async function deleteProductBenefit(client: SupabaseClient, benefitId: string): Promise<void> {
  const { error } = await client.from("product_benefits").delete().eq("id", benefitId);
  if (error) {
    throw new Error("No se pudo eliminar el beneficio.");
  }
}
