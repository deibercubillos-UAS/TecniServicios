import { describe, expect, it } from "vitest";

import { createBanner, updateBanner } from "./manage-banner";

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
  return { client: client as unknown as Parameters<typeof createBanner>[0], inserted, updated };
}

describe("createBanner", () => {
  it("rejects empty imageUrl before hitting the DB", async () => {
    const { client } = fakeClient({ id: "banner-1" });
    await expect(createBanner(client, { imageUrl: "", position: 0, placement: "home_hero", isActive: true })).rejects.toThrow(
      "La imagen es obligatoria.",
    );
  });

  it("rejects an invalid placement", async () => {
    const { client } = fakeClient({ id: "banner-1" });
    await expect(
      createBanner(client, { imageUrl: "https://x/y.jpg", position: 0, placement: "sidebar" as never, isActive: true }),
    ).rejects.toThrow("Placement inválido.");
  });

  it("rejects startsAt after endsAt", async () => {
    const { client } = fakeClient({ id: "banner-1" });
    await expect(
      createBanner(client, {
        imageUrl: "https://x/y.jpg",
        position: 0,
        placement: "home_hero",
        isActive: true,
        startsAt: "2026-09-01T00:00:00Z",
        endsAt: "2026-08-01T00:00:00Z",
      }),
    ).rejects.toThrow("La fecha de inicio debe ser anterior a la de fin.");
  });

  it("creates a banner and returns its id", async () => {
    const { client, inserted } = fakeClient({ id: "banner-1" });
    const result = await createBanner(client, { imageUrl: "https://x/y.jpg", position: 1, placement: "catalog_top", isActive: true });
    expect(result.bannerId).toBe("banner-1");
    expect(inserted[0]).toMatchObject({ image_url: "https://x/y.jpg", position: 1, placement: "catalog_top" });
  });

  it("propagates insert errors", async () => {
    const { client } = fakeClient(null, { message: "boom" });
    await expect(createBanner(client, { imageUrl: "https://x/y.jpg", position: 0, placement: "home_hero", isActive: true })).rejects.toThrow(
      "No se pudo crear el banner.",
    );
  });
});

describe("updateBanner", () => {
  it("updates a banner", async () => {
    const { client, updated } = fakeClient({ id: "banner-1" });
    const result = await updateBanner(client, "banner-1", { imageUrl: "https://x/z.jpg", position: 2, placement: "home_hero", isActive: false });
    expect(result.bannerId).toBe("banner-1");
    expect(updated[0]).toMatchObject({ image_url: "https://x/z.jpg", position: 2, is_active: false });
  });
});
