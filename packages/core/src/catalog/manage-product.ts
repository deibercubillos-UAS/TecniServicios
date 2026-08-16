import type { SupabaseClient } from "@supabase/supabase-js";

export interface ProductContentInput {
  name: string;
  shortDescription?: string;
  description?: string;
  type: "equipment" | "part" | "supply";
  categoryId: string;
  brandId?: string;
  isSerialized: boolean;
  warrantyMonths?: number;
  isActive: boolean;
  isFeatured: boolean;
  isBestseller: boolean;
}

export interface CreateProductInput extends ProductContentInput {
  sku: string;
  slug: string;
}

export interface CreateProductResult {
  productId: string;
}

export interface UpdateProductResult {
  productId: string;
}

/**
 * `master` crea contenido de producto (`CLAUDE.md` regla de negocio
 * 5.3: "el master crea y edita los productos... la web es dueña del
 * contenido") — **nunca** precio ni stock, esos vienen de Siigo y se
 * quedan con sus valores por defecto del esquema. `products_write_master`
 * (05-RLS-SECURITY-A.md, ya aplicada desde la Fase 2) es quien realmente
 * exige `master`, esta función no repite esa validación.
 */
export async function createProduct(client: SupabaseClient, input: CreateProductInput): Promise<CreateProductResult> {
  if (input.name.trim().length === 0) {
    throw new Error("El nombre es obligatorio.");
  }
  if (input.sku.trim().length === 0) {
    throw new Error("El SKU es obligatorio.");
  }
  if (input.slug.trim().length === 0) {
    throw new Error("El slug es obligatorio.");
  }

  const { data, error } = await client
    .from("products")
    .insert({
      sku: input.sku,
      slug: input.slug,
      name: input.name,
      short_description: input.shortDescription || null,
      description: input.description || null,
      type: input.type,
      category_id: input.categoryId,
      brand_id: input.brandId || null,
      is_serialized: input.isSerialized,
      warranty_months: input.warrantyMonths ?? null,
      is_active: input.isActive,
      is_featured: input.isFeatured,
      is_bestseller: input.isBestseller,
    })
    .select("id")
    .single();
  if (error || !data) {
    throw new Error(describeProductWriteError(error, "crear"));
  }

  return { productId: data["id"] as string };
}

/**
 * Traduce el error crudo de Postgres a un mensaje útil para el master sin
 * filtrar detalle de base de datos (regla de errores, `CLAUDE.md` sección 7):
 * se registra el error completo en el servidor con una referencia corta y
 * al usuario solo le llega la causa probable + esa referencia para soporte.
 */
function describeProductWriteError(error: { code?: string; message?: string } | null, action: "crear" | "actualizar" | "eliminar"): string {
  const reference = Date.now().toString(36).slice(-6).toUpperCase();
  console.error(`[manage-product] No se pudo ${action} el producto (ref ${reference}):`, error);

  if (error?.code === "23505") {
    if (error.message?.includes("products_sku_key")) {
      return `Ya existe otro producto con ese SKU. Usa un SKU distinto. (ref ${reference})`;
    }
    if (error.message?.includes("products_slug_key")) {
      return `Ya existe otro producto con esa URL (slug). Cambia el nombre. (ref ${reference})`;
    }
    return `Ese dato ya está en uso por otro producto. (ref ${reference})`;
  }
  if (error?.code === "23503") {
    return `La categoría o marca seleccionada no existe. (ref ${reference})`;
  }

  return `No se pudo ${action} el producto. (ref ${reference})`;
}

/**
 * Edita el contenido de un producto ya existente. **`sku`/`slug` no se
 * editan acá** — `sku` es la clave de sincronización con Siigo
 * (`04-DATABASE-SCHEMA-A.md`), cambiarla rompería el vínculo; `slug`
 * cambiarlo rompería cualquier enlace externo ya indexado. Si alguna vez
 * hace falta corregir uno de los dos, es una decisión aparte, no un
 * campo más del formulario de edición de contenido.
 */
export async function updateProduct(client: SupabaseClient, productId: string, input: ProductContentInput): Promise<UpdateProductResult> {
  if (input.name.trim().length === 0) {
    throw new Error("El nombre es obligatorio.");
  }

  const { data, error } = await client
    .from("products")
    .update({
      name: input.name,
      short_description: input.shortDescription || null,
      description: input.description || null,
      type: input.type,
      category_id: input.categoryId,
      brand_id: input.brandId || null,
      is_serialized: input.isSerialized,
      warranty_months: input.warrantyMonths ?? null,
      is_active: input.isActive,
      is_featured: input.isFeatured,
      is_bestseller: input.isBestseller,
      updated_at: new Date().toISOString(),
    })
    .eq("id", productId)
    .select("id")
    .single();
  if (error || !data) {
    throw new Error(describeProductWriteError(error, "actualizar"));
  }

  return { productId: data["id"] as string };
}

/**
 * Borrado lógico (`04-DATABASE-SCHEMA-A.md` regla general: "nunca DELETE
 * en tablas de negocio"). Desactiva el producto y marca `deleted_at` —
 * desaparece del catálogo y de este panel, pero sus filas relacionadas
 * (pedidos, `owned_equipment`, etc.) conservan la referencia.
 */
export async function deleteProduct(client: SupabaseClient, productId: string): Promise<void> {
  const { error } = await client
    .from("products")
    .update({ deleted_at: new Date().toISOString(), is_active: false })
    .eq("id", productId);
  if (error) {
    throw new Error(describeProductWriteError(error, "eliminar"));
  }
}

const VIDEO_URL_PATTERN = /^https:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|player\.vimeo\.com\/video\/|vimeo\.com\/)/;

/** Video opcional de la ficha de producto (YouTube/Vimeo), benchmark
 * es.hunter.com — separado de `updateProduct` porque es un campo
 * independiente del contenido principal, mismo criterio que
 * `updateCategoryImage`. */
export async function updateProductVideo(client: SupabaseClient, productId: string, videoUrl: string | null): Promise<UpdateProductResult> {
  if (videoUrl && !VIDEO_URL_PATTERN.test(videoUrl)) {
    throw new Error("El enlace debe ser de YouTube o Vimeo.");
  }

  const { data, error } = await client
    .from("products")
    .update({ video_url: videoUrl })
    .eq("id", productId)
    .select("id")
    .single();
  if (error || !data) {
    throw new Error("No se pudo actualizar el video.");
  }

  return { productId: data["id"] as string };
}
