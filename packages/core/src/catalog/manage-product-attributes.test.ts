import { describe, expect, it } from "vitest";

import { upsertProductAttributes } from "./manage-product-attributes";

function makeFakeClient() {
  const deletedFor: string[] = [];
  const inserted: Record<string, unknown>[] = [];
  const client = {
    from() {
      return {
        delete: () => ({
          eq: async (_col: string, productId: string) => {
            deletedFor.push(productId);
            return { error: null };
          },
        }),
        insert: async (rows: Record<string, unknown>[]) => {
          inserted.push(...rows);
          return { error: null };
        },
      };
    },
  };
  return { client, deletedFor, inserted };
}

describe("upsertProductAttributes", () => {
  it("borra las especificaciones previas y guarda las nuevas por tipo", async () => {
    const { client, deletedFor, inserted } = makeFakeClient();

    await upsertProductAttributes(client as never, "product-1", [
      { definitionId: "def-voltaje", dataType: "enum", rawValue: "220V Monofásico" },
      { definitionId: "def-capacidad", dataType: "number", rawValue: "150" },
      { definitionId: "def-serializado", dataType: "boolean", rawValue: "true" },
    ]);

    expect(deletedFor).toEqual(["product-1"]);
    expect(inserted).toEqual([
      { product_id: "product-1", definition_id: "def-voltaje", value_text: "220V Monofásico" },
      { product_id: "product-1", definition_id: "def-capacidad", value_number: 150 },
      { product_id: "product-1", definition_id: "def-serializado", value_boolean: true },
    ]);
  });

  it("descarta filas vacías y números inválidos", async () => {
    const { client, inserted } = makeFakeClient();

    await upsertProductAttributes(client as never, "product-1", [
      { definitionId: "def-a", dataType: "text", rawValue: "" },
      { definitionId: "def-b", dataType: "number", rawValue: "no-es-un-numero" },
    ]);

    expect(inserted).toEqual([]);
  });
});
