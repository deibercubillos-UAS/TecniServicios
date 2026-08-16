import { createServiceRoleClient } from "@tecni/db";
import { serverEnv } from "@tecni/shared";
import { sendMaintenanceReminderEmail } from "@tecni/integrations";

interface DueEquipmentRow {
  id: string;
  serial_number: string | null;
  next_maintenance_due_at: string;
  maintenance_reminder_sent_for: string | null;
  companies: { email: string | null; legal_name: string } | null;
  products: { name: string } | null;
}

/**
 * Cron diario (Vercel Cron, `apps/web/vercel.ts`) — avisa por correo 15
 * días antes de `owned_equipment.next_maintenance_due_at`
 * (docs/10-INTEGRATION-RESEND.md, docs/tasks/done/DONE-mantenimiento-
 * preventivo-recordatorio.md). **Riesgoso: exige `CRON_SECRET`, nunca
 * confía en un caller sin verificar el header primero** — mismo criterio
 * que el webhook de Wompi (verificar antes de tocar la base). El rango
 * `<= hoy+15` (no una igualdad exacta) es una red de seguridad si el cron
 * se salta un día; `maintenance_reminder_sent_for` evita reenviar para la
 * misma fecha de vencimiento.
 */
export async function GET(request: Request): Promise<Response> {
  if (!serverEnv.CRON_SECRET || request.headers.get("authorization") !== `Bearer ${serverEnv.CRON_SECRET}`) {
    return Response.json({ error: "No autorizado." }, { status: 401 });
  }

  const serviceClient = createServiceRoleClient(serverEnv.NEXT_PUBLIC_SUPABASE_URL, serverEnv.SUPABASE_SERVICE_ROLE_KEY);

  const today = new Date().toISOString().slice(0, 10);
  const in15Days = new Date();
  in15Days.setUTCDate(in15Days.getUTCDate() + 15);
  const in15DaysIso = in15Days.toISOString().slice(0, 10);

  const { data, error } = await serviceClient
    .from("owned_equipment")
    .select("id,serial_number,next_maintenance_due_at,maintenance_reminder_sent_for,companies(email,legal_name),products(name)")
    .eq("is_active", true)
    .not("next_maintenance_due_at", "is", null)
    .gte("next_maintenance_due_at", today)
    .lte("next_maintenance_due_at", in15DaysIso);

  if (error) {
    return Response.json({ error: "No se pudo consultar equipos." }, { status: 500 });
  }

  // Comparación columna-contra-columna (¿ya se avisó para esta fecha de
  // vencimiento?) — el filtro fluido de PostgREST no soporta eq entre dos
  // columnas, se hace acá.
  const allDue = (data as unknown as DueEquipmentRow[] | null) ?? [];
  const dueEquipment = allDue.filter((e) => e.maintenance_reminder_sent_for !== e.next_maintenance_due_at);

  if (!serverEnv.RESEND_API_KEY || !serverEnv.RESEND_FROM_EMAIL) {
    return Response.json({ sent: 0, failed: 0, skipped: dueEquipment.length, reason: "Resend no configurado." }, { status: 200 });
  }

  const resendConfig = { apiKey: serverEnv.RESEND_API_KEY, fromEmail: serverEnv.RESEND_FROM_EMAIL };

  let sent = 0;
  let failed = 0;
  for (const equipment of dueEquipment) {
    const to = equipment.companies?.email;
    if (!to) {
      failed += 1;
      continue;
    }
    try {
      await sendMaintenanceReminderEmail(resendConfig, {
        to,
        companyName: equipment.companies?.legal_name ?? "cliente",
        equipmentName: equipment.products?.name ?? "su equipo",
        serialNumber: equipment.serial_number,
        dueDate: equipment.next_maintenance_due_at,
      });
      await serviceClient.from("owned_equipment").update({ maintenance_reminder_sent_for: equipment.next_maintenance_due_at }).eq("id", equipment.id);
      sent += 1;
    } catch {
      failed += 1;
    }
  }

  return Response.json({ sent, failed, skipped: 0 }, { status: 200 });
}
