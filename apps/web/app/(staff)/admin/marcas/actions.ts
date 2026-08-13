"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@tecni/db";
import { serverEnv } from "@tecni/shared";
import { createBrand, updateBrand, updateBrandLogo, type BrandInput } from "@tecni/core";
import { buildBrandAssetKey, deleteFromR2, uploadToR2, type R2Config } from "@tecni/integrations";

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

  redirect("/admin/categorias?seccion=marcas&created=1");
}

export async function updateBrandAction(formData: FormData): Promise<void> {
  const brandId = formData.get("brandId");
  if (typeof brandId !== "string" || brandId.length === 0) {
    redirect("/admin/categorias?seccion=marcas&error=" + encodeURIComponent("Datos inválidos."));
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

export async function uploadBrandLogoAction(formData: FormData): Promise<void> {
  const brandId = String(formData.get("brandId") ?? "");
  const file = formData.get("logo");
  if (!brandId) {
    redirect("/admin/categorias?seccion=marcas&error=" + encodeURIComponent("Marca inválida."));
  }
  if (!(file instanceof File) || file.size === 0) {
    redirect(`/admin/marcas/${encodeURIComponent(brandId)}?error=` + encodeURIComponent("Selecciona un logo."));
  }

  const client = await getSessionClient();

  try {
    const config = getR2Config();
    const previous = await client.from("brands").select("logo_url").eq("id", brandId).maybeSingle();
    const previousUrl = (previous.data?.["logo_url"] as string | null | undefined) ?? null;

    const buffer = Buffer.from(await (file as File).arrayBuffer());
    const key = buildBrandAssetKey(brandId, (file as File).name);
    const uploaded = await uploadToR2(config, { key, body: buffer, contentType: (file as File).type || "image/png" });
    await updateBrandLogo(client, brandId, uploaded.url);

    if (previousUrl?.startsWith(config.publicUrl)) {
      const previousKey = previousUrl.slice(config.publicUrl.replace(/\/$/, "").length + 1);
      await deleteFromR2(config, previousKey);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "No se pudo subir el logo.";
    redirect(`/admin/marcas/${encodeURIComponent(brandId)}?error=` + encodeURIComponent(message));
  }

  redirect(`/admin/marcas/${encodeURIComponent(brandId)}?logoUploaded=1`);
}

export async function deleteBrandLogoAction(formData: FormData): Promise<void> {
  const brandId = String(formData.get("brandId") ?? "");
  if (!brandId) {
    redirect("/admin/categorias?seccion=marcas&error=" + encodeURIComponent("Marca inválida."));
  }

  const client = await getSessionClient();

  try {
    const { data } = await client.from("brands").select("logo_url").eq("id", brandId).maybeSingle();
    const currentUrl = (data?.["logo_url"] as string | null | undefined) ?? null;
    await updateBrandLogo(client, brandId, null);

    if (currentUrl) {
      const config = getR2Config();
      if (currentUrl.startsWith(config.publicUrl)) {
        const key = currentUrl.slice(config.publicUrl.replace(/\/$/, "").length + 1);
        await deleteFromR2(config, key);
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "No se pudo eliminar el logo.";
    redirect(`/admin/marcas/${encodeURIComponent(brandId)}?error=` + encodeURIComponent(message));
  }

  redirect(`/admin/marcas/${encodeURIComponent(brandId)}?logoDeleted=1`);
}
