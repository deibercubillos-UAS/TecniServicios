import { describe, expect, it } from "vitest";

import { completeMaintenance } from "./complete-maintenance";

function makeFakeClient(options: { reportError?: unknown; updateError?: unknown } = {}) {
  const insertedReports: Record<string, unknown>[] = [];
  const updates: Record<string, unknown>[] = [];
  const client = {
    from(table: string) {
      if (table === "maintenance_reports") {
        return {
          insert: (values: Record<string, unknown>) => ({
            select: () => ({
              single: async () => {
                insertedReports.push(values);
                return options.reportError ? { data: null, error: options.reportError } : { data: { id: "report-1" }, error: null };
              },
            }),
          }),
        };
      }
      if (table === "maintenance_requests") {
        return {
          update: (values: Record<string, unknown>) => ({
            eq: async () => {
              updates.push(values);
              return { error: options.updateError ?? null };
            },
          }),
        };
      }
      throw new Error(`tabla inesperada: ${table}`);
    },
  };
  return { client, insertedReports, updates };
}

describe("completeMaintenance", () => {
  it("registra el reporte y marca la solicitud completed", async () => {
    const { client, insertedReports, updates } = makeFakeClient();

    const result = await completeMaintenance(
      client as never,
      { requestId: "request-1", workDone: "Cambio de rodamientos", recommendations: "Revisar en 6 meses" },
      { technicianId: "tech-1" },
    );

    expect(result.reportId).toBe("report-1");
    expect(insertedReports[0]).toMatchObject({ request_id: "request-1", technician_id: "tech-1", work_done: "Cambio de rodamientos" });
    expect(updates[0]).toMatchObject({ status: "completed" });
  });

  it("propaga un error si el insert del reporte falla (p. ej. técnico ajeno)", async () => {
    const { client, updates } = makeFakeClient({ reportError: { message: "denied" } });

    await expect(
      completeMaintenance(client as never, { requestId: "request-1", workDone: "x" }, { technicianId: "tech-1" }),
    ).rejects.toThrow("No se pudo registrar el reporte de mantenimiento.");
    expect(updates).toHaveLength(0);
  });

  it("avisa si el reporte se guardó pero no se pudo marcar completado", async () => {
    const { client } = makeFakeClient({ updateError: { message: "denied" } });

    await expect(
      completeMaintenance(client as never, { requestId: "request-1", workDone: "x" }, { technicianId: "tech-1" }),
    ).rejects.toThrow("El reporte se guardó, pero no se pudo marcar el mantenimiento como completado.");
  });
});
