import { createServiceRoleClient } from "@tecni/db";
import { serverEnv } from "@tecni/shared";
import { processWompiWebhookEvent } from "@tecni/core";
import { WOMPI_DEV_EVENTS_SECRET, type WompiWebhookEvent } from "@tecni/integrations";

function isWompiWebhookEvent(body: unknown): body is WompiWebhookEvent {
  if (typeof body !== "object" || body === null) return false;
  const event = body as Record<string, unknown>;
  if (typeof event["timestamp"] !== "number") return false;

  const data = event["data"] as Record<string, unknown> | undefined;
  const transaction = data?.["transaction"] as Record<string, unknown> | undefined;
  if (
    !transaction ||
    typeof transaction["id"] !== "string" ||
    typeof transaction["reference"] !== "string" ||
    typeof transaction["status"] !== "string" ||
    typeof transaction["amountInCents"] !== "number"
  ) {
    return false;
  }

  const signature = event["signature"] as Record<string, unknown> | undefined;
  return typeof signature?.["checksum"] === "string";
}

/**
 * Webhook de Wompi (docs/09-INTEGRATION-PAYMENTS.md sección 2, paso 4).
 * **Riesgoso: solo `service_role`, nunca confía en el body sin verificar
 * firma primero** — `processWompiWebhookEvent` recalcula el checksum antes
 * de tocar la base; un evento sin firma válida se descarta sin excepción.
 */
export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "JSON inválido." }, { status: 400 });
  }

  if (!isWompiWebhookEvent(body)) {
    return Response.json({ error: "Evento inválido." }, { status: 400 });
  }

  const serviceClient = createServiceRoleClient(serverEnv.NEXT_PUBLIC_SUPABASE_URL, serverEnv.SUPABASE_SERVICE_ROLE_KEY);
  const eventsSecret = serverEnv.WOMPI_EVENTS_SECRET ?? WOMPI_DEV_EVENTS_SECRET;

  const result = await processWompiWebhookEvent(serviceClient, body, eventsSecret);

  if (result.outcome === "invalid_signature") {
    return Response.json({ error: "Firma inválida." }, { status: 401 });
  }
  if (result.outcome === "unknown_order") {
    return Response.json({ error: "Pedido no encontrado." }, { status: 404 });
  }

  return Response.json({ outcome: result.outcome }, { status: 200 });
}
