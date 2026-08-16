import type { Metadata } from "next";
import { cookies } from "next/headers";
import { createServerClient } from "@tecni/db";
import { serverEnv } from "@tecni/shared";
import { Icon } from "@tecni/ui";

import { StatusBadge } from "@/components/status-badge";
import { setMaintenanceIntervalAction } from "./actions";

export const metadata: Metadata = {
  title: "Equipos — Panel maestro",
};

interface EquipmentRow {
  id: string;
  serial_number: string | null;
  is_active: boolean;
  maintenance_interval_months: number | null;
  next_maintenance_due_at: string | null;
  companies: { legal_name: string } | null;
  products: { name: string } | null;
}

async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(serverEnv.NEXT_PUBLIC_SUPABASE_URL, serverEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    getAll: () => cookieStore.getAll(),
    setAll: () => {},
  });
}

function formatDate(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00.000Z`).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

export default async function AdminEquiposPage({ searchParams }: { searchParams: Promise<{ error?: string; updated?: string }> }) {
  const { error, updated } = await searchParams;
  const supabase = await getSupabase();

  const { data } = await supabase
    .from("owned_equipment")
    .select("id,serial_number,is_active,maintenance_interval_months,next_maintenance_due_at,companies(legal_name),products(name)")
    .order("created_at", { ascending: false });
  const equipment = (data as unknown as EquipmentRow[] | null) ?? [];

  return (
    <div className="mx-auto flex max-w-[900px] flex-col gap-6 px-4 py-16">
      <div>
        <h1 className="text-2xl font-bold text-text">Equipos</h1>
        <p className="text-sm text-text-muted">
          Equipos vendidos y entregados (postventa). Fija cada cuántos meses requiere mantenimiento preventivo — 15 días antes
          del vencimiento se envía un recordatorio por correo a la empresa.
        </p>
      </div>

      {updated ? (
        <p className="flex items-center gap-2 rounded-[var(--radius)] border border-success bg-success/10 px-3 py-2 text-sm text-success">
          <Icon name="checkCircle" size={16} />
          Intervalo actualizado.
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="flex items-center gap-2 rounded-[var(--radius)] border border-danger bg-danger/10 px-3 py-2 text-sm text-danger">
          <Icon name="close" size={16} />
          {error}
        </p>
      ) : null}

      {equipment.length === 0 ? (
        <p className="text-sm text-text-muted">Todavía no hay equipos entregados.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {equipment.map((item) => (
            <div key={item.id} className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium text-text">{item.products?.name ?? "Producto"}</p>
                <p className="text-sm text-text-muted">
                  {item.companies?.legal_name ?? "Empresa"}
                  {item.serial_number ? ` · Serie ${item.serial_number}` : ""}
                </p>
                {!item.is_active ? <StatusBadge label="Inactivo" tone="muted" icon="close" /> : null}
                {item.next_maintenance_due_at ? (
                  <p className="mt-1 text-xs text-text-muted">Próximo mantenimiento: {formatDate(item.next_maintenance_due_at)}</p>
                ) : null}
              </div>

              <form action={setMaintenanceIntervalAction} className="flex items-end gap-2">
                <input type="hidden" name="equipmentId" value={item.id} />
                <div className="flex flex-col gap-1">
                  <label htmlFor={`months-${item.id}`} className="text-xs font-medium text-text-muted">
                    Intervalo (meses)
                  </label>
                  <input
                    id={`months-${item.id}`}
                    name="months"
                    type="number"
                    min={1}
                    defaultValue={item.maintenance_interval_months ?? ""}
                    placeholder="Sin definir"
                    className="w-28 rounded-[var(--radius)] border border-border bg-bg px-3 py-2 text-sm focus:border-brand focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="rounded-[var(--radius)] bg-brand px-3 py-2 text-sm font-semibold text-text-inverse transition-colors hover:bg-brand-hover"
                >
                  Guardar
                </button>
              </form>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
