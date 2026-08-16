import { describe, expect, it } from "vitest";

import { setMaintenanceInterval } from "./set-maintenance-interval";

function makeFakeClient(options: { deliveredAt?: string | null; lastCompletedAt?: string | null; updateError?: unknown } = {}) {
  const updates: Record<string, unknown>[] = [];
  const client = {
    from(table: string) {
      if (table !== "owned_equipment") throw new Error(`tabla inesperada: ${table}`);
      return {
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({
              data: { delivered_at: options.deliveredAt ?? "2026-01-10", last_maintenance_completed_at: options.lastCompletedAt ?? null },
              error: null,
            }),
          }),
        }),
        update: (values: Record<string, unknown>) => ({
          eq: async () => {
            updates.push(values);
            return { error: options.updateError ?? null };
          },
        }),
      };
    },
  };
  return { client, updates };
}

describe("setMaintenanceInterval", () => {
  it("calcula next_maintenance_due_at desde delivered_at cuando no hay mantenimientos previos", async () => {
    const { client, updates } = makeFakeClient({ deliveredAt: "2026-01-10" });

    const result = await setMaintenanceInterval(client as never, "equipment-1", 6);

    expect(result.nextMaintenanceDueAt).toBe("2026-07-10");
    expect(updates[0]).toMatchObject({ maintenance_interval_months: 6, next_maintenance_due_at: "2026-07-10", maintenance_reminder_sent_for: null });
  });

  it("calcula desde last_maintenance_completed_at cuando ya hubo un mantenimiento", async () => {
    const { client, updates } = makeFakeClient({ deliveredAt: "2026-01-10", lastCompletedAt: "2026-06-01" });

    const result = await setMaintenanceInterval(client as never, "equipment-1", 3);

    expect(result.nextMaintenanceDueAt).toBe("2026-09-01");
    expect(updates[0]?.["next_maintenance_due_at"]).toBe("2026-09-01");
  });

  it("limpia el intervalo y la fecha cuando months es null", async () => {
    const { client, updates } = makeFakeClient();

    const result = await setMaintenanceInterval(client as never, "equipment-1", null);

    expect(result.nextMaintenanceDueAt).toBeNull();
    expect(updates[0]).toMatchObject({ maintenance_interval_months: null, next_maintenance_due_at: null });
  });

  it("rechaza un intervalo no positivo", async () => {
    const { client } = makeFakeClient();
    await expect(setMaintenanceInterval(client as never, "equipment-1", 0)).rejects.toThrow("El intervalo debe ser un número entero de meses mayor a cero, o vacío para desactivarlo.");
  });

  it("rechaza un intervalo no entero", async () => {
    const { client } = makeFakeClient();
    await expect(setMaintenanceInterval(client as never, "equipment-1", 1.5)).rejects.toThrow("El intervalo debe ser un número entero de meses mayor a cero, o vacío para desactivarlo.");
  });
});
