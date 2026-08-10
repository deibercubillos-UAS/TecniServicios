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
    updated?: string;
    imagesUploaded?: string;
    imageDeleted?: string;
    imageUpdated?: string;
    documentUploaded?: string;
    documentDeleted?: string;
  }>;
}) {
  const { id } = await params;
  const { error, updated, imagesUploaded, imageDeleted, imageUpdated, documentUploaded, documentDeleted } = await searchParams;
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

  return (
    <div className="mx-auto flex max-w-[700px] flex-col gap-6 px-4 py-16">
      <h1 className="text-2xl font-bold text-text">{product.name}</h1>
      <p className="text-sm text-text-muted">
        SKU {product.sku} · slug {product.slug} — no editables acá (clave de sincronización con Siigo / enlaces ya indexados).
      </p>

      {updated ? (
        <p className="rounded-[var(--radius)] border border-success bg-success/10 px-3 py-2 text-sm text-success">Producto actualizado.</p>
      ) : null}
      {error ? (
        <p role="alert" className="rounded-[var(--radius)] border border-danger bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>
      ) : null}

      <form action={updateProductAction} className="flex flex-col gap-4">
        <input type="hidden" name="productId" value={product.id} />

        <div className="flex flex-col gap-1">
          <label htmlFor="name" className="text-sm text-text-muted">
            Nombre
          </label>
          <input id="name" name="name" required defaultValue={product.name} className="rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm" />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="shortDescription" className="text-sm text-text-muted">
            Descripción corta
          </label>
          <input
            id="shortDescription"
            name="shortDescription"
            defaultValue={product.short_description ?? ""}
            className="rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="description" className="text-sm text-text-muted">
            Descripción
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            defaultValue={product.description ?? ""}
            className="rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label htmlFor="type" className="text-sm text-text-muted">
              Tipo
            </label>
            <select id="type" name="type" defaultValue={product.type} className="rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm">
              <option value="equipment">Equipo</option>
              <option value="part">Repuesto</option>
              <option value="supply">Insumo</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="warrantyMonths" className="text-sm text-text-muted">
              Garantía (meses)
            </label>
            <input
              id="warrantyMonths"
              name="warrantyMonths"
              type="number"
              min={0}
              defaultValue={product.warranty_months ?? undefined}
              className="rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label htmlFor="categoryId" className="text-sm text-text-muted">
              Categoría
            </label>
            <select
              id="categoryId"
              name="categoryId"
              required
              defaultValue={product.category_id}
              className="rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm"
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="brandId" className="text-sm text-text-muted">
              Marca
            </label>
            <select
              id="brandId"
              name="brandId"
              defaultValue={product.brand_id ?? ""}
              className="rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm"
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

        <div className="flex flex-wrap gap-4 text-sm text-text">
          <label className="flex items-center gap-2">
            <input type="checkbox" name="isSerialized" value="1" defaultChecked={product.is_serialized} /> Genera postventa (serializado)
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="isActive" value="1" defaultChecked={product.is_active} /> Activo
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="isFeatured" value="1" defaultChecked={product.is_featured} /> Destacado
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="isBestseller" value="1" defaultChecked={product.is_bestseller} /> Lo más vendido (selección manual, home)
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
            <Icon name="document" size={16} />
          </span>
          Ficha técnica y documentos
        </h2>
        <p className="mb-4 text-xs text-text-muted">
          Los documentos <strong>públicos</strong> se ven en la pestaña "Especificaciones técnicas" del catálogo. Los
          <strong> privados</strong> son manuales de postventa, solo visibles para quien compró el equipo.
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
                  <StatusBadge
                    label={doc.is_public ? "Público (ficha técnica)" : "Privado (manual)"}
                    tone={doc.is_public ? "brand" : "muted"}
                    icon={doc.is_public ? "checkCircle" : "shield"}
                  />
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
          <label className="flex items-center gap-2 text-sm text-text">
            <input type="checkbox" name="isPublic" value="1" defaultChecked /> Público (ficha técnica visible en el catálogo)
          </label>
          <button
            type="submit"
            className="self-start rounded-[var(--radius)] bg-brand px-4 py-2.5 text-sm font-semibold text-text-inverse transition-colors hover:bg-brand-hover"
          >
            Subir documento
          </button>
        </form>
      </section>

      <Link href="/admin/productos" className="text-sm text-brand hover:underline">
        Ver productos
      </Link>
    </div>
  );
}
