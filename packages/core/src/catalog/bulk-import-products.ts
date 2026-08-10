import type { SupabaseClient } from "@supabase/supabase-js";

export interface BulkImportRow {
  sku: string;
  name: string;
  categoryName: string;
  brandName?: string | undefined;
  type?: string | undefined;
  shortDescription?: string | undefined;
  description?: string | undefined;
  warrantyMonths?: number | undefined;
}

export interface BulkImportRowResult {
  row: number;
  sku: string;
  status: "created" | "updated" | "error";
  message?: string;
}

export interface BulkImportProductsResult {
  created: number;
  updated: number;
  errors: number;
  rows: BulkImportRowResult[];
}

const ALLOWED_TYPES = ["equipment", "part", "supply"] as const;

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Importación masiva desde el Excel que exporta Siigo (docs/tasks/ACTIVE-
 * productos-imagenes-fichas-import.md) — crea o actualiza por `sku`.
 * **Nunca toca `price_cop` ni `stock_status`** (decisión del usuario vía
 * AskUserQuestion): el precio solo viene de la sincronización Siigo ya
 * diseñada (CLAUDE.md regla de negocio 5.3), este importador es solo
 * contenido de catálogo. `products_write_master` (05-RLS-SECURITY-A.md)
 * ya limita la escritura a master.
 *
 * Cada fila se procesa de forma independiente — un error en una fila
 * (categoría inexistente, nombre vacío) no aborta las demás, queda
 * reportado en `rows` con su número de fila real del archivo.
 */
export async function bulkImportProducts(client: SupabaseClient, rows: BulkImportRow[]): Promise<BulkImportProductsResult> {
  const { data: categoriesData } = await client.from("categories").select("id,name");
  const categoryByName = new Map(((categoriesData as { id: string; name: string }[] | null) ?? []).map((c) => [c.name.toLowerCase().trim(), c.id]));

  const { data: brandsData } = await client.from("brands").select("id,name");
  const brandByName = new Map(((brandsData as { id: string; name: string }[] | null) ?? []).map((b) => [b.name.toLowerCase().trim(), b.id]));

  const { data: productsData } = await client.from("products").select("id,sku,slug");
  const products = (productsData as { id: string; sku: string; slug: string }[] | null) ?? [];
  const productBySku = new Map(products.map((p) => [p.sku.trim(), p]));
  const existingSlugs = new Set(products.map((p) => p.slug));

  const results: BulkImportRowResult[] = [];
  let created = 0;
  let updated = 0;
  let errors = 0;

  for (let i = 0; i < rows.length; i++) {
    const rowNumber = i + 2; // fila 1 es el encabezado del Excel
    const row = rows[i]!;
    const sku = row.sku?.trim();
    const name = row.name?.trim();

    try {
      if (!sku) throw new Error("SKU vacío.");
      if (!name) throw new Error("Nombre vacío.");

      const categoryId = categoryByName.get((row.categoryName ?? "").toLowerCase().trim());
      if (!categoryId) throw new Error(`Categoría "${row.categoryName ?? ""}" no existe en el catálogo.`);

      let brandId: string | undefined;
      if (row.brandName && row.brandName.trim().length > 0) {
        brandId = brandByName.get(row.brandName.toLowerCase().trim());
        if (!brandId) throw new Error(`Marca "${row.brandName}" no existe en el catálogo.`);
      }

      const type = ALLOWED_TYPES.includes(row.type as (typeof ALLOWED_TYPES)[number]) ? (row.type as (typeof ALLOWED_TYPES)[number]) : "equipment";

      const existing = productBySku.get(sku);
      if (existing) {
        const { error } = await client
          .from("products")
          .update({
            name,
            short_description: row.shortDescription || null,
            description: row.description || null,
            type,
            category_id: categoryId,
            brand_id: brandId ?? null,
            warranty_months: row.warrantyMonths ?? null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);
        if (error) throw new Error("No se pudo actualizar.");
        results.push({ row: rowNumber, sku, status: "updated" });
        updated++;
      } else {
        let slug = slugify(name) || slugify(sku);
        let suffix = 2;
        while (existingSlugs.has(slug)) {
          slug = `${slugify(name) || slugify(sku)}-${suffix}`;
          suffix++;
        }
        existingSlugs.add(slug);

        const { error } = await client.from("products").insert({
          sku,
          slug,
          name,
          short_description: row.shortDescription || null,
          description: row.description || null,
          type,
          category_id: categoryId,
          brand_id: brandId ?? null,
          warranty_months: row.warrantyMonths ?? null,
          is_serialized: false,
          is_active: true,
          is_featured: false,
          is_bestseller: false,
        });
        if (error) throw new Error("No se pudo crear.");
        results.push({ row: rowNumber, sku, status: "created" });
        created++;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error desconocido.";
      results.push({ row: rowNumber, sku: sku || "(sin SKU)", status: "error", message });
      errors++;
    }
  }

  return { created, updated, errors, rows: results };
}
