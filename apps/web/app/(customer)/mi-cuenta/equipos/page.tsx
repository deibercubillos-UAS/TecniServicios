import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@tecni/db";
import { serverEnv } from "@tecni/shared";

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
    <div className="mx-auto flex max-w-[800px] flex-col gap-6 px-4 py-16">
      <h1 className="text-2xl font-bold text-text">Mis equipos</h1>

      {equipment.length === 0 ? (
        <p className="text-text-muted">
          Todavía no tienes equipos registrados — aparecen acá cuando un pedido se marca como entregado.{" "}
          <Link href="/pedidos" className="text-brand hover:underline">
            Ver mis pedidos
          </Link>
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-border rounded-lg border border-border">
          {equipment.map((item) => (
            <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
              <div>
                <Link href={`/mi-cuenta/equipos/${item.id}`} className="font-medium text-text hover:text-brand">
                  {item.products?.name ?? "Equipo"}
                </Link>
                <p className="text-xs text-text-muted">
                  {item.serial_number ? `Serial ${item.serial_number}` : "Sin serial registrado"}
                  {item.delivered_at ? ` · Entregado el ${new Date(item.delivered_at).toLocaleDateString("es-CO")}` : ""}
                </p>
              </div>
              {!item.is_active ? (
                <span className="rounded-full border border-border px-3 py-1 text-xs font-medium text-text-muted">Inactivo</span>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <Link href="/mi-cuenta" className="text-sm text-brand hover:underline">
        Volver a mi cuenta
      </Link>
    </div>
  );
}
