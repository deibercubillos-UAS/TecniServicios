"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@tecni/db";
import { serverEnv } from "@tecni/shared";
import { createBrand, deleteBrand, updateBrand, updateBrandLogo, type BrandContentInput } from "@tecni/core";
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

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Slug automático a partir del nombre — nunca lo pide el formulario de
 * creación (mismo criterio que productos/categorías). Colisión real
 * agrega -2, -3... en orden. */
async function generateUniqueSlug(client: Awaited<ReturnType<typeof getSessionClient>>, name: string): Promise<string> {
  const base = slugify(name) || "marca";
  let candidate = base;
  let suffix = 2;
  for (;;) {
    const { data } = await client.from("brands").select("id").eq("slug", candidate).maybeSingle();
    if (!data) return candidate;
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
}

function readContentInput(formData: FormData): BrandContentInput {
  const logoUrl = String(formData.get("logoUrl") ?? "");

  return {
    name: String(formData.get("name") ?? ""),
    isActive: formData.get("isActive") === "1",
    ...(logoUrl ? { logoUrl } : {}),
  };
}

export async function createBrandAction(formData: FormData): Promise<void> {
  const content = readContentInput(formData);
  const client = await getSessionClient();

  let brandId: string;
  try {
    const slug = await generateUniqueSlug(client, content.name);
    const result = await createBrand(client, { ...content, slug });
    brandId = result.brandId;
  } catch (err) {
    const message = err instanceof Error ? err.message : "No se pudo crear la marca.";
    redirect("/admin/marcas/nueva?error=" + encodeURIComponent(message));
  }

  redirect(`/admin/marcas/${encodeURIComponent(brandId)}?created=1`);
}

export async function updateBrandAction(formData: FormData): Promise<void> {
  const brandId = formData.get("brandId");
  if (typeof brandId !== "string" || brandId.length === 0) {
    redirect("/admin/categorias?seccion=marcas&error=" + encodeURIComponent("Datos inválidos."));
  }

  const client = await getSessionClient();

  try {
    await updateBrand(client, brandId, readContentInput(formData));
  } catch (err) {
    const message = err instanceof Error ? err.message : "No se pudo actualizar la marca.";
    redirect(`/admin/marcas/${encodeURIComponent(brandId)}?error=` + encodeURIComponent(message));
  }

  redirect("/admin/categorias?seccion=marcas&updated=1");
}

export async function deleteBrandAction(formData: FormData): Promise<void> {
  const brandId = String(formData.get("brandId") ?? "");
  if (!brandId) {
    redirect("/admin/categorias?seccion=marcas&error=" + encodeURIComponent("Marca inválida."));
  }

  const client = await getSessionClient();

  try {
    const { data } = await client.from("brands").select("logo_url").eq("id", brandId).maybeSingle();
    const logoUrl = (data?.["logo_url"] as string | null | undefined) ?? null;

    await deleteBrand(client, brandId);

    if (logoUrl) {
      const config = getR2Config();
      if (logoUrl.startsWith(config.publicUrl)) {
        const key = logoUrl.slice(config.publicUrl.replace(/\/$/, "").length + 1);
        await deleteFromR2(config, key);
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "No se pudo eliminar la marca.";
    redirect(`/admin/marcas/${encodeURIComponent(brandId)}?error=` + encodeURIComponent(message));
  }

  redirect("/admin/categorias?seccion=marcas&deleted=1");
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
