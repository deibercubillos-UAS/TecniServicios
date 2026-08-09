"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@tecni/db";
import { serverEnv } from "@tecni/shared";
import { createBanner, updateBanner, type BannerInput, type BannerPlacement } from "@tecni/core";

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
    redirect("/login?next=/admin/banners");
  }
  return client;
}

function readInput(formData: FormData): BannerInput {
  const title = String(formData.get("title") ?? "");
  const mobileImageUrl = String(formData.get("mobileImageUrl") ?? "");
  const linkUrl = String(formData.get("linkUrl") ?? "");
  const startsAt = String(formData.get("startsAt") ?? "");
  const endsAt = String(formData.get("endsAt") ?? "");
  const positionRaw = String(formData.get("position") ?? "0");

  return {
    imageUrl: String(formData.get("imageUrl") ?? ""),
    position: Number.parseInt(positionRaw, 10) || 0,
    placement: (formData.get("placement") as BannerPlacement) ?? "home_hero",
    isActive: formData.get("isActive") === "1",
    ...(title ? { title } : {}),
    ...(mobileImageUrl ? { mobileImageUrl } : {}),
    ...(linkUrl ? { linkUrl } : {}),
    ...(startsAt ? { startsAt: new Date(startsAt).toISOString() } : {}),
    ...(endsAt ? { endsAt: new Date(endsAt).toISOString() } : {}),
  };
}

export async function createBannerAction(formData: FormData): Promise<void> {
  const client = await getSessionClient();

  try {
    await createBanner(client, readInput(formData));
  } catch (err) {
    const message = err instanceof Error ? err.message : "No se pudo crear el banner.";
    redirect("/admin/banners/nuevo?error=" + encodeURIComponent(message));
  }

  redirect("/admin/banners?created=1");
}

export async function updateBannerAction(formData: FormData): Promise<void> {
  const bannerId = formData.get("bannerId");
  if (typeof bannerId !== "string" || bannerId.length === 0) {
    redirect("/admin/banners?error=" + encodeURIComponent("Datos inválidos."));
  }

  const client = await getSessionClient();

  try {
    await updateBanner(client, bannerId, readInput(formData));
  } catch (err) {
    const message = err instanceof Error ? err.message : "No se pudo actualizar el banner.";
    redirect(`/admin/banners/${encodeURIComponent(bannerId)}?error=` + encodeURIComponent(message));
  }

  redirect(`/admin/banners/${encodeURIComponent(bannerId)}?updated=1`);
}
