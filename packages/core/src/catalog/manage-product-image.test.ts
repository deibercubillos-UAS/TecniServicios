import { describe, expect, it } from "vitest";

import { addProductImage, deleteProductImage, setPrimaryProductImage } from "./manage-product-image";

describe("addProductImage", () => {
  it("inserta la imagen con la posición y la marca principal si es la primera", async () => {
    const inserted: Record<string, unknown>[] = [];
    const client = {
      from() {
        return {
          select: () => ({ eq: async () => ({ count: 0, error: null }) }),
          update: () => ({ eq: async () => ({ error: null }) }),
          insert: (values: Record<string, unknown>) => ({
            select: () => ({
              single: async () => {
                inserted.push(values);
                return { data: { id: "image-1" }, error: null };
              },
            }),
          }),
        };
      },
    };

    const result = await addProductImage(client as never, { productId: "product-1", url: "https://cdn/img.jpg" });

    expect(result.id).toBe("image-1");
    expect(inserted[0]).toMatchObject({ product_id: "product-1", url: "https://cdn/img.jpg", position: 0, is_primary: true });
  });
});

describe("deleteProductImage", () => {
  it("devuelve la url de la imagen borrada", async () => {
    const client = {
      from() {
        return {
          select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { url: "https://cdn/img.jpg" } }) }) }),
          delete: () => ({ eq: async () => ({ error: null }) }),
        };
      },
    };

    const result = await deleteProductImage(client as never, "image-1");
    expect(result.url).toBe("https://cdn/img.jpg");
  });

  it("lanza si la imagen no existe", async () => {
    const client = {
      from() {
        return { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null }) }) }) };
      },
    };

    await expect(deleteProductImage(client as never, "missing")).rejects.toThrow("Imagen no encontrada.");
  });
});

describe("setPrimaryProductImage", () => {
  it("desmarca todas y marca solo la elegida", async () => {
    const calls: { values: Record<string, unknown>; id?: string }[] = [];
    const client = {
      from() {
        return {
          update: (values: Record<string, unknown>) => ({
            eq: async (_col: string, id: string) => {
              calls.push({ values, id });
              return { error: null };
            },
          }),
        };
      },
    };

    await setPrimaryProductImage(client as never, "product-1", "image-2");

    expect(calls[0]?.values).toMatchObject({ is_primary: false });
    expect(calls[1]).toMatchObject({ values: { is_primary: true }, id: "image-2" });
  });
});
