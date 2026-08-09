/**
 * Punto único de reporte de errores — paso 6.1 de
 * ACTIVE-fase-6-endurecimiento-A.md. Sin proveedor contratado todavía
 * (`NEXT_PUBLIC_ERROR_TRACKING_DSN` sin valor, decisión pendiente del
 * usuario: Sentry, Bugsnag, u otro). Mientras no haya DSN, cae a
 * `console.error` — nunca silencioso, siempre deja rastro en los logs de
 * Vercel (docs/24-OPERATIONS.md sección 2).
 *
 * Cuando se contrate un proveedor: instalar su SDK, inicializarlo con el
 * DSN acá adentro (una sola vez, sea client o server), y reemplazar el
 * `console.error` de abajo por la llamada real de captura — el resto del
 * código que ya llama `reportError()` no cambia.
 */
export function reportError(error: unknown, context?: Record<string, unknown>): void {
  const dsn = process.env["NEXT_PUBLIC_ERROR_TRACKING_DSN"];
  if (!dsn) {
    console.error("[error-tracking] sin proveedor configurado —", error, context ?? "");
    return;
  }

  // Pendiente en progress/TODO.md: inicializar el SDK real del proveedor
  // elegido y reemplazar este console.error por su captura (p. ej.
  // Sentry.captureException).
  console.error("[error-tracking]", error, context ?? "");
}
