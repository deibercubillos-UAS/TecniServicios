import { z } from "zod";

/** Versión de la política de tratamiento de datos vigente (05-RLS-SECURITY.md
 * sección 8). Sube cuando cambie el texto legal — nunca se reescribe un
 * registro histórico, solo se agregan versiones nuevas. */
export const DATA_POLICY_VERSION = "2026-08-08-v1";

export const registerSchema = z.object({
  fullName: z.string().trim().min(3, "Nombre muy corto").max(200),
  email: z.email("Correo inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres").max(72),
  phone: z.string().trim().min(7).max(20).optional(),
  documentType: z.literal("NIT"),
  documentNumber: z.string().trim().min(5, "NIT inválido").max(20),
  companyLegalName: z.string().trim().min(3).max(200).optional(),
  acceptsDataConsent: z.literal(true, {
    error: "Debes autorizar el tratamiento de datos para continuar.",
  }),
});

export type RegisterInput = z.infer<typeof registerSchema>;
