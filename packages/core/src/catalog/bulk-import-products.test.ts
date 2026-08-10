import { describe, expect, it } from "vitest";

import { bulkImportProducts } from "./bulk-import-products";

function makeFakeClient() {
  const categories = [{ id: "cat-1", name: "Alineación" }];
  const brands = [{ id: "brand-1", name: "Hunter" }];
  const products = [{ id: "product-1", sku: "SKU-EXISTENTE", slug: "producto-existente" }];
  const updates: Record<string, unknown>[] = [];
  const inserts: Record<string, unknown>[] = [];

  const client = {
    from(table: string) {
      if (table === "categories") return { select: async () => ({ data: categories }) };
      if (table === "brands") return { select: async () => ({ data: brands }) };
      if (table === "products") {
        return {
          select: async () => ({ data: products }),
          update: (values: Record<string, unknown>) => ({
            eq: async (_col: string, id: string) => {
              updates.push({ ...values, id });
              return { error: null };
            },
          }),
          insert: async (values: Record<string, unknown>) => {
            inserts.push(values);
            return { error: null };
          },
        };
      }
      throw new Error(`tabla inesperada: ${table}`);
    },
  };
  return { client, updates, inserts };
}

describe("bulkImportProducts", () => {
  it("actualiza un producto existente por sku sin tocar precio/stock", async () => {
    const { client, updates } = makeFakeClient();

    const result = await bulkImportProducts(client as never, [
      { sku: "SKU-EXISTENTE", name: "Alineadora X", categoryName: "Alineación" },
    ]);

    expect(result.updated).toBe(1);
    expect(result.created).toBe(0);
    expect(result.errors).toBe(0);
    expect(updates[0]).toMatchObject({ name: "Alineadora X", category_id: "cat-1" });
    expect(updates[0]).not.toHaveProperty("price_cop");
    expect(updates[0]).not.toHaveProperty("stock_status");
  });

  it("crea un producto nuevo con slug generado del nombre", async () => {
    const { client, inserts } = makeFakeClient();

    const result = await bulkImportProducts(client as never, [
      { sku: "SKU-NUEVO", name: "Balanceadora Pro", categoryName: "Alineación", brandName: "Hunter" },
    ]);

    expect(result.created).toBe(1);
    expect(inserts[0]).toMatchObject({ sku: "SKU-NUEVO", slug: "balanceadora-pro", category_id: "cat-1", brand_id: "brand-1" });
    expect(inserts[0]?.["is_active"]).toBe(false);
  });

  it("reporta error por fila si la categoría no existe, sin abortar las demás", async () => {
    const { client } = makeFakeClient();

    const result = await bulkImportProducts(client as never, [
      { sku: "SKU-1", name: "Producto sin categoría", categoryName: "No existe" },
      { sku: "SKU-EXISTENTE", name: "Alineadora X", categoryName: "Alineación" },
    ]);

    expect(result.errors).toBe(1);
    expect(result.updated).toBe(1);
    expect(result.rows[0]).toMatchObject({ row: 2, status: "error" });
    expect(result.rows[1]).toMatchObject({ row: 3, status: "updated" });
  });

  it("reporta error si falta el nombre", async () => {
    const { client } = makeFakeClient();

    const result = await bulkImportProducts(client as never, [{ sku: "SKU-2", name: "", categoryName: "Alineación" }]);

    expect(result.errors).toBe(1);
    expect(result.rows[0]?.message).toBe("Nombre vacío.");
  });
});
