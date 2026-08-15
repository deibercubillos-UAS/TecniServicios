"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient, createServiceRoleClient } from "@tecni/db";
import { serverEnv } from "@tecni/shared";
import { createMaintenanceAvailability, deleteMaintenanceAvailability } from "@tecni/core";

async function getSessionClient() {
  const cookieStore = await cookies();
  const client = createServerClient(serverEnv.NEXT_PUBLIC_SUPABASE_URL, serverEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    getAll: () => cookieStore.getAll(),
    setAll: (list) => {
      for (const { name, value, options } of list) {
        cookieStore.set(name, value, options);
      }
    },
  });
  const { data: userData } = await client.auth.getUser();
  if (!userData.user) {
    redirect("/login?next=/admin/mantenimientos");
  }
  return { client, userId: userData.user!.id };
}

export async function createMaintenanceAvailabilityAction(formData: FormData): Promise<void> {
  const availableDate = String(formData.get("availableDate") ?? "");
  const maxVisits = Number.parseInt(String(formData.get("maxVisits") ?? ""), 10);
  const notes = String(formData.get("notes") ?? "");
  const technicianId = String(formData.get("technicianId") ?? "");
  const department = String(formData.get("department") ?? "");
  const city = String(formData.get("city") ?? "");

  if (!availableDate || Number.isNaN(maxVisits) || maxVisits <= 0) {
    redirect("/admin/mantenimientos?error=" + encodeURIComponent("Fecha o cupo inválidos."));
  }

  const { client, userId } = await getSessionClient();
  const serviceClient = createServiceRoleClient(serverEnv.NEXT_PUBLIC_SUPABASE_URL, serverEnv.SUPABASE_SERVICE_ROLE_KEY);

  try {
    await createMaintenanceAvailability(
      client,
      serviceClient,
      {
        availableDate,
        maxVisits,
        ...(notes ? { notes } : {}),
        ...(technicianId ? { technicianId } : {}),
        ...(department ? { department } : {}),
        ...(city ? { city } : {}),
      },
      { actorId: userId },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "No se pudo abrir la fecha.";
    redirect("/admin/mantenimientos?error=" + encodeURIComponent(message));
  }

  redirect("/admin/mantenimientos?created=1");
}

const WEEKDAY_KEYS: Record<number, string> = { 0: "sun", 1: "mon", 2: "tue", 3: "wed", 4: "thu", 5: "fri", 6: "sat" };

function datesBetween(startDate: string, endDate: string, allowedWeekdays: Set<string>): string[] {
  const dates: string[] = [];
  const cursor = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  while (cursor <= end) {
    const key = WEEKDAY_KEYS[cursor.getDay()];
    if (key && allowedWeekdays.has(key)) {
      dates.push(cursor.toISOString().slice(0, 10));
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

/** Genera disponibilidad para varios días y varios técnicos de una sola
 * vez — un insert por combinación (fecha × técnico), reusando la misma
 * validación de `createMaintenanceAvailability` (incluida la unicidad
 * fecha+técnico). Combinaciones ya abiertas se saltan en vez de romper
 * el lote completo. */
export async function createMaintenanceAvailabilityBulkAction(formData: FormData): Promise<void> {
  const startDate = String(formData.get("startDate") ?? "");
  const endDate = String(formData.get("endDate") ?? "");
  const maxVisits = Number.parseInt(String(formData.get("bulkMaxVisits") ?? ""), 10);
  const notes = String(formData.get("bulkNotes") ?? "");
  const department = String(formData.get("department") ?? "");
  const city = String(formData.get("city") ?? "");
  const technicianIds = formData.getAll("technicianIds").map(String).filter(Boolean);
  const allowedWeekdays = new Set(formData.getAll("weekdays").map(String));

  if (!startDate || !endDate || startDate > endDate) {
    redirect("/admin/mantenimientos?error=" + encodeURIComponent("El rango de fechas es inválido."));
  }
  if (Number.isNaN(maxVisits) || maxVisits <= 0) {
    redirect("/admin/mantenimientos?error=" + encodeURIComponent("El cupo por día es inválido."));
  }
  if (technicianIds.length === 0) {
    redirect("/admin/mantenimientos?error=" + encodeURIComponent("Selecciona al menos un técnico para generar varias fechas."));
  }
  if (allowedWeekdays.size === 0) {
    redirect("/admin/mantenimientos?error=" + encodeURIComponent("Selecciona al menos un día de la semana."));
  }

  const dates = datesBetween(startDate, endDate, allowedWeekdays);
  if (dates.length === 0) {
    redirect("/admin/mantenimientos?error=" + encodeURIComponent("Ese rango no incluye ningún día de la semana seleccionado."));
  }
  if (dates.length * technicianIds.length > 200) {
    redirect("/admin/mantenimientos?error=" + encodeURIComponent("Ese lote es demasiado grande (más de 200 combinaciones) — acórtalo."));
  }

  const { client, userId } = await getSessionClient();
  const serviceClient = createServiceRoleClient(serverEnv.NEXT_PUBLIC_SUPABASE_URL, serverEnv.SUPABASE_SERVICE_ROLE_KEY);

  let created = 0;
  let skipped = 0;
  for (const availableDate of dates) {
    for (const technicianId of technicianIds) {
      try {
        await createMaintenanceAvailability(
          client,
          serviceClient,
          {
            availableDate,
            maxVisits,
            technicianId,
            ...(notes ? { notes } : {}),
            ...(department ? { department } : {}),
            ...(city ? { city } : {}),
          },
          { actorId: userId },
        );
        created += 1;
      } catch {
        skipped += 1;
      }
    }
  }

  redirect(`/admin/mantenimientos?bulkCreated=${created}&bulkSkipped=${skipped}`);
}

export async function deleteMaintenanceAvailabilityAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) {
    redirect("/admin/mantenimientos?error=" + encodeURIComponent("Disponibilidad inválida."));
  }

  const { client, userId } = await getSessionClient();
  const serviceClient = createServiceRoleClient(serverEnv.NEXT_PUBLIC_SUPABASE_URL, serverEnv.SUPABASE_SERVICE_ROLE_KEY);

  try {
    await deleteMaintenanceAvailability(client, serviceClient, id, { actorId: userId });
  } catch (err) {
    const message = err instanceof Error ? err.message : "No se pudo cerrar la fecha.";
    redirect(`/admin/mantenimientos?error=` + encodeURIComponent(message));
  }

  redirect("/admin/mantenimientos?deleted=1");
}
