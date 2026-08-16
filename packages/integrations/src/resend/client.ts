export interface ResendConfig {
  apiKey: string;
  fromEmail: string;
}

export interface SendMaintenanceReminderEmailInput {
  to: string;
  companyName: string;
  equipmentName: string;
  serialNumber: string | null;
  dueDate: string;
}

function formatDateEs(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(year!, (month ?? 1) - 1, day)).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

/**
 * Cliente Resend real (REST directa, sin SDK — mismo criterio liviano
 * que r2/client.ts) — docs/10-INTEGRATION-RESEND.md. Nunca se llama con
 * credenciales fabricadas: `config` viene siempre de `serverEnv.RESEND_*`,
 * y si esas variables no están configuradas, la función lanza en vez de
 * fallar silenciosamente.
 */
export async function sendMaintenanceReminderEmail(config: ResendConfig, input: SendMaintenanceReminderEmailInput): Promise<void> {
  const dueDateLabel = formatDateEs(input.dueDate);
  const serialLine = input.serialNumber ? ` (serie ${input.serialNumber})` : "";

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: config.fromEmail,
      to: [input.to],
      subject: `Recordatorio: mantenimiento de ${input.equipmentName} programado para el ${dueDateLabel}`,
      html: `
        <p>Hola, equipo de ${input.companyName}:</p>
        <p>Su equipo <strong>${input.equipmentName}</strong>${serialLine} tiene programado
        mantenimiento preventivo para el <strong>${dueDateLabel}</strong> (en 15 días).</p>
        <p>Escríbanos o ingresen a su cuenta para agendar la visita con anticipación.</p>
        <p>Tecni Equipos y Servicios SAS</p>
      `.trim(),
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Resend respondió ${response.status}: ${body}`);
  }
}
