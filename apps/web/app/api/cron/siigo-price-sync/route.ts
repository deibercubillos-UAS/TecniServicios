import { createServiceRoleClient } from "@tecni/db";
import { serverEnv } from "@tecni/shared";
import { recordAuditLog } from "@tecni/core";
import { getSiigoClient } from "@tecni/integrations";

interface ProductRow {
  id: string;
  sku: string;
  price_cop: number | null;
  tax_rate: number;
}

const STALE_AFTER_HOURS = 6;
const UNCLASSIFIED_CATEGORY_SLUG = "sin-clasificar";
const MAX_LIST_PAGES = 50;

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Cron diario, 9:00 UTC / 4:00 a.m. Colombia (Vercel Cron,
 * `apps/web/vercel.json`) — el plan Hobby de Vercel no permite crons más
 * frecuentes que uno al día; `STALE_AFTER_HOURS` sigue en 6 para que
 * `price_is_stale` refleje la antigüedad real aunque el cron corra una
 * vez — refresca
 * `price_cop`/`stock_status` desde Siigo para cada producto activo, por
 * SKU (docs/08-INTEGRATION-SIIGO.md sección 2). Mismo criterio de
 * seguridad que `maintenance-reminders`: exige `CRON_SECRET` antes de
 * tocar la base.
 *
 * Además recorre `listProducts` paginado y crea un borrador
 * (`is_active = false`, categoría "Sin clasificar") por cada SKU que
 * Siigo tiene y la web no — mismo criterio que la importación por Excel
 * (`bulk-import-products.ts`): sin fotos ni ficha técnica, nunca se
 * publica solo. El master lo completa y activa a mano en el panel.
 */
export async function GET(request: Request): Promise<Response> {
  if (!serverEnv.CRON_SECRET || request.headers.get("authorization") !== `Bearer ${serverEnv.CRON_SECRET}`) {
    return Response.json({ error: "No autorizado." }, { status: 401 });
  }

  const siigoConfig =
    serverEnv.SIIGO_USERNAME && serverEnv.SIIGO_ACCESS_KEY && serverEnv.SIIGO_BASE_URL && serverEnv.SIIGO_PARTNER_ID
      ? {
          username: serverEnv.SIIGO_USERNAME,
          accessKey: serverEnv.SIIGO_ACCESS_KEY,
          baseUrl: serverEnv.SIIGO_BASE_URL,
          partnerId: serverEnv.SIIGO_PARTNER_ID,
        }
      : null;

  if (!siigoConfig) {
    return Response.json({ updated: 0, unchanged: 0, notFound: [], failed: 0, reason: "Siigo no configurado." }, { status: 200 });
  }

  const serviceClient = createServiceRoleClient(serverEnv.NEXT_PUBLIC_SUPABASE_URL, serverEnv.SUPABASE_SERVICE_ROLE_KEY);
  const siigo = getSiigoClient(siigoConfig);

  const { data, error } = await serviceClient.from("products").select("id,sku,price_cop,tax_rate").eq("is_active", true).is("deleted_at", null);

  if (error) {
    return Response.json({ error: "No se pudieron consultar los productos." }, { status: 500 });
  }

  const products = (data as ProductRow[] | null) ?? [];

  let updated = 0;
  let unchanged = 0;
  let failed = 0;
  const notFound: string[] = [];

  for (const product of products) {
    let price;
    let stock;
    try {
      [price, stock] = await Promise.all([siigo.getProductPrice(product.sku), siigo.getProductStock(product.sku)]);
    } catch {
      failed += 1;
      continue;
    }

    if (price === null) {
      notFound.push(product.sku);
      continue;
    }

    const priceChanged = price.priceCop !== product.price_cop || price.taxRate !== product.tax_rate;
    const nowIso = new Date().toISOString();

    const { error: updateError } = await serviceClient
      .from("products")
      .update({
        price_cop: price.priceCop,
        tax_rate: price.taxRate,
        price_synced_at: nowIso,
        price_is_stale: false,
        stock_status: stock.status,
        updated_at: nowIso,
      })
      .eq("id", product.id);

    if (updateError) {
      failed += 1;
      continue;
    }

    if (priceChanged) {
      updated += 1;
      await recordAuditLog(serviceClient, {
        actorId: null,
        action: "product.price_synced",
        entity: "products",
        entityId: product.id,
        before: { priceCop: product.price_cop, taxRate: product.tax_rate },
        after: { priceCop: price.priceCop, taxRate: price.taxRate },
      });
    } else {
      unchanged += 1;
    }
  }

  const staleThreshold = new Date(Date.now() - STALE_AFTER_HOURS * 60 * 60 * 1000).toISOString();
  await serviceClient
    .from("products")
    .update({ price_is_stale: true })
    .eq("is_active", true)
    .is("deleted_at", null)
    .not("price_cop", "is", null)
    .or(`price_synced_at.is.null,price_synced_at.lt.${staleThreshold}`);

  if (notFound.length > 0) {
    await recordAuditLog(serviceClient, {
      actorId: null,
      action: "product.siigo_sku_not_found",
      entity: "products",
      entityId: "batch",
      before: null,
      after: { skus: notFound },
    });
  }

  const created = await discoverNewSkus(serviceClient, siigo);

  return Response.json({ updated, unchanged, notFound, failed, created: created.length, createdSkus: created }, { status: 200 });
}

