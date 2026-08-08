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
  // NEXT_PUBLIC_SITE_URL sigue PENDIENTE-DECISIÓN (docs/19-DEPLOYMENT.md,
  // dominio definitivo) — hasta entonces, localhost documenta la ausencia
  // en vez de fabricar un dominio real que todavía no existe.
  const baseUrl = serverEnv.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const staticEntries: MetadataRoute.Sitemap = [
    { url: baseUrl, changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/catalogo`, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/contacto`, changeFrequency: "monthly", priority: 0.3 },
  ];

  const supabase = await getSupabase();
  const { data } = await supabase.from("public_products").select("slug").limit(5000);
  const productEntries: MetadataRoute.Sitemap = (data ?? []).map((row: { slug: string }) => ({
    url: `${baseUrl}/catalogo/${row.slug}`,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...staticEntries, ...productEntries];
}
