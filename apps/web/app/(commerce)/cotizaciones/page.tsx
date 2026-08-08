import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@tecni/db";
import { formatCop, serverEnv } from "@tecni/shared";

import { acceptQuoteAction } from "./actions";

export const metadata: Metadata = {
  title: "Mis cotizaciones — Tecni Equipos y Servicios SAS",
};

const STATUS_LABEL: Record<string, string> = {
  requested: "Solicitada",
  in_progress: "En proceso",
  sent: "Enviada",
  accepted: "Aceptada",
  rejected: "Rechazada",
  expired: "Vencida",
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
  searchParams: Promise<{ created?: string; accepted?: string; error?: string }>;
}) {
  const { created, accepted, error } = await searchParams;
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

  return (
    <div className="mx-auto flex max-w-[900px] flex-col gap-6 px-4 py-16">
      <h1 className="text-2xl font-bold text-text">Mis cotizaciones</h1>

      {created ? (
        <p className="rounded-[var(--radius)] border border-success bg-success/10 px-3 py-2 text-sm text-success">
          Cotización solicitada. Un vendedor la va a procesar.
        </p>
      ) : null}
      {accepted ? (
        <p className="rounded-[var(--radius)] border border-success bg-success/10 px-3 py-2 text-sm text-success">
          Cotización aceptada — se creó tu pedido.
        </p>
      ) : null}
      {error ? (
        <p className="rounded-[var(--radius)] border border-danger bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>
      ) : null}

      {quotes.length === 0 ? (
        <p className="text-text-muted">Todavía no has solicitado ninguna cotización.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {quotes.map((quote) => {
            const items = itemsByQuote.get(quote.id) ?? [];
            return (
              <section key={quote.id} className="rounded-lg border border-border">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-bg-alt px-4 py-3">
                  <div>
                    <span className="font-semibold text-text">
                      {quote.siigo_number ? `Cotización ${quote.siigo_number}` : "Cotización sin número aún"}
                    </span>
                    <p className="text-xs text-text-muted">
                      Solicitada el {new Date(quote.created_at).toLocaleDateString("es-CO")}
                    </p>
                  </div>
                  <span className="rounded-full border border-border px-3 py-1 text-xs font-medium text-text">
                    {STATUS_LABEL[quote.status] ?? quote.status}
                  </span>
                </div>
                <ul className="divide-y divide-border">
                  {items.map((item, index) => (
                    <li key={`${quote.id}-${index}`} className="flex items-center justify-between gap-4 px-4 py-2 text-sm">
                      <span className="text-text">
                        {item.description} × {item.quantity}
                      </span>
                      <span className="text-text-muted">{formatCop(item.total_cop)}</span>
                    </li>
                  ))}
                </ul>
                <div className="flex items-center justify-between border-t border-border px-4 py-3">
                  <p className="font-semibold text-text">
                    Total: {quote.total_cop !== null ? formatCop(quote.total_cop) : "Por confirmar"}
                  </p>
                  {quote.status === "sent" ? (
                    <form action={acceptQuoteAction}>
                      <input type="hidden" name="quoteId" value={quote.id} />
                      <button
                        type="submit"
                        className="rounded-[var(--radius)] bg-brand px-4 py-2 text-sm font-semibold text-text-inverse transition-colors hover:bg-brand-hover"
                      >
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
