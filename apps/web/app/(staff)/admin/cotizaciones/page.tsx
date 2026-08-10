import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { createServerClient } from "@tecni/db";
import { formatCop, serverEnv } from "@tecni/shared";
import { Icon } from "@tecni/ui";

import { StatusBadge } from "@/components/status-badge";
import { QUOTE_STATUS_LABEL, QUOTE_STATUS_ORDER, QUOTE_STATUS_TONE } from "@/lib/quote-status";

export const metadata: Metadata = {
  title: "Cotizaciones — Panel maestro",
};

interface QuoteRow {
  id: string;
  status: string;
  siigo_number: string | null;
  total_cop: number | null;
  created_at: string;
  companies: { legal_name: string } | null;
}

async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(serverEnv.NEXT_PUBLIC_SUPABASE_URL, serverEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    getAll: () => cookieStore.getAll(),
    setAll: () => {},
  });
}

export default async function AdminCotizacionesPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status: statusFilter } = await searchParams;
  const supabase = await getSupabase();

  // Middleware ya exige master en /admin — master ve todas las
  // cotizaciones por RLS (docs/05-RLS-SECURITY-A.md), sin filtro de alcance.
  const { data: quotesData } = await supabase
    .from("quotes")
    .select("id,status,siigo_number,total_cop,created_at,companies(legal_name)")
    .order("created_at", { ascending: false });
  const quotes = (quotesData as unknown as QuoteRow[] | null) ?? [];

  const countByStatus = new Map<string, number>();
  for (const quote of quotes) {
    countByStatus.set(quote.status, (countByStatus.get(quote.status) ?? 0) + 1);
  }
  const acceptedValue = quotes.filter((q) => q.status === "accepted").reduce((sum, q) => sum + (q.total_cop ?? 0), 0);
  const filteredQuotes = statusFilter ? quotes.filter((q) => q.status === statusFilter) : quotes;

  return (
    <div className="mx-auto flex max-w-[1000px] flex-col gap-6 px-4 py-12 sm:py-16">
      <div>
        <h1 className="text-2xl font-bold text-text">Cotizaciones</h1>
        <p className="text-sm text-text-muted">
          {quotes.length} en total · {formatCop(acceptedValue)} en cotizaciones aceptadas.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {QUOTE_STATUS_ORDER.map((status) => {
          const tone = QUOTE_STATUS_TONE[status] ?? { tone: "muted" as const, icon: "clock" as const };
          const count = countByStatus.get(status) ?? 0;
          return (
            <Link
              key={status}
              href={`/admin/cotizaciones?status=${status}`}
              aria-current={statusFilter === status ? "page" : undefined}
              className={`group flex flex-col gap-2 rounded-xl border p-4 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
                statusFilter === status ? "border-brand bg-brand-subtle" : "border-border bg-surface hover:border-brand"
              }`}
            >
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-lg transition-transform duration-150 group-hover:scale-110 ${
                  tone.tone === "warning"
                    ? "bg-warning/15 text-warning"
                    : tone.tone === "success"
                      ? "bg-success/15 text-success"
                      : tone.tone === "danger"
                        ? "bg-danger/15 text-danger"
                        : "bg-brand-subtle text-brand"
                }`}
              >
                <Icon name={tone.icon} size={16} />
              </span>
              <div>
                <span className="block text-2xl font-extrabold tabular-nums text-text">{count}</span>
                <span className="text-xs text-text-muted">{QUOTE_STATUS_LABEL[status]}</span>
              </div>
            </Link>
          );
        })}
      </div>

      {statusFilter ? (
        <Link href="/admin/cotizaciones" className="w-fit text-sm font-medium text-brand hover:underline">
          Quitar filtro — ver todas
        </Link>
      ) : null}

      {filteredQuotes.length === 0 ? (
        <p className="text-sm text-text-muted">No hay cotizaciones con este estado.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {filteredQuotes.map((quote) => {
            const tone = QUOTE_STATUS_TONE[quote.status] ?? { tone: "muted" as const, icon: "clock" as const };
            return (
              <li key={quote.id}>
                <Link
                  href="/cotizaciones"
                  className="group flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface p-4 transition-all duration-150 hover:-translate-y-0.5 hover:border-brand hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-subtle text-brand">
                      <Icon name="handshake" size={18} />
                    </span>
                    <div>
                      <span className="font-semibold text-text group-hover:text-brand">
                        {quote.siigo_number ? `Cotización ${quote.siigo_number}` : "Cotización sin número aún"}
                      </span>
                      <p className="text-xs text-text-muted">
                        {quote.companies?.legal_name ?? "—"} · {new Date(quote.created_at).toLocaleDateString("es-CO")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-semibold tabular-nums text-text">
                      {quote.total_cop !== null ? formatCop(quote.total_cop) : "Por confirmar"}
                    </span>
                    <StatusBadge label={QUOTE_STATUS_LABEL[quote.status] ?? quote.status} tone={tone.tone} icon={tone.icon} />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
