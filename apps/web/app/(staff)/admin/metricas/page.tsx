import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { createServerClient } from "@tecni/db";
import { serverEnv } from "@tecni/shared";
import { getDashboardMetrics } from "@tecni/core";
import { Icon } from "@tecni/ui";

import { DepartmentCityField } from "@/components/department-city-field";
import { MetricStatusBreakdown } from "@/components/metric-status-breakdown";
import { MAINTENANCE_STATUS_LABEL } from "@/lib/maintenance-status";
import { ORDER_STATUS_LABEL } from "@/lib/order-status";
import { QUOTE_STATUS_LABEL } from "@/lib/quote-status";
import { TICKET_STATUS_LABEL } from "@/lib/ticket-status";

export const metadata: Metadata = {
  title: "Métricas — Panel maestro",
};

interface SellerRow {
  id: string;
  full_name: string | null;
}

async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(serverEnv.NEXT_PUBLIC_SUPABASE_URL, serverEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    getAll: () => cookieStore.getAll(),
    setAll: () => {},
  });
}

const money = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
const percent = (value: number) => `${Math.round(value * 100)}%`;

export default async function AdminMetricasPage({
  searchParams,
}: {
  searchParams: Promise<{ startDate?: string; endDate?: string; sellerId?: string; department?: string; city?: string }>;
}) {
  const { startDate, endDate, sellerId, department, city } = await searchParams;
  const supabase = await getSupabase();

  const { data: sellersData } = await supabase.from("profiles").select("id,full_name").eq("role", "seller").eq("is_active", true).order("full_name");
  const sellers = (sellersData as SellerRow[] | null) ?? [];

  const metrics = await getDashboardMetrics(supabase, {
    ...(startDate ? { startDate } : {}),
    ...(endDate ? { endDate } : {}),
    ...(sellerId ? { sellerId } : {}),
    ...(department ? { department } : {}),
    ...(city ? { city } : {}),
  });

  const hasFilters = Boolean(startDate || endDate || sellerId || department || city);

  return (
    <div className="mx-auto flex max-w-[1000px] flex-col gap-6 px-4 py-16">
      <div>
        <h1 className="text-2xl font-bold text-text">Métricas</h1>
        <p className="text-sm text-text-muted">Indicadores del negocio — filtra por fecha, vendedor, departamento o ciudad.</p>
      </div>

      <section className="rounded-xl border border-border bg-surface p-5">
        <h2 className="mb-4 flex items-center gap-2 font-bold text-text">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-subtle text-brand">
            <Icon name="sliders" size={16} />
          </span>
          Filtros
        </h2>
        <form className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label htmlFor="startDate" className="text-sm font-medium text-text-muted">
                Desde
              </label>
              <input
                id="startDate"
                name="startDate"
                type="date"
                defaultValue={startDate}
                className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2 text-sm focus:border-brand focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="endDate" className="text-sm font-medium text-text-muted">
                Hasta
              </label>
              <input
                id="endDate"
                name="endDate"
                type="date"
                defaultValue={endDate}
                className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2 text-sm focus:border-brand focus:outline-none"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="sellerId" className="text-sm font-medium text-text-muted">
              Vendedor (opcional)
            </label>
            <select
              id="sellerId"
              name="sellerId"
              defaultValue={sellerId ?? ""}
              className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2 text-sm focus:border-brand focus:outline-none"
            >
              <option value="">Todos</option>
              {sellers.map((seller) => (
                <option key={seller.id} value={seller.id}>
                  {seller.full_name ?? "(sin nombre)"}
                </option>
              ))}
            </select>
          </div>

          <DepartmentCityField idPrefix="metrics" defaultDepartment={department ?? ""} defaultCity={city ?? ""} />

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              className="rounded-[var(--radius)] bg-brand px-4 py-2 text-sm font-semibold text-text-inverse transition-colors hover:bg-brand-hover"
            >
              Aplicar filtros
            </button>
            {hasFilters ? (
              <Link href="/admin/metricas" className="text-sm text-brand hover:underline">
                Limpiar filtros
              </Link>
            ) : null}
          </div>
        </form>
      </section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-surface p-5">
          <p className="text-sm text-text-muted">Ingresos (pedidos no cancelados)</p>
          <p className="mt-1 text-2xl font-bold text-text">{money.format(metrics.revenueTotalCop)}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-5">
          <p className="text-sm text-text-muted">Ticket promedio</p>
          <p className="mt-1 text-2xl font-bold text-text">{money.format(metrics.avgOrderValueCop)}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-5">
          <p className="text-sm text-text-muted">Pedidos</p>
          <p className="mt-1 text-2xl font-bold text-text">{metrics.ordersCount}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-5">
          <p className="text-sm text-text-muted">Conversión de cotizaciones</p>
          <p className="mt-1 text-2xl font-bold text-text">
            {percent(metrics.quotesConversionRate)} <span className="text-sm font-normal text-text-muted">({metrics.quotesAcceptedCount}/{metrics.quotesCount})</span>
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-5">
          <p className="text-sm text-text-muted">Tickets abiertos</p>
          <p className="mt-1 text-2xl font-bold text-text">{metrics.ticketsOpenCount}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-5">
          <p className="text-sm text-text-muted">Mantenimientos pendientes</p>
          <p className="mt-1 text-2xl font-bold text-text">{metrics.maintenancePendingCount}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <section className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-5">
          <h2 className="flex items-center gap-2 font-bold text-text">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-subtle text-brand">
              <Icon name="truck" size={16} />
            </span>
            Pedidos por estado
          </h2>
          <MetricStatusBreakdown rows={metrics.ordersByStatus} labelMap={ORDER_STATUS_LABEL} showMoney />
        </section>

        <section className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-5">
          <h2 className="flex items-center gap-2 font-bold text-text">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-subtle text-brand">
              <Icon name="handshake" size={16} />
            </span>
            Cotizaciones por estado
          </h2>
          <MetricStatusBreakdown rows={metrics.quotesByStatus} labelMap={QUOTE_STATUS_LABEL} showMoney />
        </section>

        <section className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-5">
          <h2 className="flex items-center gap-2 font-bold text-text">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-subtle text-brand">
              <Icon name="chat" size={16} />
            </span>
            Tickets por estado
          </h2>
          <MetricStatusBreakdown rows={metrics.ticketsByStatus} labelMap={TICKET_STATUS_LABEL} />
        </section>

        <section className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-5">
          <h2 className="flex items-center gap-2 font-bold text-text">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-subtle text-brand">
              <Icon name="wrench" size={16} />
            </span>
            Mantenimientos por estado
          </h2>
          <MetricStatusBreakdown rows={metrics.maintenanceByStatus} labelMap={MAINTENANCE_STATUS_LABEL} />
        </section>
      </div>
    </div>
  );
}
