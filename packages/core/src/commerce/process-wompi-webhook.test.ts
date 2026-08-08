import { describe, expect, it } from "vitest";
import { WompiMockClient, computeWompiChecksum } from "@tecni/integrations";

import { processWompiWebhookEvent } from "./process-wompi-webhook";

const EVENTS_SECRET = "test-secret";

/** Fake mínimo de `SupabaseClient` — solo lo que esta función toca. */
function makeFakeClient(options: {
  orderId: string | null;
  insertError?: { code: string } | null;
}) {
  const inserted: Record<string, unknown>[] = [];
  const updates: Record<string, unknown>[] = [];

  const client = {
    from(table: string) {
      if (table === "orders") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: options.orderId ? { id: options.orderId } : null }),
            }),
          }),
          update: (values: Record<string, unknown>) => ({
            eq: async () => {
              updates.push(values);
              return { error: null };
            },
          }),
        };
      }
      if (table === "payments") {
        return {
          insert: async (values: Record<string, unknown>) => {
            inserted.push(values);
            return { error: options.insertError ?? null };
          },
        };
      }
      throw new Error(`tabla inesperada: ${table}`);
    },
  };

  return { client, inserted, updates };
}

describe("processWompiWebhookEvent", () => {
  it("rechaza un evento con firma inválida sin tocar la base", async () => {
    const wompi = new WompiMockClient(EVENTS_SECRET);
    const event = wompi.simulateApprovedEvent("ORD-TEST-1", 100000);
    event.signature.checksum = "firma-falsa";

    const { client, inserted, updates } = makeFakeClient({ orderId: "order-1" });
    const result = await processWompiWebhookEvent(client as never, event, EVENTS_SECRET);

    expect(result.outcome).toBe("invalid_signature");
    expect(inserted).toHaveLength(0);
    expect(updates).toHaveLength(0);
  });

  it("descarta un evento si no encuentra el pedido por order_number", async () => {
    const wompi = new WompiMockClient(EVENTS_SECRET);
    const event = wompi.simulateApprovedEvent("ORD-INEXISTENTE", 100000);

    const { client, inserted } = makeFakeClient({ orderId: null });
    const result = await processWompiWebhookEvent(client as never, event, EVENTS_SECRET);

    expect(result.outcome).toBe("unknown_order");
    expect(inserted).toHaveLength(0);
  });

  it("procesa un evento aprobado: inserta el pago y marca el pedido como paid", async () => {
    const wompi = new WompiMockClient(EVENTS_SECRET);
    const event = wompi.simulateApprovedEvent("ORD-TEST-2", 238000);

    const { client, inserted, updates } = makeFakeClient({ orderId: "order-2" });
    const result = await processWompiWebhookEvent(client as never, event, EVENTS_SECRET);

    expect(result.outcome).toBe("processed");
    expect(inserted[0]).toMatchObject({ order_id: "order-2", status: "approved", amount_cop: 238000 });
    expect(updates[0]).toMatchObject({ status: "paid" });
  });

  it("es idempotente: un reintento del mismo evento no vuelve a marcar el pedido", async () => {
    const wompi = new WompiMockClient(EVENTS_SECRET);
    const event = wompi.simulateApprovedEvent("ORD-TEST-3", 100000);

    const { client, updates } = makeFakeClient({ orderId: "order-3", insertError: { code: "23505" } });
    const result = await processWompiWebhookEvent(client as never, event, EVENTS_SECRET);

    expect(result.outcome).toBe("duplicate_event");
    expect(updates).toHaveLength(0);
  });

  it("recalcula el checksum con el mismo algoritmo compartido (no reimplementado dos veces)", () => {
    const transaction = { id: "mock_1", reference: "ORD-X", amountInCents: 10000, currency: "COP", status: "APPROVED" } as const;
    const timestamp = 123;
    const checksum = computeWompiChecksum(transaction, timestamp, EVENTS_SECRET);
    expect(checksum).toHaveLength(64);
  });
});
