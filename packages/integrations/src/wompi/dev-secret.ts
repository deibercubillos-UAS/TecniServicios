/**
 * Secreto de desarrollo usado por `WompiMockClient` mientras no exista
 * `WOMPI_EVENTS_SECRET` real (docs/09-INTEGRATION-PAYMENTS.md sección 1,
 * `PENDIENTE-DECISIÓN`). Compartido entre quien inicia la transacción
 * (`initiateOrderPayment`) y quien verifica el webhook
 * (`processWompiWebhookEvent`) — si no coincidieran, ninguna firma de
 * prueba pasaría nunca. Se deja de usar el día que exista el secreto real.
 */
export const WOMPI_DEV_EVENTS_SECRET = "wompi-mock-events-secret-dev";
