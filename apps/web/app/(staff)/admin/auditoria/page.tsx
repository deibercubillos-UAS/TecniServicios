import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { createServerClient } from "@tecni/db";
import { serverEnv } from "@tecni/shared";
import { Icon } from "@tecni/ui";

import { AUDIT_ACTION_LABEL, AUDIT_ENTITY_LABEL, auditActionIcon, auditActionLabel, auditEntityLabel } from "@/lib/audit-labels";

export const metadata: Metadata = {
  title: "Auditoría — Panel maestro",
};

const PAGE_SIZE = 50;

interface AuditLogRow {
  id: number;
  actor_id: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  before: unknown;
  after: unknown;
  created_at: string;
  profiles: { full_name: string } | null;
}

async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(serverEnv.NEXT_PUBLIC_SUPABASE_URL, serverEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    getAll: () => cookieStore.getAll(),
    setAll: () => {},
  });
}

function buildPageHref(current: Record<string, string | undefined>, page: number): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(current)) {
    if (value) params.set(key, value);
  }
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/admin/auditoria?${query}` : "/admin/auditoria";
}

export default async function AdminAuditoriaPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string; entity?: string; actorId?: string; from?: string; to?: string; page?: string }>;
}) {
  const { action, entity, actorId, from, to, page: pageRaw } = await searchParams;
  const page = Math.max(1, Number.parseInt(pageRaw ?? "1", 10) || 1);
  const supabase = await getSupabase();

  // Actores reales que aparecen en el log (no todo `profiles`) — así el
  // filtro nunca ofrece a alguien que jamás disparó una acción auditada.
  const { data: actorRows } = await supabase
    .from("audit_log")
    .select("actor_id,profiles(full_name)")
    .not("actor_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(1000);
  const actorNameById = new Map<string, string>();
  for (const row of (actorRows as unknown as { actor_id: string; profiles: { full_name: string } | null }[] | null) ?? []) {
    if (!actorNameById.has(row.actor_id)) actorNameById.set(row.actor_id, row.profiles?.full_name ?? row.actor_id);
  }
  const actors = [...actorNameById.entries()].sort((a, b) => a[1].localeCompare(b[1], "es"));

  let query = supabase
    .from("audit_log")
    .select("id,actor_id,action,entity,entity_id,before,after,created_at,profiles(full_name)", { count: "exact" })
    .order("created_at", { ascending: false });
  if (action) query = query.eq("action", action);
  if (entity) query = query.eq("entity", entity);
  if (actorId) query = query.eq("actor_id", actorId);
  if (from) query = query.gte("created_at", new Date(from).toISOString());
  if (to) query = query.lte("created_at", new Date(to).toISOString());
  query = query.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  const { data: logsData, count } = await query;
  const logs = (logsData as unknown as AuditLogRow[] | null) ?? [];
  const totalCount = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const currentFilters = { action, entity, actorId, from, to };
  const hasFilters = Boolean(action || entity || actorId || from || to);

  return (
    <div className="mx-auto flex max-w-[1000px] flex-col gap-6 px-4 py-16">
      <div>
        <h1 className="text-2xl font-bold text-text">Auditoría</h1>
        <p className="text-sm text-text-muted">
          {totalCount} registro{totalCount === 1 ? "" : "s"} — de solo lectura, nadie edita ni borra una fila (regla de oro 8).
        </p>
      </div>

      <section className="rounded-xl border border-border bg-surface p-5">
        <h2 className="mb-4 flex items-center gap-2 font-bold text-text">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-subtle text-brand">
            <Icon name="sliders" size={16} />
          </span>
          Filtros
        </h2>
        <form className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor="action" className="text-xs font-medium text-text-muted">
              Acción
            </label>
            <select
              id="action"
              name="action"
              defaultValue={action ?? ""}
              className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2 text-sm focus:border-brand focus:outline-none"
            >
              <option value="">Todas</option>
              {Object.entries(AUDIT_ACTION_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="entity" className="text-xs font-medium text-text-muted">
              Entidad
            </label>
            <select
              id="entity"
              name="entity"
              defaultValue={entity ?? ""}
              className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2 text-sm focus:border-brand focus:outline-none"
            >
              <option value="">Todas</option>
              {Object.entries(AUDIT_ENTITY_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="actorId" className="text-xs font-medium text-text-muted">
              Quién
            </label>
            <select
              id="actorId"
              name="actorId"
              defaultValue={actorId ?? ""}
              className="max-w-[200px] rounded-[var(--radius)] border border-border bg-bg px-3 py-2 text-sm focus:border-brand focus:outline-none"
            >
              <option value="">Todos</option>
              {actors.map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="from" className="text-xs font-medium text-text-muted">
              Desde
            </label>
            <input
              id="from"
              name="from"
              type="datetime-local"
              defaultValue={from ?? ""}
              className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2 text-sm focus:border-brand focus:outline-none"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="to" className="text-xs font-medium text-text-muted">
              Hasta
            </label>
            <input
              id="to"
              name="to"
              type="datetime-local"
              defaultValue={to ?? ""}
              className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2 text-sm focus:border-brand focus:outline-none"
            />
          </div>

          <button type="submit" className="rounded-[var(--radius)] bg-brand px-4 py-2 text-sm font-semibold text-text-inverse transition-colors hover:bg-brand-hover">
            Filtrar
          </button>
          {hasFilters ? (
            <Link href="/admin/auditoria" className="text-sm text-brand hover:underline">
              Limpiar
            </Link>
          ) : null}
        </form>
      </section>

      {logs.length === 0 ? (
        <p className="rounded-[var(--radius)] border border-dashed border-border bg-bg-alt px-4 py-6 text-center text-sm text-text-muted">
          Sin registros para este filtro.
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-border rounded-xl border border-border bg-surface">
          {logs.map((log) => (
            <li key={log.id} className="flex flex-col gap-2 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-subtle text-brand">
                    <Icon name={auditActionIcon(log.action)} size={14} />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-text">{auditActionLabel(log.action)}</p>
                    <p className="text-xs text-text-muted">
                      {auditEntityLabel(log.entity)}
                      {log.entity_id ? ` · ${log.entity_id}` : ""}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-text">{log.profiles?.full_name ?? "(sistema)"}</p>
                  <p className="text-xs text-text-muted">{new Date(log.created_at).toLocaleString("es-CO")}</p>
                </div>
              </div>

              {log.before || log.after ? (
                <details className="text-xs text-text-muted">
                  <summary className="cursor-pointer select-none text-brand hover:underline">Ver detalle</summary>
                  <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {log.before ? (
                      <div>
                        <p className="mb-1 font-medium text-text-muted">Antes</p>
                        <pre className="overflow-x-auto rounded-[var(--radius)] bg-bg-alt p-2">{JSON.stringify(log.before, null, 2)}</pre>
                      </div>
                    ) : null}
                    {log.after ? (
                      <div>
                        <p className="mb-1 font-medium text-text-muted">Después</p>
                        <pre className="overflow-x-auto rounded-[var(--radius)] bg-bg-alt p-2">{JSON.stringify(log.after, null, 2)}</pre>
                      </div>
                    ) : null}
                  </div>
                </details>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {totalPages > 1 ? (
        <div className="flex items-center justify-between gap-3 text-sm text-text-muted">
          <span>
            Página {page} de {totalPages}
          </span>
          <div className="flex gap-2">
            {page > 1 ? (
              <Link href={buildPageHref(currentFilters, page - 1)} className="rounded-[var(--radius)] border border-border px-3 py-1.5 hover:border-brand hover:text-text">
                Anterior
              </Link>
            ) : null}
            {page < totalPages ? (
              <Link href={buildPageHref(currentFilters, page + 1)} className="rounded-[var(--radius)] border border-border px-3 py-1.5 hover:border-brand hover:text-text">
                Siguiente
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
