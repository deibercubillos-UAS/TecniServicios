import { describe, expect, it } from "vitest";

import { addProductDocument, deleteProductDocument } from "./manage-product-document";

describe("addProductDocument", () => {
  it("inserta el documento con la key de R2, no la url pública", async () => {
    const inserted: Record<string, unknown>[] = [];
    const client = {
      from() {
        return {
          insert: (values: Record<string, unknown>) => ({
            select: () => ({
              single: async () => {
                inserted.push(values);
                return { data: { id: "doc-1" }, error: null };
              },
            }),
          }),
        };
      },
    };

    const result = await addProductDocument(client as never, {
      productId: "product-1",
      title: "Ficha técnica",
      kind: "ficha_tecnica",
      r2Key: "products/product-1/documents/1-ficha.pdf",
      fileSize: 1024,
      isPublic: true,
    });

    expect(result.id).toBe("doc-1");
    expect(inserted[0]).toMatchObject({
      product_id: "product-1",
      title: "Ficha técnica",
      kind: "ficha_tecnica",
      r2_key: "products/product-1/documents/1-ficha.pdf",
      file_size: 1024,
      is_public: true,
    });
  });
});

describe("deleteProductDocument", () => {
  it("devuelve la key de R2 para poder borrar el objeto después", async () => {
    const client = {
      from() {
        return {
          select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { r2_key: "products/p/documents/x.pdf" } }) }) }),
          delete: () => ({ eq: async () => ({ error: null }) }),
        };
      },
    };

    const result = await deleteProductDocument(client as never, "doc-1");
    expect(result.r2Key).toBe("products/p/documents/x.pdf");
  });

  it("lanza si el documento no existe", async () => {
    const client = {
      from() {
        return { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null }) }) }) };
      },
    };

    await expect(deleteProductDocument(client as never, "missing")).rejects.toThrow("Documento no encontrado.");
  });
});
