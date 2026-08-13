"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@tecni/db";
import { serverEnv } from "@tecni/shared";
import { createCategory, deleteCategory, updateCategory, updateCategoryImage, type CategoryInput } from "@tecni/core";
import { buildCategoryAssetKey, deleteFromR2, uploadToR2, type R2Config } from "@tecni/integrations";

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

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Slug automático a partir del nombre — nunca lo pide el formulario de
 * creación. Si ya existe uno igual, agrega -2, -3... en orden hasta
 * encontrar uno libre (mismo criterio que `generateUniqueSlug` de
 * productos, `apps/web/app/(staff)/admin/productos/actions.ts`). */
async function generateUniqueSlug(client: Awaited<ReturnType<typeof getSessionClient>>, name: string): Promise<string> {
  const base = slugify(name) || "categoria";
  let candidate = base;
  let suffix = 2;
  for (;;) {
    const { data } = await client.from("categories").select("id").eq("slug", candidate).maybeSingle();
    if (!data) return candidate;
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
}

type CategoryContentInput = Omit<CategoryInput, "slug">;

function readContentInput(formData: FormData): CategoryContentInput {
  const description = String(formData.get("description") ?? "");
  const parentId = String(formData.get("parentId") ?? "");

  return {
    name: String(formData.get("name") ?? ""),
    isActive: formData.get("isActive") === "1",
    ...(description ? { description } : {}),
    ...(parentId ? { parentId } : {}),
  };
}

function readInput(formData: FormData): CategoryInput {
  return { ...readContentInput(formData), slug: String(formData.get("slug") ?? "") };
}

export async function createCategoryAction(formData: FormData): Promise<void> {
  const content = readContentInput(formData);
  const client = await getSessionClient();

  let categoryId: string;
  try {
    const slug = await generateUniqueSlug(client, content.name);
    const result = await createCategory(client, { ...content, slug });
    categoryId = result.categoryId;
  } catch (err) {
    const message = err instanceof Error ? err.message : "No se pudo crear la categoría.";
    redirect("/admin/categorias/nueva?error=" + encodeURIComponent(message));
  }

  redirect(`/admin/categorias/${encodeURIComponent(categoryId)}?created=1`);
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

export async function deleteCategoryAction(formData: FormData): Promise<void> {
  const categoryId = String(formData.get("categoryId") ?? "");
  if (!categoryId) {
    redirect("/admin/categorias?error=" + encodeURIComponent("Categoría inválida."));
  }

  const client = await getSessionClient();

  try {
    const { data } = await client.from("categories").select("image_url").eq("id", categoryId).maybeSingle();
    const imageUrl = (data?.["image_url"] as string | null | undefined) ?? null;

    await deleteCategory(client, categoryId);

    if (imageUrl) {
      const config = getR2Config();
      if (imageUrl.startsWith(config.publicUrl)) {
        const key = imageUrl.slice(config.publicUrl.replace(/\/$/, "").length + 1);
        await deleteFromR2(config, key);
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "No se pudo eliminar la categoría.";
    redirect(`/admin/categorias/${encodeURIComponent(categoryId)}?error=` + encodeURIComponent(message));
  }

  redirect("/admin/categorias?deleted=1");
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

export async function uploadCategoryImageAction(formData: FormData): Promise<void> {
  const categoryId = String(formData.get("categoryId") ?? "");
  const file = formData.get("image");
  if (!categoryId) {
    redirect("/admin/categorias?error=" + encodeURIComponent("Categoría inválida."));
  }
  if (!(file instanceof File) || file.size === 0) {
    redirect(`/admin/categorias/${encodeURIComponent(categoryId)}?error=` + encodeURIComponent("Selecciona una foto."));
  }

  const client = await getSessionClient();

  try {
    const config = getR2Config();
    const previous = await client.from("categories").select("image_url").eq("id", categoryId).maybeSingle();
    const previousUrl = (previous.data?.["image_url"] as string | null | undefined) ?? null;

    const buffer = Buffer.from(await (file as File).arrayBuffer());
    const key = buildCategoryAssetKey(categoryId, (file as File).name);
    const uploaded = await uploadToR2(config, { key, body: buffer, contentType: (file as File).type || "image/jpeg" });
    await updateCategoryImage(client, categoryId, uploaded.url);

    if (previousUrl?.startsWith(config.publicUrl)) {
      const previousKey = previousUrl.slice(config.publicUrl.replace(/\/$/, "").length + 1);
      await deleteFromR2(config, previousKey);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "No se pudo subir la foto.";
    redirect(`/admin/categorias/${encodeURIComponent(categoryId)}?error=` + encodeURIComponent(message));
  }

  redirect(`/admin/categorias/${encodeURIComponent(categoryId)}?imageUploaded=1`);
}

export async function deleteCategoryImageAction(formData: FormData): Promise<void> {
  const categoryId = String(formData.get("categoryId") ?? "");
  if (!categoryId) {
    redirect("/admin/categorias?error=" + encodeURIComponent("Categoría inválida."));
  }

  const client = await getSessionClient();

  try {
    const { data } = await client.from("categories").select("image_url").eq("id", categoryId).maybeSingle();
    const currentUrl = (data?.["image_url"] as string | null | undefined) ?? null;
    await updateCategoryImage(client, categoryId, null);

    if (currentUrl) {
      const config = getR2Config();
      if (currentUrl.startsWith(config.publicUrl)) {
        const key = currentUrl.slice(config.publicUrl.replace(/\/$/, "").length + 1);
        await deleteFromR2(config, key);
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "No se pudo eliminar la foto.";
    redirect(`/admin/categorias/${encodeURIComponent(categoryId)}?error=` + encodeURIComponent(message));
  }

  redirect(`/admin/categorias/${encodeURIComponent(categoryId)}?imageDeleted=1`);
}
