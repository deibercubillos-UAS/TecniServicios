import { z } from "zod";

export const requestResetSchema = z.object({
  email: z.email("Correo inválido"),
});

export const confirmPasswordSchema = z.object({
  password: z.string().min(8, "Mínimo 8 caracteres").max(72),
});

export type RequestResetInput = z.infer<typeof requestResetSchema>;
export type ConfirmPasswordInput = z.infer<typeof confirmPasswordSchema>;
