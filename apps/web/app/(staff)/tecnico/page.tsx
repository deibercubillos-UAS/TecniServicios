import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { createServerClient } from "@tecni/db";
import { serverEnv } from "@tecni/shared";

export const metadata: Metadata = {
  title: "Panel técnico — Tecni Equipos y Servicios SAS",
};

async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(serverEnv.NEXT_PUBLIC_SUPABASE_URL, serverEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    getAll: () => cookieStore.getAll(),
    setAll: () => {},
  });
}

export default async function TecnicoDashboardPage() {
  const supabase = await getSupabase();
  const { data: userData } = await supabase.auth.getUser();
  const technicianId = userData.user?.id ?? "";

  // Middleware ya exige technician/master en /tecnico. RLS
  // (`maintenance_requests_read`/`support_tickets_read`, docs/05) limita
  // a un technician a lo que tiene asignado; master ve todo. El filtro
  // explícito por `technician_id`/`assigned_to` acá replica el mismo
  // alcance para que el conteo no incluya lo de otros técnicos cuando
  // el actor es master viendo su propio panel.
  const { count: pendingConfirmCount } = await supabase
    .from("maintenance_requests")
    .select("id", { count: "exact", head: true })
    .eq("technician_id", technicianId)
    .eq("status", "requested");
  const { count: scheduledCount } = await supabase
    .from("maintenance_requests")
    .select("id", { count: "exact", head: true })
    .eq("technician_id", technicianId)
    .in("status", ["confirmed", "rescheduled"]);
  const { count: openTicketsCount } = await supabase
    .from("support_tickets")
    .select("id", { count: "exact", head: true })
    .eq("assigned_to", technicianId)
    .in("status", ["open", "assigned", "waiting_customer"]);

  return (
    <div className="mx-auto flex max-w-[900px] flex-col gap-6 px-4 py-16">
      <div>
        <h1 className="text-2xl font-bold text-text">Panel técnico</h1>
        <p className="text-sm text-text-muted">Mantenimientos y tickets asignados a ti.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link href="/tecnico/mantenimientos" className="flex flex-col gap-1 rounded-lg border border-border p-4 hover:border-brand">
          <span className="text-sm text-text-muted">Solicitudes por confirmar</span>
          <span className="text-2xl font-bold text-text">{pendingConfirmCount ?? 0}</span>
        </Link>
        <Link href="/tecnico/mantenimientos" className="flex flex-col gap-1 rounded-lg border border-border p-4 hover:border-brand">
          <span className="text-sm text-text-muted">Visitas agendadas</span>
          <span className="text-2xl font-bold text-text">{scheduledCount ?? 0}</span>
        </Link>
        <Link href="/tecnico/tickets" className="flex flex-col gap-1 rounded-lg border border-border p-4 hover:border-brand sm:col-span-2">
          <span className="text-sm text-text-muted">Tickets de soporte abiertos</span>
          <span className="text-2xl font-bold text-text">{openTicketsCount ?? 0}</span>
        </Link>
      </div>
    </div>
  );
}
