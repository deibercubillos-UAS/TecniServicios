import type { Metadata } from "next";
import { cookies } from "next/headers";
import { createServerClient } from "@tecni/db";
import { serverEnv } from "@tecni/shared";

import { confirmMaintenanceAction, rescheduleMaintenanceAction, completeMaintenanceAction } from "./actions";

const REPORTABLE_STATUSES = new Set(["confirmed", "rescheduled", "in_progress"]);

export const metadata: Metadata = {
  title: "Mantenimientos — Panel de técnico",
};

const MAINTENANCE_STATUS_LABEL: Record<string, string> = {
  requested: "Solicitado",
  confirmed: "Confirmado",
  rescheduled: "Reprogramado",
  in_progress: "En proceso",
  completed: "Completado",
  cancelled: "Cancelado",
};

interface MaintenanceRow {
  id: string;
  status: string;
  preferred_date: string | null;
  scheduled_at: string | null;
  description: string | null;
  created_at: string;
  companies: { legal_name: string } | null;
  owned_equipment: { products: { name: string } | null } | null;
}

async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(serverEnv.NEXT_PUBLIC_SUPABASE_URL, serverEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    getAll: () => cookieStore.getAll(),
    setAll: () => {},
  });
}

export default async function TecnicoMantenimientosPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; confirmed?: string; rescheduled?: string; completed?: string }>;
}) {
  const { error, confirmed, rescheduled, completed } = await searchParams;
  const supabase = await getSupabase();

  // El middleware (docs/06-AUTH-ROLES.md sección 5) ya exige
  // technician/master para llegar a /tecnico — `maintenance_read`
  // (05-RLS-SECURITY-C.md) limita esto a lo asignado (o todo si es
  // master). Sin asignación todavía no hay panel para que el técnico
  // "tome" solicitudes sin asignar — se asignan desde /ventas o vía
  // SQL mientras no exista ese panel (14-MODULE-SERVICE.md).
  const { data: requestsData } = await supabase
    .from("maintenance_requests")
    .select("id,status,preferred_date,scheduled_at,description,created_at,companies(legal_name),owned_equipment(products(name))")
    .order("created_at", { ascending: false });
  const requests = (requestsData as unknown as MaintenanceRow[] | null) ?? [];

  return (
    <div className="mx-auto flex max-w-[800px] flex-col gap-6 px-4 py-16">
      <h1 className="text-2xl font-bold text-text">Mantenimientos</h1>

      {confirmed ? (
        <p className="rounded-[var(--radius)] border border-success bg-success/10 px-3 py-2 text-sm text-success">Mantenimiento confirmado.</p>
      ) : null}
      {rescheduled ? (
        <p className="rounded-[var(--radius)] border border-success bg-success/10 px-3 py-2 text-sm text-success">
          Mantenimiento reprogramado.
        </p>
      ) : null}
      {completed ? (
        <p className="rounded-[var(--radius)] border border-success bg-success/10 px-3 py-2 text-sm text-success">
          Reporte registrado, mantenimiento completado.
        </p>
      ) : null}
      {error ? (
        <p className="rounded-[var(--radius)] border border-danger bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>
      ) : null}

      {requests.length === 0 ? (
        <p className="text-text-muted">No tienes mantenimientos asignados todavía.</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {requests.map((request) => (
            <li key={request.id} className="rounded-lg border border-border p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium text-text">{request.owned_equipment?.products?.name ?? "Equipo"}</p>
                  <p className="text-xs text-text-muted">{request.companies?.legal_name ?? "Empresa"}</p>
                </div>
                <span className="rounded-full border border-border px-3 py-1 text-xs font-medium text-text">
                  {MAINTENANCE_STATUS_LABEL[request.status] ?? request.status}
                </span>
              </div>
              {request.description ? <p className="mt-2 text-sm text-text-muted">{request.description}</p> : null}
              {request.preferred_date ? (
                <p className="mt-1 text-xs text-text-muted">Preferencia del cliente: {new Date(request.preferred_date).toLocaleDateString("es-CO")}</p>
              ) : null}
              {request.scheduled_at ? (
                <p className="mt-1 text-xs text-text-muted">Programado: {new Date(request.scheduled_at).toLocaleString("es-CO")}</p>
              ) : null}

              {request.status === "requested" || request.status === "rescheduled" ? (
                <form action={confirmMaintenanceAction} className="mt-3">
                  <input type="hidden" name="requestId" value={request.id} />
                  <button
                    type="submit"
                    className="rounded-[var(--radius)] bg-brand px-3 py-1.5 text-sm font-semibold text-text-inverse transition-colors hover:bg-brand-hover"
                  >
                    Confirmar
                  </button>
                </form>
              ) : null}

              {request.status !== "completed" && request.status !== "cancelled" ? (
                <form action={rescheduleMaintenanceAction} className="mt-3 flex flex-wrap items-end gap-2">
                  <input type="hidden" name="requestId" value={request.id} />
                  <div className="flex flex-col gap-1">
                    <label htmlFor={`scheduledAt-${request.id}`} className="text-xs text-text-muted">
                      Reprogramar a
                    </label>
                    <input
                      id={`scheduledAt-${request.id}`}
                      name="scheduledAt"
                      type="datetime-local"
                      required
                      className="rounded-[var(--radius)] border border-border bg-surface px-2 py-1 text-sm"
                    />
                  </div>
                  <button
                    type="submit"
                    className="rounded-[var(--radius)] border border-border px-3 py-1.5 text-sm font-medium text-text hover:border-brand"
                  >
                    Reprogramar
                  </button>
                </form>
              ) : null}

              {REPORTABLE_STATUSES.has(request.status) ? (
                <form action={completeMaintenanceAction} className="mt-3 flex flex-col gap-2 border-t border-border pt-3">
                  <input type="hidden" name="requestId" value={request.id} />
                  <div className="flex flex-col gap-1">
                    <label htmlFor={`workDone-${request.id}`} className="text-xs text-text-muted">
                      Trabajo realizado
                    </label>
                    <textarea
                      id={`workDone-${request.id}`}
                      name="workDone"
                      rows={2}
                      required
                      className="rounded-[var(--radius)] border border-border bg-surface px-2 py-1 text-sm"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label htmlFor={`recommendations-${request.id}`} className="text-xs text-text-muted">
                      Recomendaciones
                    </label>
                    <textarea
                      id={`recommendations-${request.id}`}
                      name="recommendations"
                      rows={2}
                      className="rounded-[var(--radius)] border border-border bg-surface px-2 py-1 text-sm"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label htmlFor={`nextServiceDate-${request.id}`} className="text-xs text-text-muted">
                      Próxima fecha de servicio
                    </label>
                    <input
                      id={`nextServiceDate-${request.id}`}
                      name="nextServiceDate"
                      type="date"
                      className="rounded-[var(--radius)] border border-border bg-surface px-2 py-1 text-sm"
                    />
                  </div>
                  <button
                    type="submit"
                    className="self-start rounded-[var(--radius)] bg-brand px-3 py-1.5 text-sm font-semibold text-text-inverse transition-colors hover:bg-brand-hover"
                  >
                    Completar con reporte
                  </button>
                </form>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
