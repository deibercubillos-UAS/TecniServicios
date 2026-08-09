import { describe, expect, it } from "vitest";

import { markOrderDelivered } from "./mark-order-delivered";

function makeFakeSessionClient(options: {
  order: { id: string; company_id: string; status: string } | null;
  items: { product_id: string; quantity: number; products: { is_serialized: boolean } | null }[];
}) {
  const updates: Record<string, unknown>[] = [];
  const client = {
    from(table: string) {
      if (table === "orders") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: options.order, error: null }),
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
      if (table === "order_items") {
        return {
          select: () => ({
            eq: async () => ({ data: options.items, error: null }),
          }),
        };
      }
      throw new Error(`tabla inesperada (session): ${table}`);
    },
  };
  return { client, updates };
}

// La combinación insert().select() de owned_equipment necesita resolverse
// como promesa — se arma aparte para mantener el fake simple y legible.
function makeFakeServiceClientWithEquipment() {
  const insertedEquipment: Record<string, unknown>[] = [];
  const auditLog: Record<string, unknown>[] = [];
  let nextId = 1;
  const client = {
    from(table: string) {
      if (table === "owned_equipment") {
        return {
          insert: (rows: Record<string, unknown>[]) => ({
            select: () => ({
              then: (resolve: (value: { data: { id: string }[]; error: null }) => unknown) => {
                const data = rows.map(() => ({ id: `equip-${nextId++}` }));
                insertedEquipment.push(...rows);
                return Promise.resolve({ data, error: null }).then(resolve);
              },
            }),
          }),
        };
      }
      if (table === "audit_log") {
        return {
          insert: async (values: Record<string, unknown>) => {
            auditLog.push(values);
            return { error: null };
          },
        };
      }
      throw new Error(`tabla inesperada (service): ${table}`);
    },
  };
  return { client, insertedEquipment, auditLog };
}

describe("markOrderDelivered", () => {
  it("rechaza un pedido que ya está delivered o cancelled", async () => {
    const { client: sessionClient } = makeFakeSessionClient({
      order: { id: "order-1", company_id: "company-1", status: "delivered" },
      items: [],
    });
    const { client: serviceClient } = makeFakeServiceClientWithEquipment();

    await expect(markOrderDelivered(sessionClient as never, serviceClient as never, "order-1", { userId: "seller-1" })).rejects.toThrow(
      "Solo se puede marcar como entregado",
    );
  });

  it("marca el pedido entregado y genera un owned_equipment por unidad serializada", async () => {
    const { client: sessionClient, updates } = makeFakeSessionClient({
      order: { id: "order-1", company_id: "company-1", status: "shipped" },
      items: [
        { product_id: "product-equipo", quantity: 2, products: { is_serialized: true } },
        { product_id: "product-insumo", quantity: 5, products: { is_serialized: false } },
      ],
    });
    const { client: serviceClient, insertedEquipment, auditLog } = makeFakeServiceClientWithEquipment();

    const result = await markOrderDelivered(sessionClient as never, serviceClient as never, "order-1", { userId: "seller-1" });

    expect(updates[0]).toMatchObject({ status: "delivered" });
    expect(insertedEquipment).toHaveLength(2);
    expect(insertedEquipment[0]).toMatchObject({ company_id: "company-1", product_id: "product-equipo", order_id: "order-1" });
    expect(result.equipmentIds).toHaveLength(2);
    expect(auditLog.some((entry) => entry["action"] === "order.delivered")).toBe(true);
    expect(auditLog.filter((entry) => entry["action"] === "equipment.created")).toHaveLength(2);
  });

  it("no genera owned_equipment si ningún producto es serializado", async () => {
    const { client: sessionClient } = makeFakeSessionClient({
      order: { id: "order-1", company_id: "company-1", status: "paid" },
      items: [{ product_id: "product-insumo", quantity: 3, products: { is_serialized: false } }],
    });
    const { client: serviceClient, insertedEquipment } = makeFakeServiceClientWithEquipment();

    const result = await markOrderDelivered(sessionClient as never, serviceClient as never, "order-1", { userId: "seller-1" });

    expect(insertedEquipment).toHaveLength(0);
    expect(result.equipmentIds).toHaveLength(0);
  });
});
