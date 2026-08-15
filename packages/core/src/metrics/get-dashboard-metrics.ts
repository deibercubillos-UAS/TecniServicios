import type { SupabaseClient } from "@supabase/supabase-js";

export interface DashboardMetricsFilters {
  /** Fecha ISO (`YYYY-MM-DD`), inclusiva, sobre `created_at` de cada tabla. */
  startDate?: string;
  endDate?: string;
  /** `orders.seller_id` / `quotes.seller_id` / `support_tickets.assigned_to`. */
  sellerId?: string;
  /** Filtra por empresas en esa ciudad/departamento (`companies.city`/`department`). */
  city?: string;
  department?: string;
}

export interface StatusCount {
  status: string;
  count: number;
  totalCop?: number;
}

export interface DashboardMetrics {
  ordersCount: number;
  revenueTotalCop: number;
  avgOrderValueCop: number;
  ordersByStatus: StatusCount[];
  quotesCount: number;
  quotesAcceptedCount: number;
  quotesConversionRate: number;
  quotesByStatus: StatusCount[];
  ticketsCount: number;
  ticketsOpenCount: number;
  ticketsByStatus: StatusCount[];
  maintenanceCount: number;
  maintenancePendingCount: number;
  maintenanceCompletedCount: number;
  maintenanceByStatus: StatusCount[];
}

const OPEN_TICKET_STATUSES = new Set(["open", "assigned", "waiting_customer"]);
const PENDING_MAINTENANCE_STATUSES = new Set(["requested", "confirmed", "rescheduled", "in_progress"]);

function groupByStatus(rows: { status: string; total_cop?: number | null }[]): StatusCount[] {
  const byStatus = new Map<string, { count: number; totalCop: number }>();
  for (const row of rows) {
    const entry = byStatus.get(row.status) ?? { count: 0, totalCop: 0 };
    entry.count += 1;
    entry.totalCop += Number(row.total_cop ?? 0);
    byStatus.set(row.status, entry);
  }
  return [...byStatus.entries()]
    .map(([status, { count, totalCop }]) => ({ status, count, totalCop }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Calcula las métricas del panel maestro (docs/tasks/ACTIVE-metricas.md)
 * a partir de filtros reales — nunca "todo el tiempo, sin excepción"
 * como antes. Ciudad/departamento filtran por empresa (`companies.city`/
 * `department`, texto libre, ver `apps/web/lib/colombia-geo.ts` para el
 * mismo criterio usado en mantenimientos); vendedor filtra por
 * `seller_id`/`assigned_to` según la tabla. Todo de solo lectura — RLS
 * ya limita esta pantalla a `master` (05-RLS-SECURITY-C.md).
 */
export async function getDashboardMetrics(client: SupabaseClient, filters: DashboardMetricsFilters): Promise<DashboardMetrics> {
  const { startDate, endDate, sellerId, city, department } = filters;

  let companyIds: string[] | null = null;
  if (city || department) {
    let companyQuery = client.from("companies").select("id");
    if (city) companyQuery = companyQuery.eq("city", city);
    if (department) companyQuery = companyQuery.eq("department", department);
    const { data } = await companyQuery;
    companyIds = ((data as { id: string }[] | null) ?? []).map((row) => row.id);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- el tipo exacto de un query builder de Supabase encadenado no se puede nombrar genéricamente acá
  function applyFilters(query: any, sellerColumn?: string) {
    let next = query;
    if (startDate) next = next.gte("created_at", `${startDate}T00:00:00`);
    if (endDate) next = next.lte("created_at", `${endDate}T23:59:59`);
    if (sellerId && sellerColumn) next = next.eq(sellerColumn, sellerId);
    if (companyIds !== null) next = next.in("company_id", companyIds.length > 0 ? companyIds : ["00000000-0000-0000-0000-000000000000"]);
    return next;
  }

  const [{ data: ordersData }, { data: quotesData }, { data: ticketsData }, { data: maintenanceData }] = await Promise.all([
    applyFilters(client.from("orders").select("status,total_cop"), "seller_id"),
    applyFilters(client.from("quotes").select("status,total_cop"), "seller_id"),
    applyFilters(client.from("support_tickets").select("status"), "assigned_to"),
    applyFilters(client.from("maintenance_requests").select("status")),
  ]);

  const orders = (ordersData as { status: string; total_cop: number }[] | null) ?? [];
  const revenueOrders = orders.filter((o) => o.status !== "cancelled");
  const revenueTotalCop = revenueOrders.reduce((sum, o) => sum + Number(o.total_cop), 0);

  const quotes = (quotesData as { status: string; total_cop: number | null }[] | null) ?? [];
  const quotesAcceptedCount = quotes.filter((q) => q.status === "accepted").length;

  const tickets = (ticketsData as { status: string }[] | null) ?? [];
  const maintenance = (maintenanceData as { status: string }[] | null) ?? [];

  return {
    ordersCount: orders.length,
    revenueTotalCop,
    avgOrderValueCop: revenueOrders.length > 0 ? revenueTotalCop / revenueOrders.length : 0,
    ordersByStatus: groupByStatus(orders),

    quotesCount: quotes.length,
    quotesAcceptedCount,
    quotesConversionRate: quotes.length > 0 ? quotesAcceptedCount / quotes.length : 0,
    quotesByStatus: groupByStatus(quotes),

    ticketsCount: tickets.length,
    ticketsOpenCount: tickets.filter((t) => OPEN_TICKET_STATUSES.has(t.status)).length,
    ticketsByStatus: groupByStatus(tickets),

    maintenanceCount: maintenance.length,
    maintenancePendingCount: maintenance.filter((m) => PENDING_MAINTENANCE_STATUSES.has(m.status)).length,
    maintenanceCompletedCount: maintenance.filter((m) => m.status === "completed").length,
    maintenanceByStatus: groupByStatus(maintenance),
  };
}
