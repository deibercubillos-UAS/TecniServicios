"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@tecni/db";
import { serverEnv } from "@tecni/shared";
import { createBrand, updateBrand, type BrandInput } from "@tecni/core";

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
    redirect("/login?next=/admin/marcas");
  }
  return client;
}

function readInput(formData: FormData): BrandInput {
  const logoUrl = String(formData.get("logoUrl") ?? "");

  return {
    slug: String(formData.get("slug") ?? ""),
    name: String(formData.get("name") ?? ""),
    isActive: formData.get("isActive") === "1",
    ...(logoUrl ? { logoUrl } : {}),
  };
}

export async function createBrandAction(formData: FormData): Promise<void> {
  const client = await getSessionClient();

  try {
    await createBrand(client, readInput(formData));
  } catch (err) {
    const message = err instanceof Error ? err.message : "No se pudo crear la marca.";
    redirect("/admin/marcas/nueva?error=" + encodeURIComponent(message));
  }

  redirect("/admin/marcas?created=1");
}

export async function updateBrandAction(formData: FormData): Promise<void> {
  const brandId = formData.get("brandId");
  if (typeof brandId !== "string" || brandId.length === 0) {
    redirect("/admin/marcas?error=" + encodeURIComponent("Datos inválidos."));
  }

  const client = await getSessionClient();

  try {
    await updateBrand(client, brandId, readInput(formData));
  } catch (err) {
    const message = err instanceof Error ? err.message : "No se pudo actualizar la marca.";
    redirect(`/admin/marcas/${encodeURIComponent(brandId)}?error=` + encodeURIComponent(message));
  }

  redirect(`/admin/marcas/${encodeURIComponent(brandId)}?updated=1`);
}
