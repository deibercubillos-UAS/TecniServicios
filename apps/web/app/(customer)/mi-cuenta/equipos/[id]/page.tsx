import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@tecni/db";
import { serverEnv } from "@tecni/shared";
import { Icon } from "@tecni/ui";

import { MaintenanceHistoryList } from "@/components/maintenance-history-list";
import { StatusBadge } from "@/components/status-badge";
import { getMaintenanceHistoryByEquipment } from "@/lib/get-maintenance-history";

export const metadata: Metadata = {
  title: "Detalle de equipo",
};

interface EquipmentRow {
  id: string;
  product_id: string;
  serial_number: string | null;
  delivered_at: string | null;
  warranty_until: string | null;
  location_note: string | null;
  is_active: boolean;
  next_maintenance_due_at: string | null;
  products: { name: string; slug: string } | null;
}

interface DocumentRow {
  id: string;
  title: string;
  kind: string;
}

async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(serverEnv.NEXT_PUBLIC_SUPABASE_URL, serverEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    getAll: () => cookieStore.getAll(),
    setAll: () => {},
  });
}

export default async function DetalleEquipoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await getSupabase();

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    redirect("/login?next=/mi-cuenta/equipos/" + encodeURIComponent(id));
  }

  // `owned_equipment_read` (05-RLS-SECURITY-C.md) ya limita esto a los
  // equipos de la propia empresa (o vendedor/técnico asignado/master).
  const { data: equipmentData } = await supabase
    .from("owned_equipment")
    .select("id,product_id,serial_number,delivered_at,warranty_until,location_note,is_active,next_maintenance_due_at,products(name,slug)")
    .eq("id", id)
    .maybeSingle();
  const equipment = equipmentData as unknown as EquipmentRow | null;

  if (!equipment) {
    return (
      <div className="mx-auto max-w-[700px] px-4 py-16">
        <h1 className="mb-4 text-2xl font-bold text-text">Equipo no encontrado</h1>
        <p className="text-text-muted">
          No encontramos este equipo o no pertenece a tu empresa.{" "}
          <Link href="/mi-cuenta/equipos" className="text-brand hover:underline">
            Ver mis equipos
          </Link>
        </p>
      </div>
    );
  }

  const { data: documentsData } = await supabase.from("product_documents").select("id,title,kind").eq("product_id", equipment.product_id);
  const documents = (documentsData as DocumentRow[] | null) ?? [];

  const maintenanceHistory = await getMaintenanceHistoryByEquipment(supabase, equipment.id);

  const warrantyActive = equipment.warranty_until ? new Date(equipment.warranty_until) >= new Date() : null;

  return (
    <div className="mx-auto flex max-w-[700px] flex-col gap-6 px-4 py-12 sm:py-16">
      <div className="flex items-start gap-4">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-brand-subtle text-brand">
          <Icon name="box" size={26} />
        </span>
        <div>
          <h1 className="text-2xl font-bold text-text">{equipment.products?.name ?? "Equipo"}</h1>
          <div className="mt-1 flex flex-wrap gap-2">
            <StatusBadge label={equipment.is_active ? "Activo" : "Inactivo"} tone={equipment.is_active ? "success" : "muted"} icon={equipment.is_active ? "checkCircle" : "close"} />
            {equipment.warranty_until ? (
              <StatusBadge
                label={warrantyActive ? "Garantía vigente" : "Garantía vencida"}
                tone={warrantyActive ? "success" : "warning"}
                icon="shield"
              />
            ) : null}
          </div>
        </div>
      </div>

      <dl className="rounded-xl border border-border bg-surface p-5 text-sm">
        <div className="flex justify-between border-b border-border/60 py-2">
          <dt className="text-text-muted">Serial</dt>
          <dd className="text-text">{equipment.serial_number ?? "Sin registrar"}</dd>
        </div>
        <div className="flex justify-between border-b border-border/60 py-2">
          <dt className="text-text-muted">Entregado</dt>
          <dd className="text-text">
            {equipment.delivered_at ? new Date(equipment.delivered_at).toLocaleDateString("es-CO") : "Sin fecha registrada"}
          </dd>
        </div>
        <div className={`flex justify-between py-2 ${equipment.location_note ? "border-b border-border/60" : ""}`}>
          <dt className="text-text-muted">Garantía</dt>
          <dd className="text-text">
            {equipment.warranty_until
              ? `${warrantyActive ? "Vigente hasta" : "Venció el"} ${new Date(equipment.warranty_until).toLocaleDateString("es-CO")}`
              : "Sin registrar"}
          </dd>
        </div>
        {equipment.location_note ? (
          <div className={`flex justify-between py-2 ${equipment.next_maintenance_due_at ? "border-b border-border/60" : ""}`}>
            <dt className="text-text-muted">Ubicación</dt>
            <dd className="text-text">{equipment.location_note}</dd>
          </div>
        ) : null}
        {equipment.next_maintenance_due_at ? (
          <div className="flex justify-between py-2">
            <dt className="text-text-muted">Próximo mantenimiento preventivo</dt>
            <dd className="text-text">{new Date(`${equipment.next_maintenance_due_at}T00:00:00.000Z`).toLocaleDateString("es-CO", { timeZone: "UTC" })}</dd>
          </div>
        ) : null}
      </dl>

      <section className="rounded-xl border border-border bg-surface p-5">
        <h2 className="mb-2 flex items-center gap-2 font-bold text-text">
          <Icon name="document" size={18} className="text-text-muted" />
          Manual
        </h2>
        {documents.length === 0 ? (
          <StatusBadge label="Manual pendiente de sincronización" tone="muted" icon="clock" />
        ) : (
          <ul className="flex flex-col gap-1">
            {documents.map((doc) => (
              <li key={doc.id} className="flex items-center gap-2 text-sm text-text">
                <Icon name="document" size={16} className="text-text-muted" />
                {doc.title}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-border bg-surface p-5">
        <h2 className="mb-3 flex items-center gap-2 font-bold text-text">
          <Icon name="wrench" size={18} className="text-text-muted" />
          Historial de mantenimiento
        </h2>
        <MaintenanceHistoryList entries={maintenanceHistory} />
      </section>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Link
          href={`/mi-cuenta/mantenimientos?equipmentId=${equipment.id}`}
          className="group flex items-center gap-3 rounded-xl border border-border bg-surface p-4 transition-all duration-150 hover:-translate-y-0.5 hover:border-brand hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-subtle text-brand transition-transform duration-150 group-hover:scale-110">
            <Icon name="wrench" size={18} />
          </span>
          <span className="text-sm font-semibold text-text group-hover:text-brand">Programar mantenimiento</span>
        </Link>
        <Link
          href={`/mi-cuenta/tickets?equipmentId=${equipment.id}`}
          className="group flex items-center gap-3 rounded-xl border border-border bg-surface p-4 transition-all duration-150 hover:-translate-y-0.5 hover:border-brand hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-subtle text-brand transition-transform duration-150 group-hover:scale-110">
            <Icon name="chat" size={18} />
          </span>
          <span className="text-sm font-semibold text-text group-hover:text-brand">Abrir ticket de soporte</span>
        </Link>
      </div>

      <Link href="/mi-cuenta/equipos" className="text-sm font-medium text-brand hover:underline">
        Ver mis equipos
      </Link>
    </div>
  );
}
