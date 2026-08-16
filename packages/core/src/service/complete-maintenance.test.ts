import { describe, expect, it } from "vitest";

import { completeMaintenance } from "./complete-maintenance";

function makeFakeClient(
  options: {
    reportError?: unknown;
    updateError?: unknown;
    equipmentId?: string | null;
    intervalMonths?: number | null;
  } = {},
) {
  const insertedReports: Record<string, unknown>[] = [];
  const requestUpdates: Record<string, unknown>[] = [];
  const equipmentUpdates: Record<string, unknown>[] = [];
  const equipmentId = options.equipmentId === undefined ? "equipment-1" : options.equipmentId;
  const intervalMonths = options.intervalMonths === undefined ? null : options.intervalMonths;

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
              requestUpdates.push(values);
              return { error: options.updateError ?? null };
            },
          }),
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: equipmentId ? { equipment_id: equipmentId } : null, error: null }),
            }),
          }),
        };
      }
      if (table === "owned_equipment") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: { maintenance_interval_months: intervalMonths }, error: null }),
            }),
          }),
          update: (values: Record<string, unknown>) => ({
            eq: async () => {
              equipmentUpdates.push(values);
              return { error: null };
            },
          }),
        };
      }
      throw new Error(`tabla inesperada: ${table}`);
    },
  };
  return { client, insertedReports, requestUpdates, equipmentUpdates };
}

describe("completeMaintenance", () => {
  it("registra el reporte y marca la solicitud completed", async () => {
    const { client, insertedReports, requestUpdates } = makeFakeClient();

    const result = await completeMaintenance(
      client as never,
      { requestId: "request-1", workDone: "Cambio de rodamientos", recommendations: "Revisar en 6 meses" },
      { technicianId: "tech-1" },
    );

    expect(result.reportId).toBe("report-1");
    expect(insertedReports[0]).toMatchObject({ request_id: "request-1", technician_id: "tech-1", work_done: "Cambio de rodamientos" });
    expect(requestUpdates[0]).toMatchObject({ status: "completed" });
  });

  it("propaga un error si el insert del reporte falla (p. ej. técnico ajeno)", async () => {
    const { client, requestUpdates } = makeFakeClient({ reportError: { message: "denied" } });

    await expect(
      completeMaintenance(client as never, { requestId: "request-1", workDone: "x" }, { technicianId: "tech-1" }),
    ).rejects.toThrow("No se pudo registrar el reporte de mantenimiento.");
    expect(requestUpdates).toHaveLength(0);
  });

  it("avisa si el reporte se guardó pero no se pudo marcar completado", async () => {
    const { client } = makeFakeClient({ updateError: { message: "denied" } });

    await expect(
      completeMaintenance(client as never, { requestId: "request-1", workDone: "x" }, { technicianId: "tech-1" }),
    ).rejects.toThrow("El reporte se guardó, pero no se pudo marcar el mantenimiento como completado.");
  });

  it("recalcula next_maintenance_due_at cuando el equipo tiene intervalo configurado", async () => {
    const { client, equipmentUpdates } = makeFakeClient({ intervalMonths: 6 });

    await completeMaintenance(client as never, { requestId: "request-1", workDone: "x" }, { technicianId: "tech-1" });

    expect(equipmentUpdates).toHaveLength(1);
    expect(equipmentUpdates[0]).toMatchObject({ maintenance_reminder_sent_for: null });
    expect(equipmentUpdates[0]?.["last_maintenance_completed_at"]).toEqual(expect.any(String));
    expect(equipmentUpdates[0]?.["next_maintenance_due_at"]).toEqual(expect.any(String));
  });

  it("no toca owned_equipment si el equipo no tiene intervalo configurado", async () => {
    const { client, equipmentUpdates } = makeFakeClient({ intervalMonths: null });

    await completeMaintenance(client as never, { requestId: "request-1", workDone: "x" }, { technicianId: "tech-1" });

    expect(equipmentUpdates).toHaveLength(0);
  });
});
