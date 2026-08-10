import type { SupabaseClient } from "@supabase/supabase-js";

export interface AddProductDocumentInput {
  productId: string;
  title: string;
  kind: string;
  r2Key: string;
  fileSize: number;
  isPublic: boolean;
}

export interface AddProductDocumentResult {
  id: string;
}

/**
 * Inserta la fila después de que el archivo ya subió a R2 (docs/11-
 * STORAGE-R2.md sección 3). `is_public = true` → ficha técnica visible en
 * `/catalogo/[slug]`; `false` → manual privado, solo dueño del equipo
 * (regla de negocio 5.5). `product_documents_write_master`
 * (05-RLS-SECURITY-A.md) ya limita esto a master.
 */
export async function addProductDocument(client: SupabaseClient, input: AddProductDocumentInput): Promise<AddProductDocumentResult> {
  const { data, error } = await client
    .from("product_documents")
    .insert({
      product_id: input.productId,
      title: input.title,
      kind: input.kind,
      r2_key: input.r2Key,
      file_size: input.fileSize,
      is_public: input.isPublic,
    })
    .select("id")
    .single();
  if (error || !data) {
    throw new Error("No se pudo guardar el documento.");
  }

  return { id: data["id"] as string };
}

export async function deleteProductDocument(client: SupabaseClient, documentId: string): Promise<{ r2Key: string }> {
  const { data: document } = await client.from("product_documents").select("r2_key").eq("id", documentId).maybeSingle();
  if (!document) {
    throw new Error("Documento no encontrado.");
  }

  const { error } = await client.from("product_documents").delete().eq("id", documentId);
  if (error) {
    throw new Error("No se pudo eliminar el documento.");
  }

  return { r2Key: document["r2_key"] as string };
}
