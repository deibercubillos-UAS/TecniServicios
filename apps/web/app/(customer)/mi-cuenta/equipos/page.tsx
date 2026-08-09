import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@tecni/db";
import { serverEnv } from "@tecni/shared";
import { Icon } from "@tecni/ui";

import { StatusBadge } from "@/components/status-badge";

export const metadata: Metadata = {
  title: "Mis equipos — Tecni Equipos y Servicios SAS",
};

interface EquipmentRow {
  id: string;
  serial_number: string | null;
  delivered_at: string | null;
  warranty_until: string | null;
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

function warrantyBadge(warrantyUntil: string | null) {
  if (!warrantyUntil) return { label: "Garantía sin registrar", tone: "muted" as const, icon: "shield" as const };
  const active = new Date(warrantyUntil) >= new Date();
  return active
    ? { label: `Garantía hasta ${new Date(warrantyUntil).toLocaleDateString("es-CO")}`, tone: "success" as const, icon: "shield" as const }
    : { label: "Garantía vencida", tone: "warning" as const, icon: "shield" as const };
}

export default async function MisEquiposPage() {
  const supabase = await getSupabase();

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    redirect("/login?next=/mi-cuenta/equipos");
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
        <h1 className="mb-4 text-2xl font-bold text-text">Mis equipos</h1>
        <p className="text-text-muted">Tu cuenta todavía no está asociada a una empresa.</p>
      </div>
    );
  }

  // `owned_equipment_read` (05-RLS-SECURITY-C.md) ya limita esto a los
  // equipos de la propia empresa.
  const { data: equipmentData } = await supabase
    .from("owned_equipment")
    .select("id,serial_number,delivered_at,warranty_until,is_active,products(name,slug)")
    .order("delivered_at", { ascending: false });
  const equipment = (equipmentData as unknown as EquipmentRow[] | null) ?? [];

  return (
    <div className="mx-auto flex max-w-[1000px] flex-col gap-6 px-4 py-12 sm:py-16">
      <div>
        <h1 className="text-2xl font-bold text-text">Mis equipos</h1>
        <p className="text-sm text-text-muted">{equipment.length} equipo{equipment.length === 1 ? "" : "s"} entregado{equipment.length === 1 ? "" : "s"}.</p>
      </div>

      {equipment.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-bg-alt px-6 py-16 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-subtle text-brand">
            <Icon name="box" size={26} />
          </span>
          <p className="font-semibold text-text">Todavía no tienes equipos registrados</p>
          <p className="text-sm text-text-muted">Aparecen acá cuando un pedido se marca como entregado.</p>
          <Link
            href="/pedidos"
            className="mt-2 rounded-[var(--radius)] bg-brand px-5 py-2.5 text-sm font-semibold text-text-inverse transition-colors hover:bg-brand-hover"
          >
            Ver mis pedidos
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {equipment.map((item) => {
            const warranty = warrantyBadge(item.warranty_until);
            return (
              <Link
                key={item.id}
                href={`/mi-cuenta/equipos/${item.id}`}
                className="group flex flex-col gap-3 rounded-xl border border-border bg-surface p-5 transition-all duration-150 hover:-translate-y-0.5 hover:border-brand hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-subtle text-brand transition-transform duration-150 group-hover:scale-110">
                    <Icon name="box" size={22} />
                  </span>
                  {!item.is_active ? <StatusBadge label="Inactivo" tone="muted" icon="close" /> : null}
                </div>
                <div>
                  <span className="font-semibold text-text group-hover:text-brand">{item.products?.name ?? "Equipo"}</span>
                  <p className="text-xs text-text-muted">
                    {item.serial_number ? `Serial ${item.serial_number}` : "Sin serial registrado"}
                    {item.delivered_at ? ` · Entregado el ${new Date(item.delivered_at).toLocaleDateString("es-CO")}` : ""}
                  </p>
                </div>
                <StatusBadge label={warranty.label} tone={warranty.tone} icon={warranty.icon} />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
