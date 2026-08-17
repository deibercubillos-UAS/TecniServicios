import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@tecni/db";
import { serverEnv } from "@tecni/shared";
import { Icon } from "@tecni/ui";

import { MaintenanceHistoryList } from "@/components/maintenance-history-list";
import { StatusBadge } from "@/components/status-badge";
import { getAvailableMaintenanceDates } from "@/lib/get-available-maintenance-dates";
import { getMaintenanceHistoryByRequestIds } from "@/lib/get-maintenance-history";
import { MAINTENANCE_STATUS_LABEL, MAINTENANCE_STATUS_TONE } from "@/lib/maintenance-status";
import { requestMaintenanceAction } from "./actions";

export const metadata: Metadata = {
  title: "Mantenimientos",
};

interface EquipmentOption {
  id: string;
  products: { name: string } | null;
}

interface MaintenanceRow {
  id: string;
  status: string;
  preferred_date: string | null;
  scheduled_at: string | null;
  completed_at: string | null;
  description: string | null;
  created_at: string;
  owned_equipment: { products: { name: string } | null } | null;
}

async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(serverEnv.NEXT_PUBLIC_SUPABASE_URL, serverEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    getAll: () => cookieStore.getAll(),
    setAll: () => {},
  });
}

export default async function MantenimientosPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; created?: string; equipmentId?: string }>;
}) {
  const { error, created, equipmentId } = await searchParams;
  const supabase = await getSupabase();

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    redirect("/login?next=/mi-cuenta/mantenimientos");
  }

  const { data: membership } = await supabase
    .from("company_members")
    .select("company_id")
    .eq("profile_id", userData.user.id)
    .order("is_primary", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!membership) {
    return (
      <div className="mx-auto max-w-[800px] px-4 py-16">
        <h1 className="mb-4 text-2xl font-bold text-text">Mantenimientos</h1>
        <p className="text-text-muted">Tu cuenta todavía no está asociada a una empresa.</p>
      </div>
    );
  }

  const { data: equipmentData } = await supabase.from("owned_equipment").select("id,products(name)").eq("is_active", true);
  const equipmentOptions = (equipmentData as unknown as EquipmentOption[] | null) ?? [];
  const availableDates = await getAvailableMaintenanceDates(supabase);

  const { data: requestsData } = await supabase
    .from("maintenance_requests")
    .select("id,status,preferred_date,scheduled_at,completed_at,description,created_at,owned_equipment(products(name))")
    .order("created_at", { ascending: false });
  const requests = (requestsData as unknown as MaintenanceRow[] | null) ?? [];

  const completedRequestIds = requests.filter((r) => r.status === "completed").map((r) => r.id);
  const historyByRequestId = new Map(
    (await getMaintenanceHistoryByRequestIds(supabase, completedRequestIds)).map((entry) => [entry.requestId, entry]),
  );

  return (
    <div className="mx-auto flex max-w-[800px] flex-col gap-6 px-4 py-12 sm:py-16">
      <div>
        <h1 className="text-2xl font-bold text-text">Mantenimientos</h1>
        <p className="text-sm text-text-muted">Agenda visitas técnicas y sigue el estado de tus solicitudes.</p>
      </div>

      {created ? (
        <p className="flex items-center gap-2 rounded-[var(--radius)] border border-success bg-success/10 px-3 py-2 text-sm text-success">
          <Icon name="checkCircle" size={16} />
          Mantenimiento solicitado. Te contactaremos para confirmar la fecha.
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="flex items-center gap-2 rounded-[var(--radius)] border border-danger bg-danger/10 px-3 py-2 text-sm text-danger">
          <Icon name="close" size={16} />
          {error}
        </p>
      ) : null}

      {equipmentOptions.length > 0 ? (
        <section className="rounded-xl border border-border bg-surface p-5">
          <h2 className="mb-4 flex items-center gap-2 font-bold text-text">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-subtle text-brand">
              <Icon name="wrench" size={16} />
            </span>
            Agendar mantenimiento
          </h2>
          <form action={requestMaintenanceAction} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label htmlFor="equipmentId" className="text-sm font-medium text-text-muted">
                Equipo
              </label>
              <select
                id="equipmentId"
                name="equipmentId"
                required
                defaultValue={equipmentId ?? ""}
                className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
              >
                {equipmentOptions.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.products?.name ?? "Equipo"}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="preferredDate" className="text-sm font-medium text-text-muted">
                Fecha preferida
              </label>
              {availableDates.length > 0 ? (
                <select
                  id="preferredDate"
                  name="preferredDate"
                  className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
                >
                  <option value="">Sin preferencia — Tecni propone una fecha</option>
                  {availableDates.map((d) => (
                    <option key={d.date} value={d.date}>
                      {new Date(`${d.date}T00:00:00`).toLocaleDateString("es-CO", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}{" "}
                      ({d.remaining} cupo{d.remaining === 1 ? "" : "s"})
                    </option>
                  ))}
                </select>
              ) : (
                <p className="rounded-[var(--radius)] border border-border bg-bg-alt px-3 py-2.5 text-sm text-text-muted">
                  No hay fechas abiertas por ahora — te contactaremos para coordinar una.
                </p>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="description" className="text-sm font-medium text-text-muted">
                Descripción del problema
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="flex w-fit items-center gap-2 rounded-[var(--radius)] bg-brand px-5 py-2.5 text-sm font-semibold text-text-inverse transition-colors hover:bg-brand-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              <Icon name="wrench" size={16} />
              Agendar mantenimiento
            </button>
          </form>
        </section>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-bg-alt px-6 py-12 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-subtle text-brand">
            <Icon name="wrench" size={26} />
          </span>
          <p className="font-semibold text-text">No tienes equipos activos para agendar mantenimiento</p>
          <Link href="/mi-cuenta/equipos" className="mt-1 text-sm font-medium text-brand hover:underline">
            Ver mis equipos
          </Link>
        </div>
      )}

      {requests.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h2 className="font-bold text-text">Mis solicitudes</h2>
          <ul className="flex flex-col gap-3">
            {requests.map((request) => {
              const tone = MAINTENANCE_STATUS_TONE[request.status] ?? { tone: "muted" as const, icon: "clock" as const };
              const report = historyByRequestId.get(request.id);
              return (
                <li key={request.id} className="rounded-xl border border-border bg-surface p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-subtle text-brand">
                        <Icon name="wrench" size={18} />
                      </span>
                      <div>
                        <p className="font-medium text-text">{request.owned_equipment?.products?.name ?? "Equipo"}</p>
                        <p className="text-xs text-text-muted">
                          Solicitado el {new Date(request.created_at).toLocaleDateString("es-CO")}
                          {request.preferred_date ? ` · Preferencia: ${new Date(request.preferred_date).toLocaleDateString("es-CO")}` : ""}
                          {request.scheduled_at ? ` · Agendado: ${new Date(request.scheduled_at).toLocaleString("es-CO")}` : ""}
                        </p>
                      </div>
                    </div>
                    <StatusBadge label={MAINTENANCE_STATUS_LABEL[request.status] ?? request.status} tone={tone.tone} icon={tone.icon} />
                  </div>
                  {report ? (
                    <div className="mt-3 border-t border-border pt-3">
                      <MaintenanceHistoryList entries={[report]} />
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
