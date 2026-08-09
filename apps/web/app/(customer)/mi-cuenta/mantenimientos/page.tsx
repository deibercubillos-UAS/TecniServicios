import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@tecni/db";
import { serverEnv } from "@tecni/shared";

import { requestMaintenanceAction } from "./actions";

export const metadata: Metadata = {
  title: "Mantenimientos — Tecni Equipos y Servicios SAS",
};

const MAINTENANCE_STATUS_LABEL: Record<string, string> = {
  requested: "Solicitado",
  confirmed: "Confirmado",
  rescheduled: "Reprogramado",
  in_progress: "En proceso",
  completed: "Completado",
  cancelled: "Cancelado",
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
  searchParams: Promise<{ error?: string; created?: string }>;
}) {
  const { error, created } = await searchParams;
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

  const { data: requestsData } = await supabase
    .from("maintenance_requests")
    .select("id,status,preferred_date,scheduled_at,completed_at,description,created_at,owned_equipment(products(name))")
    .order("created_at", { ascending: false });
  const requests = (requestsData as unknown as MaintenanceRow[] | null) ?? [];

  return (
    <div className="mx-auto flex max-w-[800px] flex-col gap-6 px-4 py-16">
      <h1 className="text-2xl font-bold text-text">Mantenimientos</h1>

      {created ? (
        <p className="rounded-[var(--radius)] border border-success bg-success/10 px-3 py-2 text-sm text-success">
          Mantenimiento solicitado. Te contactaremos para confirmar la fecha.
        </p>
      ) : null}
      {error ? (
        <p className="rounded-[var(--radius)] border border-danger bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>
      ) : null}

      {equipmentOptions.length > 0 ? (
        <section className="rounded-lg border border-border p-4">
          <h2 className="mb-3 font-semibold text-text">Agendar mantenimiento</h2>
          <form action={requestMaintenanceAction} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label htmlFor="equipmentId" className="text-sm text-text-muted">
                Equipo
              </label>
              <select id="equipmentId" name="equipmentId" required className="rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm">
                {equipmentOptions.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.products?.name ?? "Equipo"}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="preferredDate" className="text-sm text-text-muted">
                Fecha preferida
              </label>
              <input
                id="preferredDate"
                name="preferredDate"
                type="date"
                className="rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="description" className="text-sm text-text-muted">
                Descripción del problema
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                className="rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm"
              />
            </div>
            <button
              type="submit"
              className="self-start rounded-[var(--radius)] bg-brand px-4 py-2 text-sm font-semibold text-text-inverse transition-colors hover:bg-brand-hover"
            >
              Agendar mantenimiento
            </button>
          </form>
        </section>
      ) : (
        <p className="text-text-muted">
          No tienes equipos activos para agendar mantenimiento.{" "}
          <Link href="/mi-cuenta/equipos" className="text-brand hover:underline">
            Ver mis equipos
          </Link>
        </p>
      )}

      {requests.length > 0 ? (
        <section className="rounded-lg border border-border">
          <h2 className="border-b border-border bg-bg-alt px-4 py-3 font-semibold text-text">Mis solicitudes</h2>
          <ul className="divide-y divide-border">
            {requests.map((request) => (
              <li key={request.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                <div>
                  <p className="font-medium text-text">{request.owned_equipment?.products?.name ?? "Equipo"}</p>
                  <p className="text-xs text-text-muted">
                    Solicitado el {new Date(request.created_at).toLocaleDateString("es-CO")}
                    {request.preferred_date ? ` · Preferencia: ${new Date(request.preferred_date).toLocaleDateString("es-CO")}` : ""}
                  </p>
                </div>
                <span className="rounded-full border border-border px-3 py-1 text-xs font-medium text-text">
                  {MAINTENANCE_STATUS_LABEL[request.status] ?? request.status}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <Link href="/mi-cuenta" className="text-sm text-brand hover:underline">
        Volver a mi cuenta
      </Link>
    </div>
  );
}
