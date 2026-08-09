import { describe, expect, it } from "vitest";

import { requestMaintenance } from "./request-maintenance";

function makeFakeClient(options: { error?: unknown } = {}) {
  const inserted: Record<string, unknown>[] = [];
  const client = {
    from(table: string) {
      if (table !== "maintenance_requests") throw new Error(`tabla inesperada: ${table}`);
      return {
        insert: (values: Record<string, unknown>) => ({
          select: () => ({
            single: async () => {
              inserted.push(values);
              return options.error ? { data: null, error: options.error } : { data: { id: "request-1" }, error: null };
            },
          }),
        }),
      };
    },
  };
  return { client, inserted };
}

describe("requestMaintenance", () => {
  it("crea la solicitud con el equipo, la empresa y quien la pide", async () => {
    const { client, inserted } = makeFakeClient();

    const result = await requestMaintenance(
      client as never,
      { equipmentId: "equipment-1", preferredDate: "2026-09-01", description: "Ruido en el motor" },
      { companyId: "company-1", userId: "customer-1" },
    );

    expect(result.requestId).toBe("request-1");
    expect(inserted[0]).toMatchObject({
      company_id: "company-1",
      equipment_id: "equipment-1",
      requested_by: "customer-1",
      preferred_date: "2026-09-01",
      description: "Ruido en el motor",
    });
  });

  it("acepta fecha y descripción opcionales", async () => {
    const { client, inserted } = makeFakeClient();

    await requestMaintenance(client as never, { equipmentId: "equipment-1" }, { companyId: "company-1", userId: "customer-1" });

    expect(inserted[0]).toMatchObject({ preferred_date: null, description: null });
  });

  it("propaga un error si la base rechaza el insert (p. ej. RLS por equipo ajeno)", async () => {
    const { client } = makeFakeClient({ error: { message: "denied" } });

    await expect(
      requestMaintenance(client as never, { equipmentId: "equipment-ajeno" }, { companyId: "company-1", userId: "customer-1" }),
    ).rejects.toThrow("No se pudo solicitar el mantenimiento.");
  });
});
