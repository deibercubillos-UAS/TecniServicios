import { z } from "zod";

/**
 * Validación de variables de entorno (docs/19-DEPLOYMENT.md sección 5).
 *
 * Dos esquemas separados: `serverSchema` ve todo el entorno; `clientSchema`
 * solo las variables que pueden llegar al navegador. Nunca se pasa
 * `process.env` completo al esquema de cliente — cada variable se enumera
 * a mano. Si falta o es inválida una variable, el módulo lanza al
 * importarse: la app no arranca con una variable indefinida.
 */

const serverSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  // Siigo Nube Pro
  SIIGO_USERNAME: z.string().min(1),
  SIIGO_ACCESS_KEY: z.string().min(1),
  SIIGO_PARTNER_ID: z.string().min(1),
  SIIGO_BASE_URL: z.url(),

  // Wompi
  WOMPI_PUBLIC_KEY: z.string().min(1),
  WOMPI_PRIVATE_KEY: z.string().min(1),
  WOMPI_EVENTS_SECRET: z.string().min(1),
  WOMPI_INTEGRITY_SECRET: z.string().min(1),

  // Resend
  RESEND_API_KEY: z.string().min(1),
  RESEND_FROM_EMAIL: z.email(),

  // Cloudflare R2
  R2_ACCOUNT_ID: z.string().min(1),
  R2_ACCESS_KEY_ID: z.string().min(1),
  R2_SECRET_ACCESS_KEY: z.string().min(1),
  R2_BUCKET_NAME: z.string().min(1),
  R2_PUBLIC_URL: z.url(),

  // App
  NEXT_PUBLIC_SITE_URL: z.url(),
});

const clientSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_SITE_URL: z.url(),
  // Sin prefijo NEXT_PUBLIC_ en el nombre, pero es pública por diseño
  // (docs/19-DEPLOYMENT.md sección 4): la pasarela la expone al navegador.
  WOMPI_PUBLIC_KEY: z.string().min(1),
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
