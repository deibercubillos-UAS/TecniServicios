import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@tecni/db";
import { serverEnv } from "@tecni/shared";

export const metadata: Metadata = {
  title: "Detalle de equipo — Tecni Equipos y Servicios SAS",
};

interface EquipmentRow {
  id: string;
  serial_number: string | null;
  delivered_at: string | null;
  warranty_until: string | null;
  location_note: string | null;
  is_active: boolean;
  products: { name: string; slug: string } | null;
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
    .select("id,serial_number,delivered_at,warranty_until,location_note,is_active,products(name,slug)")
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

  const warrantyActive = equipment.warranty_until ? new Date(equipment.warranty_until) >= new Date() : null;

  return (
    <div className="mx-auto flex max-w-[700px] flex-col gap-6 px-4 py-16">
      <h1 className="text-2xl font-bold text-text">{equipment.products?.name ?? "Equipo"}</h1>

      <dl className="rounded-lg border border-border p-4 text-sm">
        <div className="flex justify-between py-1">
          <dt className="text-text-muted">Serial</dt>
          <dd className="text-text">{equipment.serial_number ?? "Sin registrar"}</dd>
        </div>
        <div className="flex justify-between py-1">
          <dt className="text-text-muted">Entregado</dt>
          <dd className="text-text">
            {equipment.delivered_at ? new Date(equipment.delivered_at).toLocaleDateString("es-CO") : "Sin fecha registrada"}
          </dd>
        </div>
        <div className="flex justify-between py-1">
          <dt className="text-text-muted">Garantía</dt>
          <dd className="text-text">
            {equipment.warranty_until
              ? `${warrantyActive ? "Vigente hasta" : "Venció el"} ${new Date(equipment.warranty_until).toLocaleDateString("es-CO")}`
              : "Sin registrar"}
          </dd>
        </div>
        {equipment.location_note ? (
          <div className="flex justify-between py-1">
            <dt className="text-text-muted">Ubicación</dt>
            <dd className="text-text">{equipment.location_note}</dd>
          </div>
        ) : null}
        <div className="flex justify-between py-1">
          <dt className="text-text-muted">Estado</dt>
          <dd className="text-text">{equipment.is_active ? "Activo" : "Inactivo"}</dd>
        </div>
      </dl>

      <section className="rounded-lg border border-border p-4">
        <h2 className="mb-1 font-semibold text-text">Manual</h2>
        <p className="text-sm text-text-muted">Pendiente de sincronización.</p>
      </section>

      <Link href="/mi-cuenta/equipos" className="text-sm text-brand hover:underline">
        Ver mis equipos
      </Link>
    </div>
  );
}
