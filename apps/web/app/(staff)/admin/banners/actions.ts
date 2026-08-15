"use server";

import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@tecni/db";
import { serverEnv } from "@tecni/shared";
import { createBanner, deleteBanner, updateBanner, type BannerInput, type BannerPlacement } from "@tecni/core";
import { buildBannerAssetKey, deleteFromR2, uploadToR2, type R2Config } from "@tecni/integrations";

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

function getR2Config(): R2Config {
  const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_PUBLIC_URL } = serverEnv;
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME || !R2_PUBLIC_URL) {
    throw new Error("El almacenamiento de archivos no está configurado (variables R2_* faltantes).");
  }
  return {
    accountId: R2_ACCOUNT_ID,
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
    bucketName: R2_BUCKET_NAME,
    publicUrl: R2_PUBLIC_URL,
  };
}

function readFieldInput(formData: FormData): Omit<BannerInput, "imageUrl" | "mobileImageUrl"> {
  const title = String(formData.get("title") ?? "");
  const linkUrl = String(formData.get("linkUrl") ?? "");
  const icon = String(formData.get("icon") ?? "");
  const startsAt = String(formData.get("startsAt") ?? "");
  const endsAt = String(formData.get("endsAt") ?? "");
  const positionRaw = String(formData.get("position") ?? "0");

  return {
    position: Number.parseInt(positionRaw, 10) || 0,
    placement: (formData.get("placement") as BannerPlacement) ?? "home_hero",
    isActive: formData.get("isActive") === "1",
    ...(title ? { title } : {}),
    ...(linkUrl ? { linkUrl } : {}),
    ...(icon ? { icon } : {}),
    ...(startsAt ? { startsAt: new Date(startsAt).toISOString() } : {}),
    ...(endsAt ? { endsAt: new Date(endsAt).toISOString() } : {}),
  };
}

/** A diferencia de productos/categorías/marcas, `banners.image_url` es
 * obligatoria para todo placement salvo `announcement_bar` — no existe un
 * banner "creado sin foto" fuera de la franja de anuncio, que en cambio
 * usa un ícono (`icon`) y no sube nada a R2. La imagen se sube a R2 en el
 * mismo envío del formulario, usando un id generado acá
 * (`crypto.randomUUID()`) para construir la key antes de insertar la fila. */
