"use client";

import { useState } from "react";

export interface PromotionOption {
  id: string;
  name: string;
}

/** Alcance de la promoción — exactamente un producto o una categoría. El
 * select del lado no elegido se deshabilita (en vez de solo confiar en la
 * validación del server action) para que nunca sea ambiguo cuál cuenta. */
export function PromotionScopeFields({
  products,
  categories,
  defaultScope,
  defaultProductId,
  defaultCategoryId,
}: {
  products: PromotionOption[];
  categories: PromotionOption[];
  defaultScope: "product" | "category";
  defaultProductId: string;
  defaultCategoryId: string;
}) {
  const [scope, setScope] = useState<"product" | "category">(defaultScope);

  return (
    <fieldset className="flex flex-col gap-3 rounded-[var(--radius)] border border-border p-3">
      <legend className="px-1 text-sm font-medium text-text-muted">Alcance — exactamente uno</legend>

      <label className="flex items-center gap-2 text-sm text-text">
        <input type="radio" name="scope" value="product" checked={scope === "product"} onChange={() => setScope("product")} />
        Un producto
      </label>
      <select
        name="productId"
        defaultValue={defaultProductId}
        disabled={scope !== "product"}
        className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2 text-sm focus:border-brand focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
      >
        <option value="">Seleccionar producto</option>
        {products.map((product) => (
          <option key={product.id} value={product.id}>
            {product.name}
          </option>
        ))}
      </select>

      <label className="flex items-center gap-2 text-sm text-text">
        <input type="radio" name="scope" value="category" checked={scope === "category"} onChange={() => setScope("category")} />
        Una categoría
      </label>
      <select
        name="categoryId"
        defaultValue={defaultCategoryId}
        disabled={scope !== "category"}
        className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2 text-sm focus:border-brand focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
      >
        <option value="">Seleccionar categoría</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </select>
    </fieldset>
  );
}
