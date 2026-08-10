import type { Metadata } from "next";
import { cookies } from "next/headers";
import { createServerClient } from "@tecni/db";
import { serverEnv } from "@tecni/shared";

import { auditActionLabel, auditEntityLabel } from "@/lib/audit-labels";

export const metadata: Metadata = {
  title: "Auditoría — Panel maestro",
};

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

export default async function AdminAuditoriaPage({
  searchParams,
}: {
  searchParams: Promise<{ entity?: string; actorId?: string; from?: string; to?: string }>;
}) {
  const { entity, actorId, from, to } = await searchParams;
  const supabase = await getSupabase();

  let query = supabase
    .from("audit_log")
    .select("id,actor_id,action,entity,entity_id,before,after,created_at,profiles(full_name)")
    .order("created_at", { ascending: false })
    .limit(100);
  if (entity && entity.trim().length > 0) {
    query = query.eq("entity", entity.trim());
  }
  if (actorId && actorId.trim().length > 0) {
    query = query.eq("actor_id", actorId.trim());
  }
  if (from) {
    query = query.gte("created_at", new Date(from).toISOString());
  }
  if (to) {
    query = query.lte("created_at", new Date(to).toISOString());
  }
  const { data: logsData } = await query;
  const logs = (logsData as unknown as AuditLogRow[] | null) ?? [];

  return (
    <div className="mx-auto flex max-w-[900px] flex-col gap-6 px-4 py-16">
      <h1 className="text-2xl font-bold text-text">Auditoría</h1>
      <p className="text-sm text-text-muted">Últimos 100 registros. `audit_log` es de solo lectura — nadie edita ni borra un registro (regla de oro 8 de `CLAUDE.md`).</p>

      <form className="flex flex-wrap gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="entity" className="text-xs text-text-muted">
            Entidad (valor técnico: order, quote, profile...)
          </label>
          <input id="entity" name="entity" defaultValue={entity ?? ""} placeholder="order, quote, profile..." className="rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm" />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="actorId" className="text-xs text-text-muted">
            Actor (uuid)
          </label>
          <input id="actorId" name="actorId" defaultValue={actorId ?? ""} className="rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm" />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="from" className="text-xs text-text-muted">
            Desde
          </label>
          <input id="from" name="from" type="datetime-local" defaultValue={from ?? ""} className="rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm" />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="to" className="text-xs text-text-muted">
            Hasta
          </label>
          <input id="to" name="to" type="datetime-local" defaultValue={to ?? ""} className="rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm" />
        </div>
        <button type="submit" className="self-end rounded-[var(--radius)] border border-border px-4 py-2 text-sm font-medium text-text hover:border-brand">
          Filtrar
        </button>
      </form>

      {logs.length === 0 ? (
        <p className="text-text-muted">Sin registros para este filtro.</p>
      ) : (
        <div className="overflow-x-auto rounded-[var(--radius)] border border-border">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs text-text-muted">
              <tr>
                <th className="px-3 py-2">Fecha</th>
                <th className="px-3 py-2">Actor</th>
                <th className="px-3 py-2">Acción</th>
                <th className="px-3 py-2">Entidad</th>
                <th className="px-3 py-2">Antes</th>
                <th className="px-3 py-2">Después</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="whitespace-nowrap px-3 py-2 text-text-muted">{new Date(log.created_at).toLocaleString("es-CO")}</td>
                  <td className="px-3 py-2 text-text">{log.profiles?.full_name ?? "(sistema)"}</td>
                  <td className="px-3 py-2 text-text">{auditActionLabel(log.action)}</td>
                  <td className="px-3 py-2 text-text-muted">
                    {auditEntityLabel(log.entity)}
                    {log.entity_id ? ` #${log.entity_id}` : ""}
                  </td>
                  <td className="max-w-[180px] truncate px-3 py-2 text-xs text-text-muted" title={log.before ? JSON.stringify(log.before) : ""}>
                    {log.before ? JSON.stringify(log.before) : "—"}
                  </td>
                  <td className="max-w-[180px] truncate px-3 py-2 text-xs text-text-muted" title={log.after ? JSON.stringify(log.after) : ""}>
                    {log.after ? JSON.stringify(log.after) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
