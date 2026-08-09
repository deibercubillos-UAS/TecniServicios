import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@tecni/db";
import { serverEnv } from "@tecni/shared";
import { Icon } from "@tecni/ui";

import { StatusBadge } from "@/components/status-badge";

export const metadata: Metadata = {
  title: "Manuales — Tecni Equipos y Servicios SAS",
};

interface EquipmentRow {
  id: string;
  product_id: string;
  serial_number: string | null;
  products: { name: string } | null;
}

interface DocumentRow {
  id: string;
  product_id: string;
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

export default async function ManualesPage() {
  const supabase = await getSupabase();

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    redirect("/login?next=/mi-cuenta/manuales");
  }

  // `owned_equipment_read` (05-RLS-SECURITY-C.md) limita esto a los equipos
  // de la propia empresa. Los manuales privados de un equipo (regla de
  // negocio 5.5) son los `product_documents` del producto asociado.
  const { data: equipmentData } = await supabase
    .from("owned_equipment")
    .select("id,product_id,serial_number,products(name)")
    .order("delivered_at", { ascending: false });
  const equipment = (equipmentData as unknown as EquipmentRow[] | null) ?? [];

  const productIds = [...new Set(equipment.map((e) => e.product_id))];
  const { data: documentsData } =
    productIds.length > 0
      ? await supabase.from("product_documents").select("id,product_id,title,kind").in("product_id", productIds)
      : { data: [] };
  const documents = (documentsData as DocumentRow[] | null) ?? [];
  const documentsByProduct = new Map<string, DocumentRow[]>();
  for (const doc of documents) {
    const list = documentsByProduct.get(doc.product_id) ?? [];
    list.push(doc);
    documentsByProduct.set(doc.product_id, list);
  }

  return (
    <div className="mx-auto flex max-w-[900px] flex-col gap-6 px-4 py-12 sm:py-16">
      <div>
        <h1 className="text-2xl font-bold text-text">Manuales</h1>
        <p className="text-sm text-text-muted">Manuales y fichas técnicas de los equipos que tu empresa ha comprado.</p>
      </div>

      {equipment.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-bg-alt px-6 py-16 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-subtle text-brand">
            <Icon name="document" size={26} />
          </span>
          <p className="font-semibold text-text">Todavía no tienes equipos registrados</p>
          <p className="text-sm text-text-muted">Los manuales aparecen acá cuando un pedido se marca como entregado.</p>
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
            const docs = documentsByProduct.get(item.product_id) ?? [];
            return (
              <div key={item.id} className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-subtle text-brand">
                      <Icon name="document" size={18} />
                    </span>
                    <div>
                      <span className="font-semibold text-text">{item.products?.name ?? "Equipo"}</span>
                      {item.serial_number ? <p className="text-xs text-text-muted">Serial {item.serial_number}</p> : null}
                    </div>
                  </div>
                </div>
                {docs.length === 0 ? (
                  <StatusBadge label="Pendiente de sincronización" tone="muted" icon="clock" />
                ) : (
                  <ul className="flex flex-col gap-1.5">
                    {docs.map((doc) => (
                      <li key={doc.id} className="flex items-center gap-2 text-sm text-text">
                        <Icon name="document" size={14} className="text-text-muted" />
                        {doc.title}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
