import { z } from "zod";

/**
 * Validación de variables de entorno (docs/19-DEPLOYMENT.md sección 5).
 *
 * Dos esquemas separados: `serverSchema` ve todo el entorno; `clientSchema`
 * solo las variables que pueden llegar al navegador. Nunca se pasa
 * `process.env` completo al esquema de cliente — cada variable se enumera
 * a mano. Si falta o es inválida una variable requerida, el módulo lanza al
 * importarse: la app no arranca con una variable indefinida.
 *
 * Siigo, Wompi, Resend y R2 son `.optional()` a propósito: esas
 * integraciones todavía no existen en el código (credenciales
 * "PENDIENTE-DECISIÓN", ver `progress/TODO.md`) y exigirlas rompería el
 * build sin ningún beneficio. Cada bloque pasa a requerido en la migración
 * que conecta esa integración de verdad — ver `progress/DECISIONS.md`,
 * 2026-08-08.
 */

const serverSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

  // Supabase — requeridas: en uso desde la Fase 1.
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  // Siigo Nube Pro — opcional hasta la integración (docs/08).
  SIIGO_USERNAME: z.string().min(1).optional(),
  SIIGO_ACCESS_KEY: z.string().min(1).optional(),
  SIIGO_PARTNER_ID: z.string().min(1).optional(),
  SIIGO_BASE_URL: z.url().optional(),

  // Wompi — opcional hasta la integración (docs/09).
  WOMPI_PUBLIC_KEY: z.string().min(1).optional(),
  WOMPI_PRIVATE_KEY: z.string().min(1).optional(),
  WOMPI_EVENTS_SECRET: z.string().min(1).optional(),
  WOMPI_INTEGRITY_SECRET: z.string().min(1).optional(),

  // Resend — opcional hasta que exista dominio verificado (docs/10).
  RESEND_API_KEY: z.string().min(1).optional(),
  RESEND_FROM_EMAIL: z.email().optional(),

  // Cron (docs/10, docs/19 sección 5) — protege /api/cron/* contra
  // invocaciones externas. Opcional en local/preview; Vercel Cron lo
  // manda solo si la variable existe en el proyecto.
  CRON_SECRET: z.string().min(1).optional(),

  // Cloudflare R2 — opcional hasta la integración (docs/11).
  R2_ACCOUNT_ID: z.string().min(1).optional(),
  R2_ACCESS_KEY_ID: z.string().min(1).optional(),
  R2_SECRET_ACCESS_KEY: z.string().min(1).optional(),
  R2_BUCKET_NAME: z.string().min(1).optional(),
  R2_PUBLIC_URL: z.url().optional(),

  // App — opcional hasta definir el dominio de producción (bloqueante en TODO.md).
  NEXT_PUBLIC_SITE_URL: z.url().optional(),

  // Monitoreo de errores — opcional hasta contratar un proveedor (paso 6.1
  // de ACTIVE-fase-6-endurecimiento-A.md, decisión del usuario cuál).
  // Nombre neutral a propósito, sin atarse a Sentry/Bugsnag/etc. todavía.
  NEXT_PUBLIC_ERROR_TRACKING_DSN: z.url().optional(),
});

const clientSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_SITE_URL: z.url().optional(),
  // Sin prefijo NEXT_PUBLIC_ en el nombre, pero es pública por diseño
  // (docs/19-DEPLOYMENT.md sección 4): la pasarela la expone al navegador.
  // Opcional hasta contratar Wompi (bloqueante en TODO.md).
  WOMPI_PUBLIC_KEY: z.string().min(1).optional(),
  // Un DSN de monitoreo de errores no es secreto por diseño (así lo trata
  // Sentry y equivalentes) — se necesita en el cliente para capturar
  // errores de render, no solo en el servidor.
  NEXT_PUBLIC_ERROR_TRACKING_DSN: z.url().optional(),
});

function formatIssues(error: z.ZodError): string {
  return error.issues
    .map((issue) => `${issue.path.join(".") || "(raíz)"}: ${issue.message}`)
    .join("; ");
}

function parseServerEnv(): z.infer<typeof serverSchema> {
  const result = serverSchema.safeParse(process.env);
  if (!result.success) {
    throw new Error(
      `Variables de entorno de servidor inválidas o faltantes — ${formatIssues(result.error)}. ` +
        "Ver docs/19-DEPLOYMENT.md sección 4 y corre `vercel env pull .env.local`.",
    );
  }
  return result.data;
}

function parseClientEnv(): z.infer<typeof clientSchema> {
  const result = clientSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env["NEXT_PUBLIC_SUPABASE_URL"],
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"],
    NEXT_PUBLIC_SITE_URL: process.env["NEXT_PUBLIC_SITE_URL"],
    WOMPI_PUBLIC_KEY: process.env["WOMPI_PUBLIC_KEY"],
    NEXT_PUBLIC_ERROR_TRACKING_DSN: process.env["NEXT_PUBLIC_ERROR_TRACKING_DSN"],
  });
  if (!result.success) {
    throw new Error(
      `Variables de entorno públicas inválidas o faltantes — ${formatIssues(result.error)}. ` +
        "Ver docs/19-DEPLOYMENT.md sección 4.",
    );
  }
  return result.data;
}

export const serverEnv = parseServerEnv();
export const clientEnv = parseClientEnv();
