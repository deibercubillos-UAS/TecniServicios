import type { SupabaseClient } from "@supabase/supabase-js";

export interface ProductAttributeValue {
  definitionId: string;
  dataType: "text" | "number" | "boolean" | "enum";
  rawValue: string;
}

/**
 * La ficha técnica se llena campo por campo, no se sube un archivo que
 * nadie puede analizar (decisión del usuario) — un valor por
 * `attribute_definitions` de la categoría del producto.
 * `product_attributes_write_master` (05-RLS-SECURITY-A.md) ya limita
 * esto a master. Borra y reinserta en vez de intentar upsert parcial:
 * más simple y el volumen por producto es pequeño (unas pocas
 * características).
 */
export async function upsertProductAttributes(client: SupabaseClient, productId: string, values: ProductAttributeValue[]): Promise<void> {
  const { error: deleteError } = await client.from("product_attributes").delete().eq("product_id", productId);
  if (deleteError) {
    throw new Error("No se pudieron guardar las especificaciones.");
  }

  const rows = values
    .filter((v) => v.rawValue.trim().length > 0)
    .map((v) => {
      const base = { product_id: productId, definition_id: v.definitionId };
      if (v.dataType === "number") {
        const num = Number.parseFloat(v.rawValue);
        return { ...base, value_number: Number.isNaN(num) ? null : num };
      }
      if (v.dataType === "boolean") {
        return { ...base, value_boolean: v.rawValue === "true" };
      }
      return { ...base, value_text: v.rawValue };
    })
    .filter((row) => "value_number" in row ? row.value_number !== null : true);

  if (rows.length === 0) return;

  const { error: insertError } = await client.from("product_attributes").insert(rows);
  if (insertError) {
    throw new Error("No se pudieron guardar las especificaciones.");
  }
}
