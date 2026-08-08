import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { createServerClient } from "@tecni/db";
import { serverEnv } from "@tecni/shared";

const MAX_COMPARE = 3;

export const metadata: Metadata = {
  title: "Comparador — Tecni Equipos y Servicios SAS",
};

interface PublicProductRow {
  id: string;
  slug: string;
  name: string;
  brand_id: string | null;
  category_id: string;
}

interface BrandRow {
  id: string;
  name: string;
}

interface AttributeDefinitionRow {
  id: string;
  key: string;
  label: string;
  unit: string | null;
  data_type: string;
  position: number;
}

interface ProductAttributeRow {
  product_id: string;
  definition_id: string;
  value_text: string | null;
  value_number: number | null;
  value_boolean: boolean | null;
}

async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(serverEnv.NEXT_PUBLIC_SUPABASE_URL, serverEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    getAll: () => cookieStore.getAll(),
    setAll: () => {},
  });
}

function formatAttributeValue(def: AttributeDefinitionRow, attr: ProductAttributeRow | undefined): string {
  if (!attr) return "—";
  if (def.data_type === "boolean") {
    if (attr.value_boolean === null) return "—";
    return attr.value_boolean ? "Sí" : "No";
  }
  if (def.data_type === "number") {
    if (attr.value_number === null) return "—";
    return def.unit ? `${attr.value_number} ${def.unit}` : String(attr.value_number);
  }
  if (attr.value_text === null) return "—";
  return def.unit ? `${attr.value_text} ${def.unit}` : attr.value_text;
}

export default async function ComparadorPage({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string }>;
}) {
  const { ids: idsParam } = await searchParams;
  const ids = (idsParam ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)
    .slice(0, MAX_COMPARE);

  if (ids.length < 2) {
    return (
      <div className="mx-auto max-w-[1280px] px-4 py-12 md:px-6">
        <h1 className="mb-4 text-2xl font-bold text-text">Comparador</h1>
        <p className="text-text-muted">
          Elige al menos 2 productos de la misma categoría desde el{" "}
          <Link href="/catalogo" className="text-brand hover:underline">
            catálogo
          </Link>{" "}
          para compararlos.
        </p>
      </div>
    );
  }

  const supabase = await getSupabase();
  const { data: productsData } = await supabase
    .from("public_products")
    .select("id,slug,name,brand_id,category_id")
    .in("id", ids);
  const products = (productsData as PublicProductRow[] | null) ?? [];
  const orderedProducts = ids.map((id) => products.find((p) => p.id === id)).filter((p): p is PublicProductRow => !!p);

  if (orderedProducts.length < 2) {
    return (
      <div className="mx-auto max-w-[1280px] px-4 py-12 md:px-6">
        <h1 className="mb-4 text-2xl font-bold text-text">Comparador</h1>
        <p className="text-text-muted">No encontramos suficientes productos para comparar.</p>
      </div>
    );
  }

  const categoryId = orderedProducts[0]?.category_id;
  const sameCategory = orderedProducts.every((p) => p.category_id === categoryId);

  if (!sameCategory || !categoryId) {
    return (
      <div className="mx-auto max-w-[1280px] px-4 py-12 md:px-6">
        <h1 className="mb-4 text-2xl font-bold text-text">Comparador</h1>
        <p className="text-text-muted">
          Solo se pueden comparar productos de la misma categoría (docs/12-MODULE-CATALOG.md sección 7).
        </p>
      </div>
    );
  }

  const brandIds = orderedProducts.map((p) => p.brand_id).filter((id): id is string => id !== null);

  const [{ data: definitionsData }, { data: attributesData }, { data: brandsData }] = await Promise.all([
    supabase
      .from("attribute_definitions")
      .select("id,key,label,unit,data_type,position")
      .eq("category_id", categoryId)
      .eq("is_comparable", true)
      .order("position") as unknown as Promise<{ data: AttributeDefinitionRow[] | null }>,
    supabase
      .from("product_attributes")
      .select("product_id,definition_id,value_text,value_number,value_boolean")
      .in(
        "product_id",
        orderedProducts.map((p) => p.id),
      ) as unknown as Promise<{ data: ProductAttributeRow[] | null }>,
    brandIds.length > 0
      ? (supabase.from("brands").select("id,name").in("id", brandIds) as unknown as Promise<{ data: BrandRow[] | null }>)
      : Promise.resolve({ data: [] }),
  ]);

  const definitions = definitionsData ?? [];
  const attributesByProduct = new Map<string, Map<string, ProductAttributeRow>>();
  for (const attr of attributesData ?? []) {
    if (!attributesByProduct.has(attr.product_id)) attributesByProduct.set(attr.product_id, new Map());
    attributesByProduct.get(attr.product_id)?.set(attr.definition_id, attr);
  }
  const brandsById = new Map((brandsData ?? []).map((b) => [b.id, b.name]));

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-12 md:px-6">
      <h1 className="mb-6 text-2xl font-bold text-text">Comparador</h1>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="w-48 border-b border-border p-3 text-left text-text-muted">Producto</th>
              {orderedProducts.map((product) => (
                <th key={product.id} className="border-b border-border p-3 text-left">
                  <Link href={`/catalogo/${product.slug}`} className="font-semibold text-text hover:text-brand">
                    {product.name}
                  </Link>
                  {product.brand_id ? (
                    <p className="mt-1 text-xs font-medium uppercase tracking-wide text-text-muted">
                      {brandsById.get(product.brand_id)}
                    </p>
                  ) : null}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {definitions.length === 0 ? (
              <tr>
                <td colSpan={orderedProducts.length + 1} className="p-3 text-text-muted">
                  Esta categoría no tiene especificaciones comparables cargadas todavía.
                </td>
              </tr>
            ) : (
              definitions.map((def) => (
                <tr key={def.id} className="odd:bg-bg-alt">
                  <td className="p-3 font-medium text-text">
                    {def.label}
                    {def.unit ? ` (${def.unit})` : ""}
                  </td>
                  {orderedProducts.map((product) => (
                    <td key={product.id} className="p-3 text-text">
                      {formatAttributeValue(def, attributesByProduct.get(product.id)?.get(def.id))}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
