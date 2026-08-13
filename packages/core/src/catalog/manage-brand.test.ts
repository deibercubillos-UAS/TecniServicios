import { describe, expect, it } from "vitest";

import { createBrand, updateBrand } from "./manage-brand";

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
  return { client: client as unknown as Parameters<typeof createBrand>[0], inserted, updated };
}

describe("createBrand", () => {
  it("rejects empty slug before hitting the DB", async () => {
    const { client } = fakeClient({ id: "brand-1" });
    await expect(createBrand(client, { slug: "", name: "Hofmann", isActive: true })).rejects.toThrow("El slug es obligatorio.");
  });

  it("creates a brand and returns its id", async () => {
    const { client, inserted } = fakeClient({ id: "brand-1" });
    const result = await createBrand(client, { slug: "hofmann", name: "Hofmann", isActive: true });
    expect(result.brandId).toBe("brand-1");
    expect(inserted[0]).toMatchObject({ slug: "hofmann", name: "Hofmann", is_active: true });
  });

  it("propagates insert errors", async () => {
    const { client } = fakeClient(null, { message: "boom" });
    await expect(createBrand(client, { slug: "hofmann", name: "Hofmann", isActive: true })).rejects.toThrow("No se pudo crear la marca.");
  });
});

describe("updateBrand", () => {
  it("rejects empty name", async () => {
    const { client } = fakeClient({ id: "brand-1" });
    await expect(updateBrand(client, "brand-1", { name: "", isActive: true })).rejects.toThrow("El nombre es obligatorio.");
  });

  it("updates a brand without touching its slug", async () => {
    const { client, updated } = fakeClient({ id: "brand-1" });
    const result = await updateBrand(client, "brand-1", { name: "Hofmann GmbH", isActive: false });
    expect(result.brandId).toBe("brand-1");
    expect(updated[0]).toMatchObject({ name: "Hofmann GmbH", is_active: false });
    expect(updated[0]).not.toHaveProperty("slug");
  });
});
