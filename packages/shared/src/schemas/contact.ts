import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().min(2, "Ingresa tu nombre"),
  email: z.email("Correo inválido"),
  phone: z.string().min(7, "Teléfono inválido").optional().or(z.literal("")),
  message: z.string().min(10, "Cuéntanos un poco más — mínimo 10 caracteres"),
});

export type ContactInput = z.infer<typeof contactSchema>;
