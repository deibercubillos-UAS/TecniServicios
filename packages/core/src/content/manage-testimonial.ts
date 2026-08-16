import type { SupabaseClient } from "@supabase/supabase-js";

export interface TestimonialInput {
  authorName: string;
  company?: string;
  role?: string;
  quote: string;
  isActive: boolean;
  position: number;
}

export interface CreateTestimonialResult {
  testimonialId: string;
}

export interface UpdateTestimonialResult {
  testimonialId: string;
}

function assertValid(input: TestimonialInput): void {
  if (input.authorName.trim().length === 0) {
    throw new Error("El nombre del cliente es obligatorio.");
  }
  if (input.quote.trim().length === 0) {
    throw new Error("El testimonio no puede estar vacío.");
  }
}

export async function createTestimonial(client: SupabaseClient, input: TestimonialInput): Promise<CreateTestimonialResult> {
  assertValid(input);

  const { data, error } = await client
    .from("testimonials")
    .insert({
      author_name: input.authorName,
      company: input.company || null,
      role: input.role || null,
      quote: input.quote,
      is_active: input.isActive,
      position: input.position,
    })
    .select("id")
    .single();
  if (error || !data) {
    throw new Error("No se pudo crear el testimonio.");
  }

  return { testimonialId: data["id"] as string };
}

export async function updateTestimonial(client: SupabaseClient, testimonialId: string, input: TestimonialInput): Promise<UpdateTestimonialResult> {
  assertValid(input);

  const { data, error } = await client
    .from("testimonials")
    .update({
      author_name: input.authorName,
      company: input.company || null,
      role: input.role || null,
      quote: input.quote,
      is_active: input.isActive,
      position: input.position,
    })
    .eq("id", testimonialId)
    .select("id")
    .single();
  if (error || !data) {
    throw new Error("No se pudo actualizar el testimonio.");
  }

  return { testimonialId: data["id"] as string };
}

export async function deleteTestimonial(client: SupabaseClient, testimonialId: string): Promise<void> {
  const { error } = await client.from("testimonials").delete().eq("id", testimonialId);
  if (error) {
    throw new Error("No se pudo eliminar el testimonio.");
  }
}
