"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@tecni/db";
import { serverEnv } from "@tecni/shared";
import {
  addProductDocument,
  addProductImage,
  createProduct,
  deleteProductDocument,
  deleteProductImage,
  setPrimaryProductImage,
  updateProduct,
  type ProductContentInput,
} from "@tecni/core";
import { buildProductAssetKey, deleteFromR2, uploadToR2, type R2Config } from "@tecni/integrations";

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

export async function uploadProductImagesAction(formData: FormData): Promise<void> {
  const productId = String(formData.get("productId") ?? "");
  const files = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);

  if (!productId) {
    redirect("/admin/productos?error=" + encodeURIComponent("Producto inválido."));
  }
  if (files.length === 0) {
    redirect(`/admin/productos/${encodeURIComponent(productId)}?error=` + encodeURIComponent("Selecciona al menos una imagen."));
  }

  const client = await getSessionClient();

  try {
    const config = getR2Config();
    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const key = buildProductAssetKey("images", productId, file.name);
      const uploaded = await uploadToR2(config, { key, body: buffer, contentType: file.type || "image/jpeg" });
      await addProductImage(client, { productId, url: uploaded.url });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "No se pudieron subir las imágenes.";
    redirect(`/admin/productos/${encodeURIComponent(productId)}?error=` + encodeURIComponent(message));
  }

  redirect(`/admin/productos/${encodeURIComponent(productId)}?imagesUploaded=1`);
}

export async function deleteProductImageAction(formData: FormData): Promise<void> {
  const productId = String(formData.get("productId") ?? "");
  const imageId = String(formData.get("imageId") ?? "");
  if (!productId || !imageId) {
    redirect("/admin/productos?error=" + encodeURIComponent("Datos inválidos."));
  }

  const client = await getSessionClient();

  try {
    const { url } = await deleteProductImage(client, imageId);
    const config = getR2Config();
    const key = url.startsWith(config.publicUrl) ? url.slice(config.publicUrl.replace(/\/$/, "").length + 1) : null;
    if (key) {
      await deleteFromR2(config, key);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "No se pudo eliminar la imagen.";
    redirect(`/admin/productos/${encodeURIComponent(productId)}?error=` + encodeURIComponent(message));
  }

  redirect(`/admin/productos/${encodeURIComponent(productId)}?imageDeleted=1`);
}

export async function setPrimaryProductImageAction(formData: FormData): Promise<void> {
  const productId = String(formData.get("productId") ?? "");
  const imageId = String(formData.get("imageId") ?? "");
  if (!productId || !imageId) {
    redirect("/admin/productos?error=" + encodeURIComponent("Datos inválidos."));
  }

  const client = await getSessionClient();

  try {
    await setPrimaryProductImage(client, productId, imageId);
  } catch (err) {
    const message = err instanceof Error ? err.message : "No se pudo marcar la imagen como principal.";
    redirect(`/admin/productos/${encodeURIComponent(productId)}?error=` + encodeURIComponent(message));
  }

  redirect(`/admin/productos/${encodeURIComponent(productId)}?imageUpdated=1`);
}

export async function uploadProductDocumentAction(formData: FormData): Promise<void> {
  const productId = String(formData.get("productId") ?? "");
  const title = String(formData.get("title") ?? "");
  const kind = String(formData.get("kind") ?? "ficha_tecnica");
  const isPublic = formData.get("isPublic") === "1";
  const file = formData.get("file");

  if (!productId) {
    redirect("/admin/productos?error=" + encodeURIComponent("Producto inválido."));
  }
  if (!title || !(file instanceof File) || file.size === 0) {
    redirect(`/admin/productos/${encodeURIComponent(productId)}?error=` + encodeURIComponent("Título y archivo son obligatorios."));
  }

  const client = await getSessionClient();

  try {
    const config = getR2Config();
    const buffer = Buffer.from(await (file as File).arrayBuffer());
    const key = buildProductAssetKey("documents", productId, (file as File).name);
    await uploadToR2(config, { key, body: buffer, contentType: (file as File).type || "application/pdf" });
    await addProductDocument(client, { productId, title, kind, r2Key: key, fileSize: buffer.byteLength, isPublic });
  } catch (err) {
    const message = err instanceof Error ? err.message : "No se pudo subir el documento.";
    redirect(`/admin/productos/${encodeURIComponent(productId)}?error=` + encodeURIComponent(message));
  }

  redirect(`/admin/productos/${encodeURIComponent(productId)}?documentUploaded=1`);
}

export async function deleteProductDocumentAction(formData: FormData): Promise<void> {
  const productId = String(formData.get("productId") ?? "");
  const documentId = String(formData.get("documentId") ?? "");
  if (!productId || !documentId) {
    redirect("/admin/productos?error=" + encodeURIComponent("Datos inválidos."));
  }

  const client = await getSessionClient();

  try {
    const { r2Key } = await deleteProductDocument(client, documentId);
    const config = getR2Config();
    await deleteFromR2(config, r2Key);
  } catch (err) {
    const message = err instanceof Error ? err.message : "No se pudo eliminar el documento.";
    redirect(`/admin/productos/${encodeURIComponent(productId)}?error=` + encodeURIComponent(message));
  }

  redirect(`/admin/productos/${encodeURIComponent(productId)}?documentDeleted=1`);
}