export async function createBannerAction(formData: FormData): Promise<void> {
  const isAnnouncementBar = formData.get("placement") === "announcement_bar";
  const file = formData.get("image");
  const mobileFile = formData.get("mobileImage");
  if (!isAnnouncementBar && (!(file instanceof File) || file.size === 0)) {
    redirect("/admin/banners/nuevo?error=" + encodeURIComponent("Selecciona una imagen."));
  }

  const client = await getSessionClient();
  const bannerId = randomUUID();

  try {
    let imageUrl: string | undefined;
    let mobileImageUrl: string | undefined;

    if (!isAnnouncementBar) {
      const config = getR2Config();

      const buffer = Buffer.from(await (file as File).arrayBuffer());
      const key = buildBannerAssetKey("desktop", bannerId, (file as File).name);
      const uploaded = await uploadToR2(config, { key, body: buffer, contentType: (file as File).type || "image/jpeg" });
      imageUrl = uploaded.url;

      if (mobileFile instanceof File && mobileFile.size > 0) {
        const mobileBuffer = Buffer.from(await mobileFile.arrayBuffer());
        const mobileKey = buildBannerAssetKey("mobile", bannerId, mobileFile.name);
        const uploadedMobile = await uploadToR2(config, { key: mobileKey, body: mobileBuffer, contentType: mobileFile.type || "image/jpeg" });
        mobileImageUrl = uploadedMobile.url;
      }
    }

    await createBanner(client, {
      id: bannerId,
      ...(imageUrl ? { imageUrl } : {}),
      ...(mobileImageUrl ? { mobileImageUrl } : {}),
      ...readFieldInput(formData),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "No se pudo crear el banner.";
    redirect("/admin/banners/nuevo?error=" + encodeURIComponent(message));
  }

  redirect(`/admin/banners/${encodeURIComponent(bannerId)}?created=1`);
}

export async function updateBannerAction(formData: FormData): Promise<void> {
  const bannerId = formData.get("bannerId");
  if (typeof bannerId !== "string" || bannerId.length === 0) {
    redirect("/admin/banners?error=" + encodeURIComponent("Datos inválidos."));
  }

  const client = await getSessionClient();

  try {
    const { data } = await client.from("banners").select("image_url,mobile_image_url").eq("id", bannerId).maybeSingle();
    const imageUrl = (data?.["image_url"] as string | null | undefined) ?? undefined;
    const mobileImageUrl = (data?.["mobile_image_url"] as string | null | undefined) ?? undefined;

    await updateBanner(client, bannerId, {
      ...(imageUrl ? { imageUrl } : {}),
      ...(mobileImageUrl ? { mobileImageUrl } : {}),
      ...readFieldInput(formData),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "No se pudo actualizar el banner.";
    redirect(`/admin/banners/${encodeURIComponent(bannerId)}?error=` + encodeURIComponent(message));
  }

  redirect(`/admin/banners/${encodeURIComponent(bannerId)}?updated=1`);
}

export async function deleteBannerAction(formData: FormData): Promise<void> {
  const bannerId = String(formData.get("bannerId") ?? "");
  if (!bannerId) {
    redirect("/admin/banners?error=" + encodeURIComponent("Banner inválido."));
  }

  const client = await getSessionClient();

  try {
    const { data } = await client.from("banners").select("image_url,mobile_image_url").eq("id", bannerId).maybeSingle();
    const imageUrl = (data?.["image_url"] as string | null | undefined) ?? null;
    const mobileImageUrl = (data?.["mobile_image_url"] as string | null | undefined) ?? null;

    await deleteBanner(client, bannerId);

    const config = getR2Config();
    for (const url of [imageUrl, mobileImageUrl]) {
      if (url?.startsWith(config.publicUrl)) {
        const key = url.slice(config.publicUrl.replace(/\/$/, "").length + 1);
        await deleteFromR2(config, key);
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "No se pudo eliminar el banner.";
    redirect(`/admin/banners/${encodeURIComponent(bannerId)}?error=` + encodeURIComponent(message));
  }

  redirect("/admin/banners?deleted=1");
}

/** Reemplaza la imagen (escritorio o móvil) de un banner ya creado —
 * mismo patrón que `uploadCategoryImageAction`. */
export async function uploadBannerImageAction(formData: FormData): Promise<void> {
  const bannerId = String(formData.get("bannerId") ?? "");
  const kind = String(formData.get("kind") ?? "desktop") === "mobile" ? "mobile" : "desktop";
  const file = formData.get("image");
  if (!bannerId) {
    redirect("/admin/banners?error=" + encodeURIComponent("Banner inválido."));
  }
  if (!(file instanceof File) || file.size === 0) {
    redirect(`/admin/banners/${encodeURIComponent(bannerId)}?error=` + encodeURIComponent("Selecciona una imagen."));
  }

  const client = await getSessionClient();

  try {
    const config = getR2Config();
    const column = kind === "mobile" ? "mobile_image_url" : "image_url";
    const { data } = await client.from("banners").select("image_url,mobile_image_url").eq("id", bannerId).maybeSingle();
    const previousUrl = (data?.[column] as string | null | undefined) ?? null;

    const buffer = Buffer.from(await (file as File).arrayBuffer());
    const key = buildBannerAssetKey(kind, bannerId, (file as File).name);
    const uploaded = await uploadToR2(config, { key, body: buffer, contentType: (file as File).type || "image/jpeg" });

    const { error } = await client.from("banners").update({ [column]: uploaded.url }).eq("id", bannerId);
    if (error) throw new Error("No se pudo actualizar la imagen del banner.");

    if (previousUrl?.startsWith(config.publicUrl)) {
      const previousKey = previousUrl.slice(config.publicUrl.replace(/\/$/, "").length + 1);
      await deleteFromR2(config, previousKey);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "No se pudo subir la imagen.";
    redirect(`/admin/banners/${encodeURIComponent(bannerId)}?error=` + encodeURIComponent(message));
  }

  redirect(`/admin/banners/${encodeURIComponent(bannerId)}?imageUploaded=1`);
}

/** Solo aplica a la imagen móvil — la de escritorio es obligatoria
 * (`image_url` `not null`), no se puede dejar el banner sin ninguna. */
export async function deleteBannerMobileImageAction(formData: FormData): Promise<void> {
  const bannerId = String(formData.get("bannerId") ?? "");
  if (!bannerId) {
    redirect("/admin/banners?error=" + encodeURIComponent("Banner inválido."));
  }

  const client = await getSessionClient();

  try {
    const { data } = await client.from("banners").select("mobile_image_url").eq("id", bannerId).maybeSingle();
    const currentUrl = (data?.["mobile_image_url"] as string | null | undefined) ?? null;

    const { error } = await client.from("banners").update({ mobile_image_url: null }).eq("id", bannerId);
    if (error) throw new Error("No se pudo eliminar la imagen móvil.");

    if (currentUrl) {
      const config = getR2Config();
      if (currentUrl.startsWith(config.publicUrl)) {
        const key = currentUrl.slice(config.publicUrl.replace(/\/$/, "").length + 1);
        await deleteFromR2(config, key);
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "No se pudo eliminar la imagen móvil.";
    redirect(`/admin/banners/${encodeURIComponent(bannerId)}?error=` + encodeURIComponent(message));
  }

  redirect(`/admin/banners/${encodeURIComponent(bannerId)}?mobileImageDeleted=1`);
}
