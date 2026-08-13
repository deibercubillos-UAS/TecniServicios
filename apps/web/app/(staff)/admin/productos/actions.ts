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
  upsertProductAttributes,
  type ProductAttributeValue,
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

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Slug automático a partir del nombre — nunca lo pide el formulario.
 * Si ya existe uno igual, agrega -2, -3... en orden hasta encontrar uno
 * libre (colisión real solo si dos productos tienen el mismo nombre). */
async function generateUniqueSlug(client: Awaited<ReturnType<typeof getSessionClient>>, name: string): Promise<string> {
  const base = slugify(name) || "producto";
  let candidate = base;
  let suffix = 2;
  for (;;) {
    const { data } = await client.from("products").select("id").eq("slug", candidate).maybeSingle();
    if (!data) return candidate;
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
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
  const content = readContentInput(formData);
  const client = await getSessionClient();

  let productId: string;
  try {
    const slug = await generateUniqueSlug(client, content.name);
    const result = await createProduct(client, { ...content, sku, slug });
    productId = result.productId;
  } catch (err) {
    const message = err instanceof Error ? err.message : "No se pudo crear el producto.";
    redirect("/admin/productos/nuevo?error=" + encodeURIComponent(message));
  }

  // A la ficha completa, no a la lista — ahí es donde se suben fotos,
  // especificaciones y manual, igual que al editar (regla de negocio 5.5
  // / docs/tasks: no puede haber imagen/spec/manual antes de que exista
  // la fila del producto).
  redirect(`/admin/productos/${encodeURIComponent(productId)}?created=1`);
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

export async function publishProductAction(formData: FormData): Promise<void> {
  const productId = String(formData.get("productId") ?? "");
  if (!productId) {
    redirect("/admin/productos?error=" + encodeURIComponent("Producto inválido."));
  }

  const client = await getSessionClient();

  const { error } = await client.from("products").update({ is_active: true, updated_at: new Date().toISOString() }).eq("id", productId);
  if (error) {
    redirect("/admin/productos?error=" + encodeURIComponent("No se pudo publicar el producto."));
  }

  redirect("/admin/productos?published=1");
}

export async function updateProductAttributesAction(formData: FormData): Promise<void> {
  const productId = String(formData.get("productId") ?? "");
  if (!productId) {
    redirect("/admin/productos?error=" + encodeURIComponent("Producto inválido."));
  }

  const definitionIds = formData.getAll("definitionId").map(String);
  const dataTypes = formData.getAll("dataType").map(String);
  const values = formData.getAll("value").map(String);

  const rows: ProductAttributeValue[] = definitionIds.map((definitionId, i) => ({
    definitionId,
    dataType: (dataTypes[i] as ProductAttributeValue["dataType"]) ?? "text",
    rawValue: values[i] ?? "",
  }));

  const client = await getSessionClient();

  try {
    await upsertProductAttributes(client, productId, rows);
  } catch (err) {
    const message = err instanceof Error ? err.message : "No se pudieron guardar las especificaciones.";
    redirect(`/admin/productos/${encodeURIComponent(productId)}?error=` + encodeURIComponent(message));
  }

  redirect(`/admin/productos/${encodeURIComponent(productId)}?attributesSaved=1`);
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
  const kind = String(formData.get("kind") ?? "manual");
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
    // Manual de postventa siempre privado — la ficha técnica ya no se
    // sube como archivo, se llena campo por campo (product_attributes).
    await addProductDocument(client, { productId, title, kind, r2Key: key, fileSize: buffer.byteLength, isPublic: false });
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
