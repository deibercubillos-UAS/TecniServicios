import type { SupabaseClient } from "@supabase/supabase-js";

export interface PostContentInput {
  slug: string;
  title: string;
  excerpt?: string;
  body?: string;
  coverUrl?: string;
  seoTitle?: string;
  seoDescription?: string;
}

export interface CreatePostResult {
  postId: string;
}

export interface UpdatePostResult {
  postId: string;
}

export interface PublishPostInput {
  publishedAt?: string;
}

function assertValid(input: PostContentInput): void {
  if (input.title.trim().length === 0) {
    throw new Error("El título es obligatorio.");
  }
  if (input.slug.trim().length === 0) {
    throw new Error("El slug es obligatorio.");
  }
}

export async function createPost(client: SupabaseClient, authorId: string, input: PostContentInput): Promise<CreatePostResult> {
  assertValid(input);

  const { data, error } = await client
    .from("posts")
    .insert({
      slug: input.slug,
      title: input.title,
      excerpt: input.excerpt || null,
      body: input.body || null,
      cover_url: input.coverUrl || null,
      seo_title: input.seoTitle || null,
      seo_description: input.seoDescription || null,
      author_id: authorId,
    })
    .select("id")
    .single();
  if (error || !data) {
    throw new Error("No se pudo crear el post.");
  }

  return { postId: data["id"] as string };
}

export async function updatePost(client: SupabaseClient, postId: string, input: PostContentInput): Promise<UpdatePostResult> {
  assertValid(input);

  const { data, error } = await client
    .from("posts")
    .update({
      slug: input.slug,
      title: input.title,
      excerpt: input.excerpt || null,
      body: input.body || null,
      cover_url: input.coverUrl || null,
      seo_title: input.seoTitle || null,
      seo_description: input.seoDescription || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", postId)
    .select("id")
    .single();
  if (error || !data) {
    throw new Error("No se pudo actualizar el post.");
  }

  return { postId: data["id"] as string };
}

export async function publishPost(client: SupabaseClient, postId: string, input: PublishPostInput): Promise<void> {
  const { error } = await client
    .from("posts")
    .update({
      is_published: true,
      published_at: input.publishedAt || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", postId);
  if (error) {
    throw new Error("No se pudo publicar el post.");
  }
}

export async function unpublishPost(client: SupabaseClient, postId: string): Promise<void> {
  const { error } = await client
    .from("posts")
    .update({
      is_published: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", postId);
  if (error) {
    throw new Error("No se pudo despublicar el post.");
  }
}
