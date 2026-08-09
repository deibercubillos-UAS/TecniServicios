import { describe, expect, it } from "vitest";

import { recordAuditLog } from "./record-audit-log";

function makeFakeClient(options: { error?: unknown } = {}) {
  const inserted: Record<string, unknown>[] = [];
  const client = {
    from(table: string) {
      if (table !== "audit_log") throw new Error(`tabla inesperada: ${table}`);
      return {
        insert: async (values: Record<string, unknown>) => {
          inserted.push(values);
          return { error: options.error ?? null };
        },
      };
    },
  };
  return { client, inserted };
}

describe("recordAuditLog", () => {
  it("inserta actor, acción, entidad y before/after", async () => {
    const { client, inserted } = makeFakeClient();

    await recordAuditLog(client as never, {
      actorId: "user-1",
      action: "order.paid",
      entity: "order",
      entityId: "order-1",
      before: { status: "pending_payment" },
      after: { status: "paid" },
    });

    expect(inserted[0]).toMatchObject({
      actor_id: "user-1",
      action: "order.paid",
      entity: "order",
      entity_id: "order-1",
      before: { status: "pending_payment" },
      after: { status: "paid" },
    });
  });

  it("acepta actor_id null (eventos del sistema, sin usuario detrás)", async () => {
    const { client, inserted } = makeFakeClient();

    await recordAuditLog(client as never, { actorId: null, action: "order.paid", entity: "order", entityId: "order-1" });

    expect(inserted[0]).toMatchObject({ actor_id: null, before: null, after: null });
  });

  it("propaga un error si la base rechaza el insert", async () => {
    const { client } = makeFakeClient({ error: { message: "denied" } });

    await expect(
      recordAuditLog(client as never, { actorId: "user-1", action: "order.paid", entity: "order", entityId: "order-1" }),
    ).rejects.toThrow("No se pudo registrar la auditoría.");
  });
});
