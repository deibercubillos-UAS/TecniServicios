/**
 * packages/shared — tipos compartidos y esquemas Zod. Todo input externo
 * se valida con Zod antes de tocar la base de datos (ver
 * docs/01-ARCHITECTURE.md sección 3).
 */
export const SHARED_PACKAGE_NAME = "@tecni/shared";

export { serverEnv, clientEnv } from "./env";
export { formatCop } from "./format-cop";
export { registerSchema, DATA_POLICY_VERSION, type RegisterInput } from "./schemas/register";
export { loginSchema, type LoginInput } from "./schemas/login";
export {
  requestResetSchema,
  confirmPasswordSchema,
  type RequestResetInput,
  type ConfirmPasswordInput,
} from "./schemas/recover";
export { contactSchema, type ContactInput } from "./schemas/contact";
