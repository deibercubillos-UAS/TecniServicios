import { describe, expect, it } from "vitest";

import { uploadShipment } from "./upload-shipment";

function makeFakeClient(options: { insertError?: unknown } = {}) {
  const inserted: Record<string, unknown>[] = [];
  const client = {
    from(table: string) {
      if (table !== "shipments") throw new Error(`tabla inesperada: ${table}`);
      return {
        insert: (values: Record<string, unknown>) => ({
          select: () => ({
            single: async () => {
              inserted.push(values);
              return options.insertError ? { data: null, error: options.insertError } : { data: { id: "shipment-1" }, error: null };
            },
          }),
        }),
      };
    },
  };
  return { client, inserted };
}

describe("uploadShipment", () => {
  it("registra la guía con los datos provistos y quién la cargó", async () => {
    const { client, inserted } = makeFakeClient();

    const result = await uploadShipment(
      client as never,
      { orderId: "order-1", carrier: "Servientrega", trackingNumber: "SE123", trackingUrl: "https://example.com/SE123" },
      { userId: "seller-1" },
    );

    expect(result.shipmentId).toBe("shipment-1");
    expect(inserted[0]).toMatchObject({
      order_id: "order-1",
      carrier: "Servientrega",
      tracking_number: "SE123",
      created_by: "seller-1",
    });
  });

  it("rechaza una transportadora vacía sin llegar a la base", async () => {
    const { client, inserted } = makeFakeClient();

    await expect(uploadShipment(client as never, { orderId: "order-1", carrier: "  " }, { userId: "seller-1" })).rejects.toThrow(
      "La transportadora es obligatoria.",
    );
    expect(inserted).toHaveLength(0);
  });

  it("propaga un error si la base rechaza el insert (p. ej. RLS)", async () => {
    const { client } = makeFakeClient({ insertError: { message: "denied" } });

    await expect(uploadShipment(client as never, { orderId: "order-1", carrier: "TCC" }, { userId: "customer-1" })).rejects.toThrow(
      "No se pudo registrar la guía de envío.",
    );
  });
});
