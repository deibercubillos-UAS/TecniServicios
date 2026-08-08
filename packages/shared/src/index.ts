/**
 * packages/shared — tipos compartidos y esquemas Zod. Todo input externo
 * se valida con Zod antes de tocar la base de datos (ver
 * docs/01-ARCHITECTURE.md sección 3).
 */
export const SHARED_PACKAGE_NAME = "@tecni/shared";

export { serverEnv, clientEnv } from "./env";
export { registerSchema, DATA_POLICY_VERSION, type RegisterInput } from "./schemas/register";
