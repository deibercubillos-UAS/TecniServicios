import { describe, expect, it } from "vitest";

import { createPost, publishPost, unpublishPost, updatePost } from "./manage-post";

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
          eq: async () => ({ error }),
        };
      },
    }),
  };
  return { client: client as unknown as Parameters<typeof createPost>[0], inserted, updated };
}

function fakeClientForUpdate(row: Record<string, unknown> | null, error: unknown = null) {
  const updated: Record<string, unknown>[] = [];
  const client = {
    from: () => ({
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
  return { client: client as unknown as Parameters<typeof updatePost>[0], updated };
}

describe("createPost", () => {
  it("rejects empty slug before hitting the DB", async () => {
    const { client } = fakeClient({ id: "post-1" });
    await expect(createPost(client, "author-1", { slug: "", title: "Título" })).rejects.toThrow("El slug es obligatorio.");
  });

  it("creates a post as draft with author id", async () => {
    const { client, inserted } = fakeClient({ id: "post-1" });
    const result = await createPost(client, "author-1", { slug: "nuevo-post", title: "Título" });
    expect(result.postId).toBe("post-1");
    expect(inserted[0]).toMatchObject({ slug: "nuevo-post", title: "Título", author_id: "author-1" });
    expect(inserted[0]).not.toHaveProperty("is_published");
  });

  it("propagates insert errors", async () => {
    const { client } = fakeClient(null, { message: "boom" });
    await expect(createPost(client, "author-1", { slug: "nuevo-post", title: "Título" })).rejects.toThrow("No se pudo crear el post.");
  });
});

describe("updatePost", () => {
  it("rejects empty title", async () => {
    const { client } = fakeClientForUpdate({ id: "post-1" });
    await expect(updatePost(client, "post-1", { slug: "nuevo-post", title: "" })).rejects.toThrow("El título es obligatorio.");
  });

  it("updates a post without touching publish state", async () => {
    const { client, updated } = fakeClientForUpdate({ id: "post-1" });
    const result = await updatePost(client, "post-1", { slug: "editado", title: "Editado" });
    expect(result.postId).toBe("post-1");
    expect(updated[0]).toMatchObject({ slug: "editado", title: "Editado" });
    expect(updated[0]).not.toHaveProperty("is_published");
  });
});

describe("publishPost", () => {
  it("sets is_published true with a default publishedAt", async () => {
    const { client, updated } = fakeClient(null);
    await publishPost(client, "post-1", {});
    expect(updated[0]).toMatchObject({ is_published: true });
    expect(typeof updated[0]?.["published_at"]).toBe("string");
  });

  it("propagates update errors", async () => {
    const { client } = fakeClient(null, { message: "boom" });
    await expect(publishPost(client, "post-1", {})).rejects.toThrow("No se pudo publicar el post.");
  });
});

describe("unpublishPost", () => {
  it("sets is_published false", async () => {
    const { client, updated } = fakeClient(null);
    await unpublishPost(client, "post-1");
    expect(updated[0]).toMatchObject({ is_published: false });
  });
});
