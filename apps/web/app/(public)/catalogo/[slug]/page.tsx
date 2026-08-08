import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { createServerClient } from "@tecni/db";
import { formatCop, serverEnv } from "@tecni/shared";
import { resolvePrice } from "@tecni/core";

import { CompareToggle } from "@/components/compare-toggle";

interface PublicProductDetail {
  id: string;
  slug: string;
  name: string;
  short_description: string | null;
  description: string | null;
  category_id: string;
  brand_id: string | null;
  stock_status: string;
}

interface CategoryRow {
  id: string;
  name: string;
  slug: string;
}

interface BrandRow {
  id: string;
  name: string;
}

interface ProductImageRow {
  url: string;
  alt: string | null;
  position: number;
  is_primary: boolean;
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

async function getProduct(slug: string) {
  const supabase = await getSupabase();
  const { data } = await supabase
    .from("public_products")
    .select("id,slug,name,short_description,description,category_id,brand_id,stock_status")
    .eq("slug", slug)
    .maybeSingle();
  return { supabase, product: data as PublicProductDetail | null };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { product } = await getProduct(slug);
  if (!product) return { title: "Producto no encontrado — Tecni Equipos y Servicios SAS" };
  return {
    title: `${product.name} — Tecni Equipos y Servicios SAS`,
    description: product.short_description ?? undefined,
  };
}

function formatAttributeValue(def: AttributeDefinitionRow, attr: ProductAttributeRow): string | null {
  if (def.data_type === "boolean") {
    if (attr.value_boolean === null) return null;
    return attr.value_boolean ? "Sí" : "No";
  }
  if (def.data_type === "number") {
    if (attr.value_number === null) return null;
    return def.unit ? `${attr.value_number} ${def.unit}` : String(attr.value_number);
  }
  if (attr.value_text === null) return null;
  return def.unit ? `${attr.value_text} ${def.unit}` : attr.value_text;
}

export default async function ProductoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { supabase, product } = await getProduct(slug);
  if (!product) notFound();

  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id ?? null;

  const [{ data: categoryData }, { data: brandData }, { data: imagesData }, { data: definitionsData }, { data: attributesData }] =
    await Promise.all([
      supabase.from("categories").select("id,name,slug").eq("id", product.category_id).maybeSingle() as unknown as Promise<{
        data: CategoryRow | null;
      }>,
      product.brand_id
        ? (supabase.from("brands").select("id,name").eq("id", product.brand_id).maybeSingle() as unknown as Promise<{
            data: BrandRow | null;
          }>)
        : Promise.resolve({ data: null }),
      supabase
        .from("product_images")
        .select("url,alt,position,is_primary")
        .eq("product_id", product.id)
        .order("position") as unknown as Promise<{ data: ProductImageRow[] | null }>,
      supabase
        .from("attribute_definitions")
        .select("id,key,label,unit,data_type,position")
        .eq("category_id", product.category_id)
        .order("position") as unknown as Promise<{ data: AttributeDefinitionRow[] | null }>,
      supabase
        .from("product_attributes")
        .select("definition_id,value_text,value_number,value_boolean")
        .eq("product_id", product.id) as unknown as Promise<{ data: ProductAttributeRow[] | null }>,
    ]);

  const category = categoryData;
  const brand = brandData;
  const images = imagesData ?? [];
  const definitions = definitionsData ?? [];
  const attributesByDefinition = new Map((attributesData ?? []).map((a) => [a.definition_id, a]));

  const specs = definitions
    .map((def) => {
      const attr = attributesByDefinition.get(def.id);
      if (!attr) return null;
      const value = formatAttributeValue(def, attr);
      if (value === null) return null;
      return { label: def.label, value };
    })
    .filter((s): s is { label: string; value: string } => s !== null);

  let priceRow: { price_cop: number | null; price_synced_at: string | null } | null = null;
  if (userId) {
    const { data } = await supabase.from("products").select("price_cop,price_synced_at").eq("id", product.id).maybeSingle();
    priceRow = data;
  }
  const resolution = resolvePrice(
    { priceCop: priceRow?.price_cop ?? null, priceSyncedAt: priceRow?.price_synced_at ?? null },
    { userId },
  );

  const primaryImage = images.find((img) => img.is_primary) ?? images[0];

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-12 md:px-6">
      <nav aria-label="Miga de pan" className="mb-6 text-sm text-text-muted">
        <Link href="/catalogo" className="hover:text-brand">
          Catálogo
        </Link>
        {category ? (
          <>
            {" / "}
            <Link href={`/catalogo?categoria=${category.slug}`} className="hover:text-brand">
              {category.name}
            </Link>
          </>
        ) : null}
        {" / "}
        <span className="text-text">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
        <div className="flex flex-col gap-4">
          <div className="aspect-square w-full overflow-hidden rounded-lg border border-border bg-bg-alt">
            {primaryImage ? (
              <img src={primaryImage.url} alt={primaryImage.alt ?? product.name} className="h-full w-full object-cover" />
            ) : null}
          </div>
          {images.length > 1 ? (
            <div className="grid grid-cols-4 gap-2">
              {images.map((img) => (
                <div key={img.url} className="aspect-square overflow-hidden rounded-[var(--radius)] border border-border bg-bg-alt">
                  <img src={img.url} alt={img.alt ?? product.name} className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-4">
          {brand ? <span className="text-sm font-semibold uppercase tracking-wide text-text-muted">{brand.name}</span> : null}
          <h1 className="text-3xl font-bold text-text">{product.name}</h1>
          {product.short_description ? <p className="text-text-muted">{product.short_description}</p> : null}
          <CompareToggle productId={product.id} categoryId={product.category_id} />

          <div className="rounded-lg border border-border bg-surface p-4">
            {resolution.visible ? (
              <div>
                <p className="text-2xl font-bold text-text">{formatCop(resolution.priceCop)}</p>
                {resolution.confidence === "unconfirmed" ? (
                  <p className="mt-1 text-sm text-text-muted">Precio sujeto a confirmación.</p>
                ) : null}
              </div>
            ) : (
              <div>
                <p className="font-medium text-brand">
                  {userId ? (
                    "Precio no disponible por el momento. Solicita una cotización."
                  ) : (
                    <Link href="/login" className="hover:underline">
                      Inicia sesión para ver precios
                    </Link>
                  )}
                </p>
              </div>
            )}
          </div>

          {product.description ? (
            <div>
              <h2 className="mb-2 text-lg font-semibold text-text">Descripción</h2>
              <p className="whitespace-pre-line text-text-muted">{product.description}</p>
            </div>
          ) : null}

          {specs.length > 0 ? (
            <div>
              <h2 className="mb-2 text-lg font-semibold text-text">Especificaciones</h2>
              <dl className="divide-y divide-border rounded-lg border border-border">
                {specs.map((spec) => (
                  <div key={spec.label} className="flex justify-between gap-4 px-4 py-2 text-sm">
                    <dt className="text-text-muted">{spec.label}</dt>
                    <dd className="font-medium text-text">{spec.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
