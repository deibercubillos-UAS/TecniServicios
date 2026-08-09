"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@tecni/db";
import { serverEnv } from "@tecni/shared";
import { createPromotion, updatePromotion, type DiscountType, type PromotionInput } from "@tecni/core";

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
    redirect("/login?next=/admin/promociones");
  }
  return client;
}

function readInput(formData: FormData): PromotionInput {
  const description = String(formData.get("description") ?? "");
  const scope = String(formData.get("scope") ?? "product");
  const productId = String(formData.get("productId") ?? "");
  const categoryId = String(formData.get("categoryId") ?? "");
  const startsAt = String(formData.get("startsAt") ?? "");
  const endsAt = String(formData.get("endsAt") ?? "");
  const discountValueRaw = String(formData.get("discountValue") ?? "0");

  return {
    name: String(formData.get("name") ?? ""),
    discountType: (formData.get("discountType") as DiscountType) ?? "percentage",
    discountValue: Number.parseFloat(discountValueRaw) || 0,
    isActive: formData.get("isActive") === "1",
    ...(description ? { description } : {}),
    ...(scope === "product" && productId ? { productId } : {}),
    ...(scope === "category" && categoryId ? { categoryId } : {}),
    ...(startsAt ? { startsAt: new Date(startsAt).toISOString() } : {}),
    ...(endsAt ? { endsAt: new Date(endsAt).toISOString() } : {}),
  };
}

export async function createPromotionAction(formData: FormData): Promise<void> {
  const client = await getSessionClient();

  try {
    await createPromotion(client, readInput(formData));
  } catch (err) {
    const message = err instanceof Error ? err.message : "No se pudo crear la promoción.";
    redirect("/admin/promociones/nueva?error=" + encodeURIComponent(message));
  }

  redirect("/admin/promociones?created=1");
}

export async function updatePromotionAction(formData: FormData): Promise<void> {
  const promotionId = formData.get("promotionId");
  if (typeof promotionId !== "string" || promotionId.length === 0) {
    redirect("/admin/promociones?error=" + encodeURIComponent("Datos inválidos."));
  }

  const client = await getSessionClient();

  try {
    await updatePromotion(client, promotionId, readInput(formData));
  } catch (err) {
    const message = err instanceof Error ? err.message : "No se pudo actualizar la promoción.";
    redirect(`/admin/promociones/${encodeURIComponent(promotionId)}?error=` + encodeURIComponent(message));
  }

  redirect(`/admin/promociones/${encodeURIComponent(promotionId)}?updated=1`);
}
