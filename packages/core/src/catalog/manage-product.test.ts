import { describe, expect, it } from "vitest";

import { createProduct, updateProduct } from "./manage-product";

function makeFakeClient(options: { insertError?: unknown; updateError?: unknown } = {}) {
  const inserted: Record<string, unknown>[] = [];
  const updated: Record<string, unknown>[] = [];
  const client = {
    from(table: string) {
      if (table !== "products") throw new Error(`tabla inesperada: ${table}`);
      return {
        insert: (values: Record<string, unknown>) => ({
          select: () => ({
            single: async () => {
              inserted.push(values);
              return options.insertError ? { data: null, error: options.insertError } : { data: { id: "product-1" }, error: null };
            },
          }),
        }),
        update: (values: Record<string, unknown>) => ({
          eq: () => ({
            select: () => ({
              single: async () => {
                updated.push(values);
                return options.updateError ? { data: null, error: options.updateError } : { data: { id: "product-1" }, error: null };
              },
            }),
          }),
        }),
      };
    },
  };
  return { client, inserted, updated };
}

const baseContent = {
  name: "Alineadora Test",
  type: "equipment" as const,
  categoryId: "category-1",
  isSerialized: true,
  isActive: true,
  isFeatured: false,
};

describe("createProduct", () => {
  it("crea el producto sin ningún campo de precio o stock", async () => {
    const { client, inserted } = makeFakeClient();

    const result = await createProduct(client as never, { ...baseContent, sku: "SKU-1", slug: "alineadora-test" });

    expect(result.productId).toBe("product-1");
    expect(inserted[0]).toMatchObject({ sku: "SKU-1", slug: "alineadora-test", name: "Alineadora Test" });
    expect(inserted[0]).not.toHaveProperty("price_cop");
    expect(inserted[0]).not.toHaveProperty("stock_status");
  });

  it("rechaza sku vacío sin llegar a la base", async () => {
    const { client, inserted } = makeFakeClient();

    await expect(createProduct(client as never, { ...baseContent, sku: " ", slug: "x" })).rejects.toThrow("El SKU es obligatorio.");
    expect(inserted).toHaveLength(0);
  });

  it("propaga un error si la base rechaza el insert", async () => {
    const { client } = makeFakeClient({ insertError: { message: "denied" } });

    await expect(createProduct(client as never, { ...baseContent, sku: "SKU-1", slug: "x" })).rejects.toThrow(
      "No se pudo crear el producto.",
    );
  });
});

describe("updateProduct", () => {
  it("actualiza el contenido sin tocar sku ni slug", async () => {
    const { client, updated } = makeFakeClient();

    const result = await updateProduct(client as never, "product-1", baseContent);

    expect(result.productId).toBe("product-1");
    expect(updated[0]).toMatchObject({ name: "Alineadora Test" });
    expect(updated[0]).not.toHaveProperty("sku");
    expect(updated[0]).not.toHaveProperty("slug");
  });

  it("rechaza nombre vacío sin llegar a la base", async () => {
    const { client, updated } = makeFakeClient();

    await expect(updateProduct(client as never, "product-1", { ...baseContent, name: "  " })).rejects.toThrow(
      "El nombre es obligatorio.",
    );
    expect(updated).toHaveLength(0);
  });
});
