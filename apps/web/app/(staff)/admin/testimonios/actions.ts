"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@tecni/db";
import { serverEnv } from "@tecni/shared";
import { createTestimonial, deleteTestimonial, updateTestimonial, type TestimonialInput } from "@tecni/core";

async function getSessionClient() {
  const cookieStore = await cookies();
  const client = createServerClient(serverEnv.NEXT_PUBLIC_SUPABASE_URL, serverEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    getAll: () => cookieStore.getAll(),
    setAll: (list) => {
      for (const { name, value, options } of list) {
        cookieStore.set(name, value, options);
      }
    },
  });
  const { data: userData } = await client.auth.getUser();
  if (!userData.user) {
    redirect("/login?next=/admin/testimonios");
  }
  return client;
}

function readInput(formData: FormData): TestimonialInput {
  const company = String(formData.get("company") ?? "");
  const role = String(formData.get("role") ?? "");
  const positionRaw = String(formData.get("position") ?? "0");

  return {
    authorName: String(formData.get("authorName") ?? ""),
    quote: String(formData.get("quote") ?? ""),
    isActive: formData.get("isActive") === "1",
    position: Number.parseInt(positionRaw, 10) || 0,
    ...(company ? { company } : {}),
    ...(role ? { role } : {}),
  };
}

export async function createTestimonialAction(formData: FormData): Promise<void> {
  const client = await getSessionClient();

  try {
    await createTestimonial(client, readInput(formData));
  } catch (err) {
    const message = err instanceof Error ? err.message : "No se pudo crear el testimonio.";
    redirect("/admin/testimonios/nuevo?error=" + encodeURIComponent(message));
  }

  redirect("/admin/testimonios?created=1");
}

export async function updateTestimonialAction(formData: FormData): Promise<void> {
  const testimonialId = formData.get("testimonialId");
  if (typeof testimonialId !== "string" || testimonialId.length === 0) {
    redirect("/admin/testimonios?error=" + encodeURIComponent("Datos inválidos."));
  }

  const client = await getSessionClient();

  try {
    await updateTestimonial(client, testimonialId, readInput(formData));
  } catch (err) {
    const message = err instanceof Error ? err.message : "No se pudo actualizar el testimonio.";
    redirect(`/admin/testimonios/${encodeURIComponent(testimonialId)}?error=` + encodeURIComponent(message));
  }

  redirect(`/admin/testimonios/${encodeURIComponent(testimonialId)}?updated=1`);
}

export async function deleteTestimonialAction(formData: FormData): Promise<void> {
  const testimonialId = String(formData.get("testimonialId") ?? "");
  if (!testimonialId) {
    redirect("/admin/testimonios?error=" + encodeURIComponent("Testimonio inválido."));
  }

  const client = await getSessionClient();

  try {
    await deleteTestimonial(client, testimonialId);
  } catch (err) {
    const message = err instanceof Error ? err.message : "No se pudo eliminar el testimonio.";
    redirect(`/admin/testimonios/${encodeURIComponent(testimonialId)}?error=` + encodeURIComponent(message));
  }

  redirect("/admin/testimonios?deleted=1");
}
