import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { createServerClient } from "@tecni/db";
import { serverEnv } from "@tecni/shared";
import { Icon } from "@tecni/ui";

import { StatusBadge } from "@/components/status-badge";
import {
  deleteProductDocumentAction,
  deleteProductImageAction,
  setPrimaryProductImageAction,
  updateProductAction,
  updateProductAttributesAction,
  uploadProductDocumentAction,
  uploadProductImagesAction,
} from "../actions";

export const metadata: Metadata = {
  title: "Editar producto — Panel maestro",
};

interface OptionRow {
  id: string;
  name: string;
}

interface ProductRow {
  id: string;
  sku: string;
  slug: string;
  name: string;
  short_description: string | null;
  description: string | null;
  type: string;
  category_id: string;
  brand_id: string | null;
  is_serialized: boolean;
  warranty_months: number | null;
  is_active: boolean;
  is_featured: boolean;
  is_bestseller: boolean;
}

interface ProductImageRow {
  id: string;
  url: string;
  alt: string | null;
  is_primary: boolean;
}

interface ProductDocumentRow {
  id: string;
  title: string;
  kind: string;
  file_size: number;
  is_public: boolean;
}

interface AttributeDefinitionRow {
  id: string;
  key: string;
  label: string;
  unit: string | null;
  data_type: string;
  options: string[] | null;
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

export default async function EditarProductoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    error?: string;
    created?: string;
    updated?: string;
    imagesUploaded?: string;
    imageDeleted?: string;
    imageUpdated?: string;
    documentUploaded?: string;
    documentDeleted?: string;
    attributesSaved?: string;
  }>;
}) {
  const { id } = await params;
  const { error, created, updated, imagesUploaded, imageDeleted, imageUpdated, documentUploaded, documentDeleted, attributesSaved } =
    await searchParams;
  const supabase = await getSupabase();

  const { data: productData } = await supabase
    .from("products")
    .select("id,sku,slug,name,short_description,description,type,category_id,brand_id,is_serialized,warranty_months,is_active,is_featured,is_bestseller")
    .eq("id", id)
    .maybeSingle();
  const product = productData as ProductRow | null;

  if (!product) {
    return (
      <div className="mx-auto max-w-[700px] px-4 py-16">
        <h1 className="mb-4 text-2xl font-bold text-text">Producto no encontrado</h1>
        <Link href="/admin/productos" className="text-brand hover:underline">
          Ver productos
        </Link>
      </div>
    );
  }

  const { data: categoriesData } = await supabase.from("categories").select("id,name").order("name");
  const { data: brandsData } = await supabase.from("brands").select("id,name").order("name");
  const categories = (categoriesData as OptionRow[] | null) ?? [];
  const brands = (brandsData as OptionRow[] | null) ?? [];

  const { data: imagesData } = await supabase
    .from("product_images")
    .select("id,url,alt,is_primary")
    .eq("product_id", id)
    .order("position", { ascending: true });
  const images = (imagesData as ProductImageRow[] | null) ?? [];

  const { data: documentsData } = await supabase
    .from("product_documents")
    .select("id,title,kind,file_size,is_public")
    .eq("product_id", id)
    .order("created_at", { ascending: false });
  const documents = (documentsData as ProductDocumentRow[] | null) ?? [];

  const { data: definitionsData } = await supabase
    .from("attribute_definitions")
    .select("id,key,label,unit,data_type,options")
    .eq("category_id", product.category_id)
    .order("position", { ascending: true });
  const definitions = (definitionsData as unknown as AttributeDefinitionRow[] | null) ?? [];

  const { data: attributesData } = await supabase.from("product_attributes").select("definition_id,value_text,value_number,value_boolean").eq("product_id", id);
  const attributeByDefinition = new Map(((attributesData as ProductAttributeRow[] | null) ?? []).map((a) => [a.definition_id, a]));

  function currentValue(def: AttributeDefinitionRow): string {
    const attr = attributeByDefinition.get(def.id);
    if (!attr) return "";
    if (def.data_type === "number") return attr.value_number !== null ? String(attr.value_number) : "";
    if (def.data_type === "boolean") return attr.value_boolean !== null ? String(attr.value_boolean) : "";
    return attr.value_text ?? "";
  }

  const isDraft = !product.is_active && images.length === 0;

  return (
    <div className="mx-auto flex max-w-[700px] flex-col gap-6 px-4 py-16">
      <nav aria-label="Miga de pan" className="flex flex-wrap items-center gap-2 text-sm text-text-muted">
        <Link href="/admin/productos" className="hover:text-brand">
          Productos
        </Link>
        <Icon name="chevronRight" size={14} />
        <span className="truncate text-text">{product.name}</span>
      </nav>

      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-text">{product.name}</h1>
          <p className="text-sm text-text-muted">
            SKU {product.sku} · slug {product.slug} — no editables acá (clave de sincronización con Siigo / enlaces ya indexados).
          </p>
        </div>
        {product.is_active ? (
          <StatusBadge label="Publicado" tone="success" icon="checkCircle" />
        ) : isDraft ? (
          <StatusBadge label="Borrador — falta completar" tone="warning" icon="clock" />
        ) : (
          <StatusBadge label="Inactivo" tone="muted" icon="close" />
        )}
      </div>

      {product.is_active ? (
        <Link
          href={`/catalogo/${product.slug}`}
          target="_blank"
          className="flex w-fit items-center gap-2 text-sm font-medium text-brand hover:underline"
        >
          <Icon name="search" size={14} />
          Ver en el catálogo público
        </Link>
      ) : null}

      {isDraft ? (
        <p className="flex items-center gap-2 rounded-[var(--radius)] border border-warning bg-warning/10 px-3 py-2 text-sm text-warning">
          <Icon name="clock" size={16} />
          Producto nuevo — sube al menos una foto y la ficha técnica, luego marca "Activo" para publicarlo en el catálogo.
        </p>
      ) : null}

      {created ? (
        <p className="flex items-center gap-2 rounded-[var(--radius)] border border-success bg-success/10 px-3 py-2 text-sm text-success">
          <Icon name="checkCircle" size={16} />
          Producto creado. Ahora súbele fotos, especificaciones y manual antes de publicarlo.
        </p>
      ) : null}
      {updated ? (
        <p className="flex items-center gap-2 rounded-[var(--radius)] border border-success bg-success/10 px-3 py-2 text-sm text-success">
          <Icon name="checkCircle" size={16} />
          Producto actualizado.
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="flex items-center gap-2 rounded-[var(--radius)] border border-danger bg-danger/10 px-3 py-2 text-sm text-danger">
          <Icon name="close" size={16} />
          {error}
        </p>
      ) : null}

      <form action={updateProductAction} className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5">
        <input type="hidden" name="productId" value={product.id} />
        <h2 className="flex items-center gap-2 font-bold text-text">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-subtle text-brand">
            <Icon name="document" size={16} />
          </span>
          Datos básicos
        </h2>

        <div className="flex flex-col gap-1">
          <label htmlFor="name" className="text-sm font-medium text-text-muted">
            Nombre
          </label>
          <input
            id="name"
            name="name"
            required
            defaultValue={product.name}
            className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2 text-sm focus:border-brand focus:outline-none"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="shortDescription" className="text-sm font-medium text-text-muted">
            Descripción corta
          </label>
          <input
            id="shortDescription"
            name="shortDescription"
            defaultValue={product.short_description ?? ""}
            className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2 text-sm focus:border-brand focus:outline-none"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="description" className="text-sm font-medium text-text-muted">
            Descripción
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            defaultValue={product.description ?? ""}
            className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2 text-sm focus:border-brand focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label htmlFor="type" className="text-sm font-medium text-text-muted">
              Tipo
            </label>
            <select id="type" name="type" defaultValue={product.type} className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2 text-sm focus:border-brand focus:outline-none">
              <option value="equipment">Equipo</option>
              <option value="part">Repuesto</option>
              <option value="supply">Insumo</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="warrantyMonths" className="text-sm font-medium text-text-muted">
              Garantía (meses)
            </label>
            <input
              id="warrantyMonths"
              name="warrantyMonths"
              type="number"
              min={0}
              defaultValue={product.warranty_months ?? undefined}
              className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2 text-sm focus:border-brand focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label htmlFor="categoryId" className="text-sm font-medium text-text-muted">
              Categoría
            </label>
            <select
              id="categoryId"
              name="categoryId"
              required
              defaultValue={product.category_id}
              className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2 text-sm focus:border-brand focus:outline-none"
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="brandId" className="text-sm font-medium text-text-muted">
              Marca
            </label>
            <select
              id="brandId"
              name="brandId"
              defaultValue={product.brand_id ?? ""}
              className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2 text-sm focus:border-brand focus:outline-none"
            >
              <option value="">Sin marca</option>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-[var(--radius)] border border-border bg-bg-alt p-4 text-sm text-text">
          <label className="flex items-start gap-2">
            <input type="checkbox" name="isSerialized" value="1" defaultChecked={product.is_serialized} className="mt-0.5" />
            <span>
              <span className="font-medium">Genera postventa</span>
              <span className="block text-xs text-text-muted">
                Márcalo si es un equipo (no un repuesto o insumo): al venderse crea manual, agenda de mantenimiento e historial de servicio para el cliente.
              </span>
            </span>
          </label>
          <label className="flex items-start gap-2">
            <input type="checkbox" name="isActive" value="1" defaultChecked={product.is_active} className="mt-0.5" />
            <span>
              <span className="font-medium">Activo (publicado)</span>
              <span className="block text-xs text-text-muted">Visible en el catálogo público. Actívalo solo cuando tenga foto y ficha técnica completa.</span>
            </span>
          </label>
          <label className="flex items-start gap-2">
            <input type="checkbox" name="isFeatured" value="1" defaultChecked={product.is_featured} className="mt-0.5" />
            <span>
              <span className="font-medium">Destacado</span>
              <span className="block text-xs text-text-muted">Aparece resaltado en secciones especiales del catálogo.</span>
            </span>
          </label>
          <label className="flex items-start gap-2">
            <input type="checkbox" name="isBestseller" value="1" defaultChecked={product.is_bestseller} className="mt-0.5" />
            <span>
              <span className="font-medium">Lo más vendido</span>
              <span className="block text-xs text-text-muted">Selección manual tuya — aparece en la sección "Lo más vendido" de la home.</span>
            </span>
          </label>
        </div>

        <button
          type="submit"
          className="self-start rounded-[var(--radius)] bg-brand px-4 py-2 text-sm font-semibold text-text-inverse transition-colors hover:bg-brand-hover"
        >
          Guardar cambios
        </button>
      </form>

      <section className="rounded-xl border border-border bg-surface p-5">
        <h2 className="mb-4 flex items-center gap-2 font-bold text-text">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-subtle text-brand">
            <Icon name="image" size={16} />
          </span>
          Imágenes
        </h2>

        {imagesUploaded ? (
          <p className="mb-4 flex items-center gap-2 rounded-[var(--radius)] border border-success bg-success/10 px-3 py-2 text-sm text-success">
            <Icon name="checkCircle" size={16} />
            Imágenes subidas.
          </p>
        ) : null}
        {imageDeleted ? (
          <p className="mb-4 flex items-center gap-2 rounded-[var(--radius)] border border-success bg-success/10 px-3 py-2 text-sm text-success">
            <Icon name="checkCircle" size={16} />
            Imagen eliminada.
          </p>
        ) : null}
        {imageUpdated ? (
          <p className="mb-4 flex items-center gap-2 rounded-[var(--radius)] border border-success bg-success/10 px-3 py-2 text-sm text-success">
            <Icon name="checkCircle" size={16} />
            Imagen principal actualizada.
          </p>
        ) : null}

        {images.length > 0 ? (
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {images.map((image) => (
              <div key={image.id} className="relative flex flex-col gap-2 rounded-lg border border-border p-2">
                <div className="aspect-square overflow-hidden rounded bg-bg-alt">
                  <img src={image.url} alt={image.alt ?? ""} className="h-full w-full object-cover" />
                </div>
                {image.is_primary ? <StatusBadge label="Principal" tone="brand" icon="checkCircle" /> : null}
                <div className="flex gap-1">
                  {!image.is_primary ? (
                    <form action={setPrimaryProductImageAction} className="flex-1">
                      <input type="hidden" name="productId" value={product.id} />
                      <input type="hidden" name="imageId" value={image.id} />
                      <button
                        type="submit"
                        className="w-full rounded-[var(--radius)] border border-border px-2 py-1 text-xs font-medium text-text hover:border-brand"
                      >
                        Marcar principal
                      </button>
                    </form>
                  ) : null}
                  <form action={deleteProductImageAction}>
                    <input type="hidden" name="productId" value={product.id} />
                    <input type="hidden" name="imageId" value={image.id} />
                    <button
                      type="submit"
                      aria-label="Eliminar imagen"
                      className="flex h-7 w-7 items-center justify-center rounded-[var(--radius)] text-text-muted hover:bg-danger/10 hover:text-danger"
                    >
                      <Icon name="close" size={14} />
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mb-4 text-sm text-text-muted">Sin imágenes todavía.</p>
        )}

        <form action={uploadProductImagesAction} className="flex flex-wrap items-end gap-3">
          <input type="hidden" name="productId" value={product.id} />
          <div className="flex flex-col gap-1">
            <label htmlFor="files" className="text-sm font-medium text-text-muted">
              Subir imágenes (puedes elegir varias)
            </label>
            <input
              id="files"
              name="files"
              type="file"
              accept="image/*"
              multiple
              required
              className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            className="rounded-[var(--radius)] bg-brand px-4 py-2.5 text-sm font-semibold text-text-inverse transition-colors hover:bg-brand-hover"
          >
            Subir
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-border bg-surface p-5">
        <h2 className="mb-4 flex items-center gap-2 font-bold text-text">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-subtle text-brand">
            <Icon name="sliders" size={16} />
          </span>
          Especificaciones técnicas
        </h2>

        {attributesSaved ? (
          <p className="mb-4 flex items-center gap-2 rounded-[var(--radius)] border border-success bg-success/10 px-3 py-2 text-sm text-success">
            <Icon name="checkCircle" size={16} />
            Especificaciones guardadas.
          </p>
        ) : null}

        {definitions.length === 0 ? (
          <p className="text-sm text-text-muted">
            Esta categoría todavía no tiene características definidas. Se configuran a nivel de categoría, no por producto.
          </p>
        ) : (
          <form action={updateProductAttributesAction} className="flex flex-col gap-4">
            <input type="hidden" name="productId" value={product.id} />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {definitions.map((def) => (
                <div key={def.id} className="flex flex-col gap-1">
                  <label htmlFor={`attr-${def.id}`} className="text-sm font-medium text-text-muted">
                    {def.label}
                    {def.unit ? ` (${def.unit})` : ""}
                  </label>
                  <input type="hidden" name="definitionId" value={def.id} />
                  <input type="hidden" name="dataType" value={def.data_type} />
                  {def.data_type === "enum" && def.options ? (
                    <select
                      id={`attr-${def.id}`}
                      name="value"
                      defaultValue={currentValue(def)}
                      className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2 text-sm"
                    >
                      <option value="">Sin especificar</option>
                      {def.options.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : def.data_type === "boolean" ? (
                    <select
                      id={`attr-${def.id}`}
                      name="value"
                      defaultValue={currentValue(def)}
                      className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2 text-sm"
                    >
                      <option value="">Sin especificar</option>
                      <option value="true">Sí</option>
                      <option value="false">No</option>
                    </select>
                  ) : (
                    <input
                      id={`attr-${def.id}`}
                      name="value"
                      type={def.data_type === "number" ? "number" : "text"}
                      step={def.data_type === "number" ? "any" : undefined}
                      defaultValue={currentValue(def)}
                      className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2 text-sm"
                    />
                  )}
                </div>
              ))}
            </div>
            <button
              type="submit"
              className="self-start rounded-[var(--radius)] bg-brand px-4 py-2.5 text-sm font-semibold text-text-inverse transition-colors hover:bg-brand-hover"
            >
              Guardar especificaciones
            </button>
          </form>
        )}
      </section>

      <section className="rounded-xl border border-border bg-surface p-5">
        <h2 className="mb-4 flex items-center gap-2 font-bold text-text">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-subtle text-brand">
            <Icon name="document" size={16} />
          </span>
          Manual de postventa
        </h2>
        <p className="mb-4 text-xs text-text-muted">
          Documento privado, solo visible para el cliente dueño del equipo (Mis equipos → Manuales). La ficha técnica ya no se
          sube como archivo — se llena arriba, campo por campo.
        </p>

        {documentUploaded ? (
          <p className="mb-4 flex items-center gap-2 rounded-[var(--radius)] border border-success bg-success/10 px-3 py-2 text-sm text-success">
            <Icon name="checkCircle" size={16} />
            Documento subido.
          </p>
        ) : null}
        {documentDeleted ? (
          <p className="mb-4 flex items-center gap-2 rounded-[var(--radius)] border border-success bg-success/10 px-3 py-2 text-sm text-success">
            <Icon name="checkCircle" size={16} />
            Documento eliminado.
          </p>
        ) : null}

        {documents.length > 0 ? (
          <ul className="mb-4 flex flex-col divide-y divide-border rounded-lg border border-border">
            {documents.map((doc) => (
              <li key={doc.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                <div className="flex items-center gap-3">
                  <Icon name="document" size={16} className="text-text-muted" />
                  <div>
                    <p className="text-sm font-medium text-text">{doc.title}</p>
                    <p className="text-xs text-text-muted">{Math.round(doc.file_size / 1024)} KB</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge label="Privado" tone="muted" icon="shield" />
                  <form action={deleteProductDocumentAction}>
                    <input type="hidden" name="productId" value={product.id} />
                    <input type="hidden" name="documentId" value={doc.id} />
                    <button
                      type="submit"
                      aria-label={`Eliminar ${doc.title}`}
                      className="flex h-7 w-7 items-center justify-center rounded-[var(--radius)] text-text-muted hover:bg-danger/10 hover:text-danger"
                    >
                      <Icon name="close" size={14} />
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mb-4 text-sm text-text-muted">Sin documentos todavía.</p>
        )}

        <form action={uploadProductDocumentAction} className="flex flex-col gap-4">
          <input type="hidden" name="productId" value={product.id} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label htmlFor="title" className="text-sm font-medium text-text-muted">
                Título
              </label>
              <input
                id="title"
                name="title"
                required
                placeholder="Ficha técnica — modelo X"
                className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2 text-sm"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="file" className="text-sm font-medium text-text-muted">
                Archivo
              </label>
              <input id="file" name="file" type="file" required className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2 text-sm" />
            </div>
          </div>
          <button
            type="submit"
            className="self-start rounded-[var(--radius)] bg-brand px-4 py-2.5 text-sm font-semibold text-text-inverse transition-colors hover:bg-brand-hover"
          >
            Subir manual
          </button>
        </form>
      </section>

      <Link href="/admin/productos" className="text-sm text-brand hover:underline">
        Ver productos
      </Link>
    </div>
  );
}
