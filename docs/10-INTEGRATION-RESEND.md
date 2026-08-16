# 10 — Integración de correo (Resend)

Volver a [`00-INDEX.md`](./00-INDEX.md) · Módulo en
[`14-MODULE-SERVICE.md`](./14-MODULE-SERVICE.md) · Variables de entorno en
[`19-DEPLOYMENT.md`](./19-DEPLOYMENT.md)

---

## 1. Estado

`PENDIENTE-CONFIGURACIÓN` — el código está completo y en producción, pero
`RESEND_API_KEY` y `RESEND_FROM_EMAIL` todavía no existen en Vercel. Hasta
que el master las cree, el cron de recordatorios corre igual (lee
`owned_equipment`, decide a quién avisar) pero el envío falla con un error
claro y se registra en logs, sin romper el resto del lote.

## 2. Qué existe hoy

Un solo disparador: **recordatorio de mantenimiento preventivo**, 15 días
antes de `owned_equipment.next_maintenance_due_at`
(`docs/tasks/done/DONE-mantenimiento-preventivo-recordatorio.md`). No hay
todavía correos de bienvenida, confirmación de pedido, ni ningún otro
transaccional — se agregan aquí mismo cuando existan.

## 3. Cliente

`packages/integrations/src/resend/client.ts` — `sendMaintenanceReminderEmail(config, input)`.
REST directa a `https://api.resend.com/emails` (sin el SDK oficial, mismo
criterio liviano que `r2/client.ts`). `config` siempre viene de
`serverEnv.RESEND_API_KEY` / `serverEnv.RESEND_FROM_EMAIL` — nunca de un
valor fabricado; si faltan, la función que arma `config` lanza un error
explícito en vez de intentar un envío que fallaría de forma confusa.

## 4. Disparador: recordatorio de mantenimiento

- **Quién lo dispara:** `apps/web/app/api/cron/maintenance-reminders/route.ts`,
  invocado una vez al día por Vercel Cron (`apps/web/vercel.ts`).
- **A quién llega:** `companies.email` de la empresa dueña del equipo — un
  correo por empresa por equipo próximo a vencer, no por usuario individual.
- **Cuándo:** equipos con `is_active = true`, `maintenance_interval_months`
  configurado (por master, `setMaintenanceInterval` en `packages/core`), y
  `next_maintenance_due_at` entre hoy y hoy+15 días — el rango (no una
  igualdad exacta) es una red de seguridad si el cron se salta un día.
- **Idempotencia:** `owned_equipment.maintenance_reminder_sent_for` guarda
  la fecha de vencimiento para la que ya se avisó; el cron no reenvía para
  la misma fecha. Se limpia sola cuando el intervalo cambia o se completa
  un mantenimiento (nuevo ciclo).

## 5. Configuración pendiente en Vercel

1. Crear cuenta en Resend y verificar el dominio de envío (registros DNS en
   Cloudflare — mismo dominio del sitio).
2. `RESEND_API_KEY` → Vercel → Environment Variables (secreta).
3. `RESEND_FROM_EMAIL` → ej. `mantenimiento@tecnisas.co` (no secreta, pero
   solo servidor).
4. `CRON_SECRET` → Vercel → Environment Variables (secreta) — protege el
   endpoint del cron, ver `19-DEPLOYMENT.md`.

Sin estas tres variables, el intervalo se puede editar y
`next_maintenance_due_at` se calcula igual — solo el envío de correo queda
pendiente.