async function getOrCreateUnclassifiedCategory(serviceClient: ReturnType<typeof createServiceRoleClient>): Promise<string | null> {
  const { data: existing } = await serviceClient.from("categories").select("id").eq("slug", UNCLASSIFIED_CATEGORY_SLUG).maybeSingle();
  if (existing) return (existing as { id: string }).id;

  const { data: maxPosition } = await serviceClient.from("categories").select("position").order("position", { ascending: false }).limit(1).maybeSingle();
  const nextPosition = ((maxPosition as { position: number } | null)?.position ?? 0) + 1;

  const { data: created, error } = await serviceClient
    .from("categories")
    .insert({ slug: UNCLASSIFIED_CATEGORY_SLUG, name: "Sin clasificar", position: nextPosition, is_active: true })
    .select("id")
    .single();

  if (error || !created) return null;
  return (created as { id: string }).id;
}

/** Recorre todo el catálogo de Siigo y crea un producto borrador por cada
 * SKU que no exista todavía en `products` (activo, inactivo o eliminado —
 * `sku` es único, así que también hay que esquivar los históricos).
 * `MAX_LIST_PAGES` es una red de seguridad, no un límite de negocio: a
 * `LIST_PAGE_SIZE` de 100 cubre 5.000 productos, muy por encima de
 * cualquier catálogo real de Tecnisas hoy. */
async function discoverNewSkus(serviceClient: ReturnType<typeof createServiceRoleClient>, siigo: ReturnType<typeof getSiigoClient>): Promise<string[]> {
  const { data: existingSkuRows } = await serviceClient.from("products").select("sku");
  const existingSkus = new Set(((existingSkuRows as { sku: string }[] | null) ?? []).map((r) => r.sku));

  const { data: existingSlugRows } = await serviceClient.from("products").select("slug");
  const existingSlugs = new Set(((existingSlugRows as { slug: string }[] | null) ?? []).map((r) => r.slug));

  const createdSkus: string[] = [];
  let categoryId: string | null = null;

  for (let page = 1; page <= MAX_LIST_PAGES; page += 1) {
    let listPage;
    try {
      listPage = await siigo.listProducts(page);
    } catch {
      break;
    }

    for (const product of listPage.products) {
      if (existingSkus.has(product.sku)) continue;
      existingSkus.add(product.sku);

      if (!categoryId) {
        categoryId = await getOrCreateUnclassifiedCategory(serviceClient);
        if (!categoryId) break;
      }

      let slug = slugify(product.name) || slugify(product.sku);
      let suffix = 2;
      while (existingSlugs.has(slug)) {
        slug = `${slugify(product.name) || slugify(product.sku)}-${suffix}`;
        suffix += 1;
      }
      existingSlugs.add(slug);

      const { data: inserted, error: insertError } = await serviceClient
        .from("products")
        .insert({
          sku: product.sku,
          slug,
          name: product.name,
          category_id: categoryId,
          is_active: false,
          price_cop: product.priceCop,
          tax_rate: product.taxRate,
          price_synced_at: new Date().toISOString(),
          price_is_stale: false,
          stock_status: product.stockStatus,
        })
        .select("id")
        .single();

      if (insertError || !inserted) continue;

      createdSkus.push(product.sku);
      await recordAuditLog(serviceClient, {
        actorId: null,
        action: "product.siigo_sku_discovered",
        entity: "products",
        entityId: (inserted as { id: string }).id,
        before: null,
        after: { sku: product.sku, name: product.name },
      });
    }

    if (!listPage.hasMore) break;
  }

  return createdSkus;
}
