import type { MetadataRoute } from "next";
import { createServerClient } from "@tecni/db";
import { serverEnv } from "@tecni/shared";

/** Sin cookies de sesión: el sitemap es siempre el que ve un anónimo — no
 * expone nada distinto por usuario, y nunca incluye precio (regla de
 * docs/12-MODULE-CATALOG.md sección 9). Usa `public_products`, la misma
 * vista sin `price_cop` que ya sirve el catálogo a `anon`. */
async function getSupabase() {
  return createServerClient(serverEnv.NEXT_PUBLIC_SUPABASE_URL, serverEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    getAll: () => [],
    setAll: () => {},
  });
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Dominio de producción: tecnisas.co (docs/19-DEPLOYMENT.md sección 9).
  const baseUrl = serverEnv.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const staticEntries: MetadataRoute.Sitemap = [
    { url: baseUrl, changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/catalogo`, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/comparador`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${baseUrl}/calcula-tu-rentabilidad`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/blog`, changeFrequency: "daily", priority: 0.6 },
    { url: `${baseUrl}/contacto`, changeFrequency: "monthly", priority: 0.3 },
  ];

  const supabase = await getSupabase();
  const [{ data: productsData }, { data: postsData }] = await Promise.all([
    supabase.from("public_products").select("slug").limit(5000),
    supabase.from("posts").select("slug,published_at").eq("is_published", true).limit(2000),
  ]);

  const productEntries: MetadataRoute.Sitemap = (productsData ?? []).map((row: { slug: string }) => ({
    url: `${baseUrl}/catalogo/${row.slug}`,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const postEntries: MetadataRoute.Sitemap = ((postsData ?? []) as { slug: string; published_at: string | null }[]).map((row) => ({
    url: `${baseUrl}/blog/${row.slug}`,
    changeFrequency: "monthly",
    priority: 0.5,
    ...(row.published_at ? { lastModified: new Date(row.published_at) } : {}),
  }));

  return [...staticEntries, ...productEntries, ...postEntries];
}
