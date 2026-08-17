import type { Metadata } from "next";
import { cookies } from "next/headers";
import { createServerClient } from "@tecni/db";
import { serverEnv } from "@tecni/shared";

import { greeting } from "@/lib/greeting";
import { StatCard } from "@/components/stat-card";

export const metadata: Metadata = {
  title: "Panel técnico",
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
  const { data: profileData } = userData.user
    ? await supabase.from("profiles").select("full_name").eq("id", userData.user.id).maybeSingle()
    : { data: null };
  const firstName = ((profileData?.full_name as string | undefined) ?? "").trim().split(" ")[0] || null;

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
    <div className="mx-auto flex max-w-[1000px] flex-col gap-8 px-4 py-12 sm:py-16">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-extrabold text-text">
          {greeting()}
          {firstName ? `, ${firstName}` : ""}
        </h1>
        <p className="text-sm text-text-muted">Mantenimientos y tickets asignados a ti.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard href="/tecnico/mantenimientos" label="Solicitudes por confirmar" value={pendingConfirmCount ?? 0} icon="wrench" tone="warning" />
        <StatCard href="/tecnico/mantenimientos" label="Visitas agendadas" value={scheduledCount ?? 0} icon="wrench" />
        <StatCard href="/tecnico/tickets" label="Tickets de soporte abiertos" value={openTicketsCount ?? 0} icon="chat" tone="warning" />
      </div>
    </div>
  );
}
