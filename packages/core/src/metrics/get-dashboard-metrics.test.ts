import { describe, expect, it } from "vitest";

import { getDashboardMetrics } from "./get-dashboard-metrics";

/** Query builder falso que soporta encadenar gte/lte/eq/in indefinidamente
 * y resuelve a `{ data }` al final (thenable) — suficiente para probar
 * `applyFilters` sin depender del cliente real de Supabase. */
function fakeQuery(data: unknown[]) {
  const builder = {
    gte: () => builder,
    lte: () => builder,
    eq: () => builder,
    in: () => builder,
    then: (resolve: (value: { data: unknown[] }) => void) => resolve({ data }),
  };
  return builder;
}

function fakeClient(tables: Record<string, unknown[]>) {
  return {
    from: (table: string) => ({
      select: () => fakeQuery(tables[table] ?? []),
    }),
  } as never;
}

describe("getDashboardMetrics", () => {
  it("suma ingresos excluyendo pedidos cancelados y agrupa por estado", async () => {
    const client = fakeClient({
      orders: [
        { status: "paid", total_cop: 1000 },
        { status: "delivered", total_cop: 2000 },
        { status: "cancelled", total_cop: 5000 },
      ],
      quotes: [],
      support_tickets: [],
      maintenance_requests: [],
    });

    const metrics = await getDashboardMetrics(client, {});

    expect(metrics.ordersCount).toBe(3);
    expect(metrics.revenueTotalCop).toBe(3000);
    expect(metrics.avgOrderValueCop).toBe(1500);
    expect(metrics.ordersByStatus).toHaveLength(3);
  });

  it("calcula la tasa de conversión de cotizaciones", async () => {
    const client = fakeClient({
      orders: [],
      quotes: [{ status: "accepted", total_cop: 100 }, { status: "requested", total_cop: 50 }, { status: "rejected", total_cop: 20 }],
      support_tickets: [],
      maintenance_requests: [],
    });

    const metrics = await getDashboardMetrics(client, {});

    expect(metrics.quotesCount).toBe(3);
    expect(metrics.quotesAcceptedCount).toBe(1);
    expect(metrics.quotesConversionRate).toBeCloseTo(1 / 3);
  });

  it("cuenta tickets abiertos y mantenimientos pendientes por estados conocidos", async () => {
    const client = fakeClient({
      orders: [],
      quotes: [],
      support_tickets: [{ status: "open" }, { status: "assigned" }, { status: "resolved" }],
      maintenance_requests: [{ status: "requested" }, { status: "completed" }, { status: "in_progress" }],
    });

    const metrics = await getDashboardMetrics(client, {});

    expect(metrics.ticketsCount).toBe(3);
    expect(metrics.ticketsOpenCount).toBe(2);
    expect(metrics.maintenanceCount).toBe(3);
    expect(metrics.maintenancePendingCount).toBe(2);
    expect(metrics.maintenanceCompletedCount).toBe(1);
  });

  it("no rompe con datasets vacíos (sin filtros aplicados)", async () => {
    const client = fakeClient({ orders: [], quotes: [], support_tickets: [], maintenance_requests: [] });

    const metrics = await getDashboardMetrics(client, { startDate: "2026-01-01", endDate: "2026-01-31", sellerId: "seller-1" });

    expect(metrics.revenueTotalCop).toBe(0);
    expect(metrics.avgOrderValueCop).toBe(0);
    expect(metrics.quotesConversionRate).toBe(0);
  });
});
