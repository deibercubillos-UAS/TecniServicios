"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@tecni/db";
import { serverEnv } from "@tecni/shared";
import { createCategory, updateCategory, type CategoryInput } from "@tecni/core";

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
    redirect("/login?next=/admin/categorias");
  }
  return client;
}

function readInput(formData: FormData): CategoryInput {
  const description = String(formData.get("description") ?? "");
  const parentId = String(formData.get("parentId") ?? "");

  return {
    slug: String(formData.get("slug") ?? ""),
    name: String(formData.get("name") ?? ""),
    isActive: formData.get("isActive") === "1",
    ...(description ? { description } : {}),
    ...(parentId ? { parentId } : {}),
  };
}

export async function createCategoryAction(formData: FormData): Promise<void> {
  const client = await getSessionClient();

  try {
    await createCategory(client, readInput(formData));
  } catch (err) {
    const message = err instanceof Error ? err.message : "No se pudo crear la categoría.";
    redirect("/admin/categorias/nueva?error=" + encodeURIComponent(message));
  }

  redirect("/admin/categorias?created=1");
}

export async function updateCategoryAction(formData: FormData): Promise<void> {
  const categoryId = formData.get("categoryId");
  if (typeof categoryId !== "string" || categoryId.length === 0) {
    redirect("/admin/categorias?error=" + encodeURIComponent("Datos inválidos."));
  }

  const client = await getSessionClient();

  try {
    await updateCategory(client, categoryId, readInput(formData));
  } catch (err) {
    const message = err instanceof Error ? err.message : "No se pudo actualizar la categoría.";
    redirect(`/admin/categorias/${encodeURIComponent(categoryId)}?error=` + encodeURIComponent(message));
  }

  redirect(`/admin/categorias/${encodeURIComponent(categoryId)}?updated=1`);
}
