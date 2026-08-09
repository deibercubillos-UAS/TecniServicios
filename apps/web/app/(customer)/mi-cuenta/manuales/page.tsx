import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@tecni/db";
import { serverEnv } from "@tecni/shared";
import { Icon } from "@tecni/ui";

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
    <div className="mx-auto flex max-w-[800px] flex-col gap-6 px-4 py-16">
      <div>
        <h1 className="text-2xl font-bold text-text">Manuales</h1>
        <p className="text-sm text-text-muted">Manuales y fichas técnicas de los equipos que tu empresa ha comprado.</p>
      </div>

      {equipment.length === 0 ? (
        <p className="text-text-muted">
          Todavía no tienes equipos registrados — los manuales aparecen acá cuando un pedido se marca como entregado.{" "}
          <Link href="/pedidos" className="text-brand hover:underline">
            Ver mis pedidos
          </Link>
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-border rounded-lg border border-border">
          {equipment.map((item) => {
            const docs = documentsByProduct.get(item.product_id) ?? [];
            return (
              <li key={item.id} className="flex flex-col gap-2 px-4 py-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-text">{item.products?.name ?? "Equipo"}</span>
                  {item.serial_number ? <span className="text-xs text-text-muted">Serial {item.serial_number}</span> : null}
                </div>
                {docs.length === 0 ? (
                  <p className="text-xs text-text-muted">Manual pendiente de sincronización.</p>
                ) : (
                  <ul className="flex flex-col gap-1">
                    {docs.map((doc) => (
                      <li key={doc.id} className="flex items-center gap-2 text-sm text-text">
                        <Icon name="document" size={16} className="text-text-muted" />
                        {doc.title}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <Link href="/mi-cuenta" className="text-sm text-brand hover:underline">
        Volver al panel
      </Link>
    </div>
  );
}
