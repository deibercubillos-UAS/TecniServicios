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

/**
 * Cron cada 6h (Vercel Cron, `apps/web/vercel.json`) — refresca
 * `price_cop`/`stock_status` desde Siigo para cada producto activo, por
 * SKU (docs/08-INTEGRATION-SIIGO.md sección 2). Mismo criterio de
 * seguridad que `maintenance-reminders`: exige `CRON_SECRET` antes de
 * tocar la base.
 *
 * Alcance de esta corrida: **solo refresca SKUs que ya existen en la
 * web.** El descubrimiento automático de SKU nuevos en Siigo (sección 2.1
 * del doc) necesita `listProducts` paginado, que todavía no está
 * implementado en el cliente — queda para cuando se conecten cotizaciones
 * (Fase 3, ver docs/tasks/ACTIVE-integracion-siigo-siigo-pay.md).
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

  return Response.json({ updated, unchanged, notFound, failed }, { status: 200 });
}
