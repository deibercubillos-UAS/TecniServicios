import { describe, expect, it } from "vitest";

import { createCategory, moveCategory, updateCategory } from "./manage-category";

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
  return { client: client as unknown as Parameters<typeof createCategory>[0], inserted, updated };
}

describe("createCategory", () => {
  it("rejects empty slug before hitting the DB", async () => {
    const { client } = fakeClient({ id: "cat-1" });
    await expect(createCategory(client, { slug: "", name: "Balanceo", isActive: true })).rejects.toThrow("El slug es obligatorio.");
  });

  it("creates a category and returns its id", async () => {
    const { client, inserted } = fakeClient({ id: "cat-1" });
    const result = await createCategory(client, { slug: "balanceo", name: "Balanceo", isActive: true });
    expect(result.categoryId).toBe("cat-1");
    expect(inserted[0]).toMatchObject({ slug: "balanceo", name: "Balanceo", is_active: true });
  });

  it("propagates insert errors", async () => {
    const { client } = fakeClient(null, { message: "boom" });
    await expect(createCategory(client, { slug: "balanceo", name: "Balanceo", isActive: true })).rejects.toThrow("No se pudo crear la categoría.");
  });
});

describe("updateCategory", () => {
  it("rejects empty name", async () => {
    const { client } = fakeClient({ id: "cat-1" });
    await expect(updateCategory(client, "cat-1", { name: "", isActive: true })).rejects.toThrow("El nombre es obligatorio.");
  });

  it("updates a category without touching its slug", async () => {
    const { client, updated } = fakeClient({ id: "cat-1" });
    const result = await updateCategory(client, "cat-1", { name: "Balanceo y alineación", isActive: false });
    expect(result.categoryId).toBe("cat-1");
    expect(updated[0]).toMatchObject({ name: "Balanceo y alineación", is_active: false });
    expect(updated[0]).not.toHaveProperty("slug");
  });
});

function fakeOrderedClient(rows: { id: string; position: number }[]) {
  const updates: { id: string; values: Record<string, unknown> }[] = [];
  const client = {
    from: () => ({
      select: () => ({
        order: () => ({
          order: async () => ({ data: rows, error: null }),
        }),
      }),
      update: (values: Record<string, unknown>) => ({
        eq: async (_col: string, id: string) => {
          updates.push({ id, values });
          return { error: null };
        },
      }),
    }),
  };
  return { client: client as unknown as Parameters<typeof moveCategory>[0], updates };
}

describe("moveCategory", () => {
  const rows = [
    { id: "cat-1", position: 1 },
    { id: "cat-2", position: 2 },
    { id: "cat-3", position: 3 },
  ];

  it("intercambia position con el vecino anterior al subir", async () => {
    const { client, updates } = fakeOrderedClient(rows);
    await moveCategory(client, "cat-2", "up");
    expect(updates).toContainEqual({ id: "cat-2", values: { position: 1 } });
    expect(updates).toContainEqual({ id: "cat-1", values: { position: 2 } });
  });

  it("intercambia position con el vecino siguiente al bajar", async () => {
    const { client, updates } = fakeOrderedClient(rows);
    await moveCategory(client, "cat-2", "down");
    expect(updates).toContainEqual({ id: "cat-2", values: { position: 3 } });
    expect(updates).toContainEqual({ id: "cat-3", values: { position: 2 } });
  });

  it("no hace nada si ya está en el extremo", async () => {
    const { client, updates } = fakeOrderedClient(rows);
    await moveCategory(client, "cat-1", "up");
    expect(updates).toHaveLength(0);
  });
});
