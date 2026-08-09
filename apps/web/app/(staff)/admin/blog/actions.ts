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

function readInput(formData: FormData): PostContentInput {
  const excerpt = String(formData.get("excerpt") ?? "");
  const body = String(formData.get("body") ?? "");
  const coverUrl = String(formData.get("coverUrl") ?? "");
  const category = String(formData.get("category") ?? "");
  const seoTitle = String(formData.get("seoTitle") ?? "");
  const seoDescription = String(formData.get("seoDescription") ?? "");

  return {
    slug: String(formData.get("slug") ?? ""),
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
    await createPost(client, userId, readInput(formData));
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
    await updatePost(client, postId, readInput(formData));
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
