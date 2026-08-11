import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@tecni/db";
import { formatCop, serverEnv } from "@tecni/shared";
import { Icon } from "@tecni/ui";

import { StatusBadge } from "@/components/status-badge";
import { QUOTE_STATUS_LABEL, QUOTE_STATUS_ORDER, QUOTE_STATUS_TONE } from "@/lib/quote-status";
import { acceptQuoteAction } from "./actions";

export const metadata: Metadata = {
  title: "Mis cotizaciones",
};

interface QuoteRow {
  id: string;
  status: string;
  siigo_number: string | null;
  subtotal_cop: number | null;
  tax_cop: number | null;
  total_cop: number | null;
  created_at: string;
}

interface QuoteItemRow {
  quote_id: string;
  description: string;
  quantity: number;
  unit_price_cop: number;
  total_cop: number;
}

async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(serverEnv.NEXT_PUBLIC_SUPABASE_URL, serverEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    getAll: () => cookieStore.getAll(),
    setAll: () => {},
  });
}

export default async function CotizacionesPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string; accepted?: string; error?: string; status?: string }>;
}) {
  const { created, accepted, error, status: statusFilter } = await searchParams;
  const supabase = await getSupabase();

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    redirect("/login?next=/cotizaciones");
  }

  const { data: quotesData } = await supabase
    .from("quotes")
    .select("id,status,siigo_number,subtotal_cop,tax_cop,total_cop,created_at")
    .order("created_at", { ascending: false });
  const quotes = (quotesData as QuoteRow[] | null) ?? [];

  const quoteIds = quotes.map((q) => q.id);
  const { data: itemsData } =
    quoteIds.length > 0
      ? await supabase
          .from("quote_items")
          .select("quote_id,description,quantity,unit_price_cop,total_cop")
          .in("quote_id", quoteIds)
      : { data: [] as QuoteItemRow[] };
  const itemsByQuote = new Map<string, QuoteItemRow[]>();
  for (const item of (itemsData as QuoteItemRow[] | null) ?? []) {
    const list = itemsByQuote.get(item.quote_id) ?? [];
    list.push(item);
    itemsByQuote.set(item.quote_id, list);
  }

  const countByStatus = new Map<string, number>();
  for (const quote of quotes) {
    countByStatus.set(quote.status, (countByStatus.get(quote.status) ?? 0) + 1);
  }
  const presentStatuses = QUOTE_STATUS_ORDER.filter((status) => countByStatus.has(status));
  const filteredQuotes = statusFilter ? quotes.filter((quote) => quote.status === statusFilter) : quotes;

  return (
    <div className="mx-auto flex max-w-[900px] flex-col gap-6 px-4 py-12 sm:py-16">
      <div>
        <h1 className="text-2xl font-bold text-text">Mis cotizaciones</h1>
        <p className="text-sm text-text-muted">{quotes.length} en total.</p>
      </div>

      {created ? (
        <p className="flex items-center gap-2 rounded-[var(--radius)] border border-success bg-success/10 px-3 py-2 text-sm text-success">
          <Icon name="checkCircle" size={16} />
          Cotización solicitada. Un vendedor la va a procesar.
        </p>
      ) : null}
      {accepted ? (
        <p className="flex items-center gap-2 rounded-[var(--radius)] border border-success bg-success/10 px-3 py-2 text-sm text-success">
          <Icon name="checkCircle" size={16} />
          Cotización aceptada — se creó tu pedido.
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="flex items-center gap-2 rounded-[var(--radius)] border border-danger bg-danger/10 px-3 py-2 text-sm text-danger">
          <Icon name="close" size={16} />
          {error}
        </p>
      ) : null}

      {presentStatuses.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          <Link
            href="/cotizaciones"
            aria-current={!statusFilter ? "page" : undefined}
            className={`rounded-full border px-4 py-2 text-xs font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
              !statusFilter ? "border-text bg-text text-text-inverse" : "border-border text-text-muted hover:border-text hover:text-text"
            }`}
          >
            Todas ({quotes.length})
          </Link>
          {presentStatuses.map((status) => (
            <Link
              key={status}
              href={`/cotizaciones?status=${status}`}
              aria-current={statusFilter === status ? "page" : undefined}
              className={`rounded-full border px-4 py-2 text-xs font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
                statusFilter === status ? "border-text bg-text text-text-inverse" : "border-border text-text-muted hover:border-text hover:text-text"
              }`}
            >
              {QUOTE_STATUS_LABEL[status] ?? status} ({countByStatus.get(status)})
            </Link>
          ))}
        </div>
      ) : null}

      {quotes.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-bg-alt px-6 py-16 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-subtle text-brand">
            <Icon name="handshake" size={26} />
          </span>
          <p className="font-semibold text-text">Todavía no has solicitado ninguna cotización</p>
          <p className="text-sm text-text-muted">Los equipos de mayor valor se compran por cotización asistida.</p>
          <Link
            href="/catalogo"
            className="mt-2 rounded-[var(--radius)] bg-brand px-5 py-2.5 text-sm font-semibold text-text-inverse transition-colors hover:bg-brand-hover"
          >
            Ver catálogo
          </Link>
        </div>
      ) : filteredQuotes.length === 0 ? (
        <p className="text-text-muted">No hay cotizaciones con este estado.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {filteredQuotes.map((quote) => {
            const items = itemsByQuote.get(quote.id) ?? [];
            const tone = QUOTE_STATUS_TONE[quote.status] ?? { tone: "muted" as const, icon: "clock" as const };
            return (
              <section
                key={quote.id}
                className="overflow-hidden rounded-xl border border-border bg-surface transition-shadow duration-150 hover:shadow-md"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-bg-alt px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-subtle text-brand">
                      <Icon name="handshake" size={16} />
                    </span>
                    <div>
                      <span className="font-semibold text-text">
                        {quote.siigo_number ? `Cotización ${quote.siigo_number}` : "Cotización sin número aún"}
                      </span>
                      <p className="text-xs text-text-muted">Solicitada el {new Date(quote.created_at).toLocaleDateString("es-CO")}</p>
                    </div>
                  </div>
                  <StatusBadge label={QUOTE_STATUS_LABEL[quote.status] ?? quote.status} tone={tone.tone} icon={tone.icon} />
                </div>
                {items.length > 0 ? (
                  <ul className="divide-y divide-border">
                    {items.map((item, index) => (
                      <li key={`${quote.id}-${index}`} className="flex items-center justify-between gap-4 px-4 py-2 text-sm">
                        <span className="text-text">
                          {item.description} × {item.quantity}
                        </span>
                        <span className="tabular-nums text-text-muted">{formatCop(item.total_cop)}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3">
                  <p className="font-bold tabular-nums text-text">
                    Total: {quote.total_cop !== null ? formatCop(quote.total_cop) : "Por confirmar"}
                  </p>
                  {quote.status === "sent" ? (
                    <form action={acceptQuoteAction}>
                      <input type="hidden" name="quoteId" value={quote.id} />
                      <button
                        type="submit"
                        className="flex items-center gap-2 rounded-[var(--radius)] bg-brand px-5 py-2.5 text-sm font-semibold text-text-inverse transition-colors hover:bg-brand-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                      >
                        <Icon name="checkCircle" size={16} />
                        Aceptar cotización
                      </button>
                    </form>
                  ) : null}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
