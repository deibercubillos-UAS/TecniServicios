"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@tecni/db";
import { serverEnv } from "@tecni/shared";
import { createProduct, updateProduct, type ProductContentInput } from "@tecni/core";

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
    redirect("/login?next=/admin/productos");
  }
  return client;
}

function readContentInput(formData: FormData): ProductContentInput {
  const shortDescription = String(formData.get("shortDescription") ?? "");
  const description = String(formData.get("description") ?? "");
  const brandId = String(formData.get("brandId") ?? "");
  const warrantyMonthsRaw = formData.get("warrantyMonths");
  const warrantyMonths = typeof warrantyMonthsRaw === "string" && warrantyMonthsRaw.length > 0 ? Number.parseInt(warrantyMonthsRaw, 10) : undefined;

  return {
    name: String(formData.get("name") ?? ""),
    type: (formData.get("type") as ProductContentInput["type"]) ?? "equipment",
    categoryId: String(formData.get("categoryId") ?? ""),
    isSerialized: formData.get("isSerialized") === "1",
    isActive: formData.get("isActive") === "1",
    isFeatured: formData.get("isFeatured") === "1",
    isBestseller: formData.get("isBestseller") === "1",
    ...(shortDescription ? { shortDescription } : {}),
    ...(description ? { description } : {}),
    ...(brandId ? { brandId } : {}),
    ...(warrantyMonths !== undefined ? { warrantyMonths } : {}),
  };
}

export async function createProductAction(formData: FormData): Promise<void> {
  const sku = String(formData.get("sku") ?? "");
  const slug = String(formData.get("slug") ?? "");
  const client = await getSessionClient();

  try {
    await createProduct(client, { ...readContentInput(formData), sku, slug });
  } catch (err) {
    const message = err instanceof Error ? err.message : "No se pudo crear el producto.";
    redirect("/admin/productos/nuevo?error=" + encodeURIComponent(message));
  }

  redirect("/admin/productos?created=1");
}

export async function updateProductAction(formData: FormData): Promise<void> {
  const productId = formData.get("productId");
  if (typeof productId !== "string" || productId.length === 0) {
    redirect("/admin/productos?error=" + encodeURIComponent("Datos inválidos."));
  }

  const client = await getSessionClient();

  try {
    await updateProduct(client, productId, readContentInput(formData));
  } catch (err) {
    const message = err instanceof Error ? err.message : "No se pudo actualizar el producto.";
    redirect(`/admin/productos/${encodeURIComponent(productId)}?error=` + encodeURIComponent(message));
  }

  redirect(`/admin/productos/${encodeURIComponent(productId)}?updated=1`);
}
