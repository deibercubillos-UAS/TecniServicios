import { describe, expect, it } from "vitest";

import { createPromotion, updatePromotion } from "./manage-promotion";

function fakeClient(row: Record<string, unknown> | null, error: unknown = null) {
  const inserted: Record<string, unknown>[] = [];
  const updated: Record<string, unknown>[] = [];
  const client = {
    from: () => ({
      insert: (payload: Record<string, unknown>) => {
        inserted.push(payload);
        return {
          select: () => ({
            single: async () => ({ data: row, error }),
          }),
        };
      },
      update: (payload: Record<string, unknown>) => {
        updated.push(payload);
        return {
          eq: () => ({
            select: () => ({
              single: async () => ({ data: row, error }),
            }),
          }),
        };
      },
    }),
  };
  return { client: client as unknown as Parameters<typeof createPromotion>[0], inserted, updated };
}

const base = { name: "Descuento balanceo", discountType: "percentage" as const, discountValue: 10, productId: "prod-1", isActive: true };

describe("createPromotion", () => {
  it("rejects empty name", async () => {
    const { client } = fakeClient({ id: "promo-1" });
    await expect(createPromotion(client, { ...base, name: "" })).rejects.toThrow("El nombre es obligatorio.");
  });

  it("rejects an invalid discount type", async () => {
    const { client } = fakeClient({ id: "promo-1" });
    await expect(createPromotion(client, { ...base, discountType: "bogo" as never })).rejects.toThrow("Tipo de descuento inválido.");
  });

  it("rejects a percentage over 100", async () => {
    const { client } = fakeClient({ id: "promo-1" });
    await expect(createPromotion(client, { ...base, discountValue: 150 })).rejects.toThrow("El porcentaje de descuento debe estar entre 0 y 100.");
  });

  it("rejects neither product nor category", async () => {
    const { client } = fakeClient({ id: "promo-1" });
    const { productId: _p, ...rest } = base;
    await expect(createPromotion(client, rest)).rejects.toThrow("La promoción debe tener exactamente un alcance: producto o categoría.");
  });

  it("rejects both product and category", async () => {
    const { client } = fakeClient({ id: "promo-1" });
    await expect(createPromotion(client, { ...base, categoryId: "cat-1" })).rejects.toThrow(
      "La promoción debe tener exactamente un alcance: producto o categoría.",
    );
  });

  it("creates a promotion scoped to a product", async () => {
    const { client, inserted } = fakeClient({ id: "promo-1" });
    const result = await createPromotion(client, base);
    expect(result.promotionId).toBe("promo-1");
    expect(inserted[0]).toMatchObject({ name: "Descuento balanceo", product_id: "prod-1", category_id: null });
  });

  it("propagates insert errors", async () => {
    const { client } = fakeClient(null, { message: "boom" });
    await expect(createPromotion(client, base)).rejects.toThrow("No se pudo crear la promoción.");
  });
});

describe("updatePromotion", () => {
  it("updates a promotion", async () => {
    const { client, updated } = fakeClient({ id: "promo-1" });
    const { productId: _p, ...rest } = base;
    const result = await updatePromotion(client, "promo-1", { ...rest, categoryId: "cat-1", discountValue: 20 });
    expect(result.promotionId).toBe("promo-1");
    expect(updated[0]).toMatchObject({ category_id: "cat-1", product_id: null, discount_value: 20 });
  });
});
