import { describe, expect, it } from "vitest";

import { requestMaintenance } from "./request-maintenance";

function makeFakeClient(
  options: {
    error?: unknown;
    availability?: { max_visits: number } | null;
    availabilityRows?: { max_visits: number }[];
    bookedCount?: number;
  } = {},
) {
  const inserted: Record<string, unknown>[] = [];
  const availabilityRows = options.availabilityRows ?? (options.availability ? [options.availability] : []);
  const client = {
    from(table: string) {
      if (table === "maintenance_availability") {
        return {
          select: () => ({
            eq: async () => ({ data: availabilityRows, error: null }),
          }),
        };
      }
      if (table === "maintenance_requests") {
        return {
          select: () => ({
            eq: () => ({
              neq: async () => ({ count: options.bookedCount ?? 0, error: null }),
            }),
          }),
          insert: (values: Record<string, unknown>) => ({
            select: () => ({
              single: async () => {
                inserted.push(values);
                return options.error ? { data: null, error: options.error } : { data: { id: "request-1" }, error: null };
              },
            }),
          }),
        };
      }
      throw new Error(`tabla inesperada: ${table}`);
    },
  };
  return { client, inserted };
}

describe("requestMaintenance", () => {
  it("crea la solicitud con el equipo, la empresa y quien la pide, sin fecha preferida", async () => {
    const { client, inserted } = makeFakeClient();

    const result = await requestMaintenance(
      client as never,
      { equipmentId: "equipment-1", description: "Ruido en el motor" },
      { companyId: "company-1", userId: "customer-1" },
    );

    expect(result.requestId).toBe("request-1");
    expect(inserted[0]).toMatchObject({
      company_id: "company-1",
      equipment_id: "equipment-1",
      requested_by: "customer-1",
      preferred_date: null,
      description: "Ruido en el motor",
    });
  });

  it("acepta una fecha preferida que master abrió y todavía tiene cupo", async () => {
    const { client, inserted } = makeFakeClient({ availability: { max_visits: 2 }, bookedCount: 1 });

    await requestMaintenance(
      client as never,
      { equipmentId: "equipment-1", preferredDate: "2026-09-01" },
      { companyId: "company-1", userId: "customer-1" },
    );

    expect(inserted[0]).toMatchObject({ preferred_date: "2026-09-01" });
  });

  it("rechaza una fecha que master no abrió", async () => {
    const { client } = makeFakeClient({ availability: null });

    await expect(
      requestMaintenance(
        client as never,
        { equipmentId: "equipment-1", preferredDate: "2026-09-01" },
        { companyId: "company-1", userId: "customer-1" },
      ),
    ).rejects.toThrow("Esa fecha no está disponible para agendar.");
  });

  it("suma el cupo de varias filas de la misma fecha (una por técnico)", async () => {
    const { client, inserted } = makeFakeClient({ availabilityRows: [{ max_visits: 2 }, { max_visits: 1 }], bookedCount: 2 });

    await requestMaintenance(
      client as never,
      { equipmentId: "equipment-1", preferredDate: "2026-09-01" },
      { companyId: "company-1", userId: "customer-1" },
    );

    expect(inserted[0]).toMatchObject({ preferred_date: "2026-09-01" });
  });

  it("rechaza una fecha abierta pero sin cupo restante", async () => {
    const { client } = makeFakeClient({ availability: { max_visits: 2 }, bookedCount: 2 });

    await expect(
      requestMaintenance(
        client as never,
        { equipmentId: "equipment-1", preferredDate: "2026-09-01" },
        { companyId: "company-1", userId: "customer-1" },
      ),
    ).rejects.toThrow("Esa fecha ya no tiene cupo disponible.");
  });

  it("acepta descripción opcional y fecha ausente", async () => {
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
