"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@tecni/db";
import { serverEnv } from "@tecni/shared";
import { createPost, publishPost, unpublishPost, updatePost, type PostContentInput } from "@tecni/core";

async function getSession() {
  const cookieStore = await cookies();
  const client = createServerClient(serverEnv.NEXT_PUBLIC_SUPABASE_URL, serverEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    getAll: () => cookieStore.getAll(),
    setAll: (list) => {
      for (const { name, value, options } of list) {
        cookieStore.set(name, value, options);
      }
    },
  });
  const { data: userData } = await client.auth.getUser();
  if (!userData.user) {
    redirect("/login?next=/admin/blog");
  }
  return { client, userId: userData.user.id };
}

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Slug automático a partir del título — nunca lo pide el formulario
 * (mismo criterio que productos/categorías/marcas). Único acá, no en
 * update: cambiarlo después rompería enlaces ya compartidos. */
async function generateUniqueSlug(client: Awaited<ReturnType<typeof getSession>>["client"], title: string): Promise<string> {
  const base = slugify(title) || "post";
  let candidate = base;
  let suffix = 2;
  for (;;) {
    const { data } = await client.from("posts").select("id").eq("slug", candidate).maybeSingle();
    if (!data) return candidate;
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
}

function readInput(formData: FormData): Omit<PostContentInput, "slug"> {
  const excerpt = String(formData.get("excerpt") ?? "");
  const body = String(formData.get("body") ?? "");
  const coverUrl = String(formData.get("coverUrl") ?? "");
  const category = String(formData.get("category") ?? "");
  const seoTitle = String(formData.get("seoTitle") ?? "");
  const seoDescription = String(formData.get("seoDescription") ?? "");

  return {
    title: String(formData.get("title") ?? ""),
    ...(excerpt ? { excerpt } : {}),
    ...(body ? { body } : {}),
    ...(coverUrl ? { coverUrl } : {}),
    ...(category ? { category } : {}),
    ...(seoTitle ? { seoTitle } : {}),
    ...(seoDescription ? { seoDescription } : {}),
  };
}

export async function createPostAction(formData: FormData): Promise<void> {
  const { client, userId } = await getSession();

  try {
    const input = readInput(formData);
    const slug = await generateUniqueSlug(client, input.title);
    await createPost(client, userId, { ...input, slug });
  } catch (err) {
    const message = err instanceof Error ? err.message : "No se pudo crear el post.";
    redirect("/admin/blog/nuevo?error=" + encodeURIComponent(message));
  }

  redirect("/admin/blog?created=1");
}

export async function updatePostAction(formData: FormData): Promise<void> {
  const postId = formData.get("postId");
  if (typeof postId !== "string" || postId.length === 0) {
    redirect("/admin/blog?error=" + encodeURIComponent("Datos inválidos."));
  }

  const { client } = await getSession();

  try {
    const { data } = await client.from("posts").select("slug").eq("id", postId).maybeSingle();
    const slug = data?.["slug"] as string;
    await updatePost(client, postId, { ...readInput(formData), slug });
  } catch (err) {
    const message = err instanceof Error ? err.message : "No se pudo actualizar el post.";
    redirect(`/admin/blog/${encodeURIComponent(postId)}?error=` + encodeURIComponent(message));
  }

  redirect(`/admin/blog/${encodeURIComponent(postId)}?updated=1`);
}

export async function publishPostAction(formData: FormData): Promise<void> {
  const postId = formData.get("postId");
  if (typeof postId !== "string" || postId.length === 0) {
    redirect("/admin/blog?error=" + encodeURIComponent("Datos inválidos."));
  }

  const publishedAtRaw = String(formData.get("publishedAt") ?? "");
  const { client } = await getSession();

  try {
    await publishPost(client, postId, publishedAtRaw ? { publishedAt: new Date(publishedAtRaw).toISOString() } : {});
  } catch (err) {
    const message = err instanceof Error ? err.message : "No se pudo publicar el post.";
    redirect(`/admin/blog/${encodeURIComponent(postId)}?error=` + encodeURIComponent(message));
  }

  redirect(`/admin/blog/${encodeURIComponent(postId)}?updated=1`);
}

export async function unpublishPostAction(formData: FormData): Promise<void> {
  const postId = formData.get("postId");
  if (typeof postId !== "string" || postId.length === 0) {
    redirect("/admin/blog?error=" + encodeURIComponent("Datos inválidos."));
  }

  const { client } = await getSession();

  try {
    await unpublishPost(client, postId);
  } catch (err) {
    const message = err instanceof Error ? err.message : "No se pudo despublicar el post.";
    redirect(`/admin/blog/${encodeURIComponent(postId)}?error=` + encodeURIComponent(message));
  }

  redirect(`/admin/blog/${encodeURIComponent(postId)}?updated=1`);
}
