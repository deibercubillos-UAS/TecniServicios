# TAREA: Fase 6 — Endurecimiento (parte C: bitácora 5.1+, bloqueos, pendientes)

Parte A (plan): [`ACTIVE-fase-6-endurecimiento-A.md`](./ACTIVE-fase-6-endurecimiento-A.md)
Parte B (bitácora pasos 1.1–4.2, cerrada): [`ACTIVE-fase-6-endurecimiento-B.md`](./ACTIVE-fase-6-endurecimiento-B.md)

## Bitácora

### 2026-08-09 — paso 5.1 (flujo de supresión de datos, Ley 1581)

- **Hecho:** `anonymizeProfile(serviceClient, ctx)` en `packages/core`
  — pone `full_name = 'Usuario eliminado'`, `phone`/`avatar_url` a
  `null`, `is_active = false`; nunca borra la fila ni toca
  `orders`/`payments`/`quotes` (obligación de conservación fiscal,
  `20-COMPLIANCE.md` sección 4); audita `profile.anonymized`. Canal
  del titular: `/mi-cuenta/privacidad` (nuevo) — muestra los datos
  propios y la prueba de consentimiento
  (`consent_accepted_at`/`consent_policy_version`, ya existían desde
  la Fase 1) y un formulario que reutiliza `submitContactMessage`
  (Fase 2) con un mensaje prefijado identificable ("Solicitud Ley
  1581 — Supresión...") — mismo canal transitorio que ya documentaba
  `20-COMPLIANCE.md` sección 5, sin tabla nueva. Canal del master:
  botón "Anonimizar (Ley 1581)" agregado a `/admin/usuarios` por cada
  usuario listado, ejecuta `anonymizeProfileAction` vía
  `serviceClient` (mismo patrón de dos clientes que `markOrderDelivered`
  — el único write que RLS no permite directo).
- **Verificación:** `pnpm typecheck`/`pnpm lint` verdes en los 7
  paquetes. 3 pruebas unitarias nuevas (anonimiza y audita, propaga
  error de update sin auditar, propaga error de auditoría) — 104/104
  en `@tecni/core`. Verificación real vía `execute_sql`: perfil de
  prueba anonimizado (`full_name`/`is_active` confirmados), el pedido
  pagado asociado sigue con el mismo `order_number` sin alterar,
  `audit_log` tiene exactamente 1 fila `profile.anonymized`; un
  `customer` ajeno intenta editar el perfil ya anonimizado — bloqueado
  por `profiles_update_self` (RLS existente desde la Fase 1, no
  tocada). Limpieza completa confirmada con `count(*)`.
- **Archivos:** `packages/core/src/companies/{anonymize-profile.ts,
  anonymize-profile.test.ts}`, `packages/core/src/index.ts`,
  `apps/web/app/(customer)/mi-cuenta/{page.tsx,
  privacidad/{page.tsx,actions.ts}}`,
  `apps/web/app/(staff)/admin/usuarios/{page.tsx,actions.ts}`,
  `docs/20-COMPLIANCE.md` (estado de supresión → ✅).
- **Resultado:** verificación OK. Cierra el paso 5.1. Sigue el 5.2
  (páginas legales públicas).
- **Commit:** `feat(web): flujo de supresión de datos personales (Ley 1581)`

### 2026-08-09 — paso 5.2 (páginas legales públicas)

- **Hecho:** cuatro páginas públicas nuevas, todas Server Components
  estáticos (sin consulta a Supabase, no dependen de sesión):
  `/politica-de-tratamiento-de-datos`, `/terminos-y-condiciones`,
  `/garantia`, `/envios-y-devoluciones`. Contenido grounded en lo que
  la plataforma real ya hace (umbral de cotización configurable,
  precios desde Siigo con fallback "sujeto a confirmación", equipos
  serializados como base de garantía/postventa, envío manual con
  guía+transportadora de la Fase 3, devoluciones vía ticket de
  soporte) — sin inventar procesos que no existen. Cada página lleva
  el mismo aviso de borrador en la parte superior
  (`border-warning bg-warning/10`, "sujeto a revisión legal, no
  constituye asesoría jurídica"). `site-footer.tsx` ganó un
  `<nav aria-label="Legal">` con enlaces a las cuatro. El enlace a
  `/politica-de-tratamiento-de-datos` que se había dejado como texto
  plano en `/mi-cuenta/privacidad` (paso 5.1, porque la página no
  existía todavía) ahora vuelve a ser un `<Link>` real.
- **Verificación:** `pnpm typecheck`/`pnpm lint` verdes en los 7
  paquetes. `pnpm build` compila sin errores de tipo/ruta en las 4
  páginas nuevas — se detiene en "Collecting page data" por la misma
  limitación de siempre en este sandbox (sin credenciales reales de
  Supabase), no por un problema de estas páginas. Sin verificación
  real con Supabase — no aplica, son páginas sin dato de base.
- **Archivos:**
  `apps/web/app/(public)/{politica-de-tratamiento-de-datos,
  terminos-y-condiciones,garantia,envios-y-devoluciones}/page.tsx`
  (nuevos), `apps/web/components/site-footer.tsx`,
  `apps/web/app/(customer)/mi-cuenta/privacidad/page.tsx`.
- **Resultado:** verificación OK. Cierra el paso 5.2 y la **Fase 5
  (Ley 1581 y textos legales) del plan**. Sigue el 6.1 (integración de
  monitoreo de errores, sin cuenta activa).
- **Commit:** `feat(web): páginas legales públicas — política, términos, garantía, envíos`

### 2026-08-09 — paso 6.1 (integración de monitoreo de errores, sin cuenta activa)

- **Hecho:** `NEXT_PUBLIC_ERROR_TRACKING_DSN` opcional en
  `packages/shared/src/env.ts` (server y client schema, mismo patrón
  "opcional hasta la integración" que Siigo/Wompi/Resend/R2), nombre
  neutral a propósito — la decisión de proveedor (Sentry, Bugsnag,
  otro) sigue sin tomar. `apps/web/lib/error-tracking.ts`:
  `reportError(error, context)`, único punto de reporte — sin DSN cae
  a `console.error` (nunca silencioso, queda en los logs de Vercel,
  `24-OPERATIONS.md` sección 2); cuando se contrate un proveedor, se
  inicializa su SDK ahí adentro y el resto del código que ya llama
  `reportError()` no cambia. `apps/web/app/global-error.tsx` nuevo —
  boundary de Next.js App Router para errores de render, única
  excepción de todo el proyecto a "Server Components por defecto"
  (Next.js exige `"use client"` en este archivo específico).
  `.env.example` documenta la variable nueva.
- **Verificación:** `pnpm typecheck`/`pnpm lint` verdes en los 7
  paquetes. `pnpm build` compila sin errores de tipo/ruta en los
  archivos nuevos, se detiene en la misma limitación de siempre
  (variables de entorno reales). Sin pruebas unitarias — es un wrapper
  de `console.error` sin lógica de negocio que probar.
- **Pendiente, anotado, no se resuelve acá:** `reportError()` no está
  todavía cableado dentro de los `catch` de `packages/core` ni de los
  `actions.ts` del proyecto — hoy esos solo devuelven un mensaje
  genérico al cliente (correcto, regla de `CLAUDE.md` sección 7) sin
  registrar el error crudo en servidor más allá de lo que Vercel
  captura por default. Cablearlo en todo el proyecto es un cambio
  transversal grande, fuera de alcance de "dejar preparada la
  integración" — anotado en `progress/TODO.md`.
- **Archivos:** `packages/shared/src/env.ts`,
  `apps/web/lib/error-tracking.ts` (nuevo),
  `apps/web/app/global-error.tsx` (nuevo), `.env.example`.
- **Resultado:** verificación OK. Cierra el paso 6.1. Sigue el 6.2
  (verificar respaldos de Supabase).
- **Commit:** `feat(web): prepara integración de monitoreo de errores, sin proveedor activo`


## Bloqueos

- **Restauración de respaldo (paso 6.3):** requiere confirmar que el plan de
  Supabase del proyecto real soporta branching/point-in-time restore antes de
  intentarlo — se verifica en el paso 6.2 primero.
- **Textos legales (paso 5.2):** se redactan con buena fe pero no sustituyen
  revisión de un abogado — no se marca "listo para producción" sin esa
  revisión externa al equipo.

## Pendientes descubiertos

- **`auth_rls_initplan` (14 políticas, WARN):** reescribir
  `auth.<function>()`/`current_setting()` a `(select auth.<function>())`
  en las políticas de `profiles`, `companies`, `company_members`,
  `quotes`, `quote_items`, `orders`, `maintenance_requests`,
  `owned_equipment`, `maintenance_reports` — mejora real de rendimiento
  a escala, pero toca RLS de 9 tablas, necesita su propia verificación
  con datos reales tabla por tabla. No se resuelve en el paso 2.2.
- ~~`app/(commerce)/pedidos/page.tsx` rompía `pnpm build`~~ —
  **corregido en el paso 3.1** (movida `ORDER_STATUS_LABEL` a
  `lib/order-status.ts`).
- **Auditoría real de Core Web Vitals con Lighthouse** — pendiente de
  un entorno con credenciales reales (preview de Vercel). Ver
  `progress/TODO.md`.
- **Migrar `<img>` a `next/image`** — pendiente de que exista R2 real
  con dominio conocido. Ver `progress/TODO.md`.
- **`multiple_permissive_policies` (15, WARN):** varias tablas de
  contenido (`banners`, `posts`, `promotions`, `categories`, `brands`,
  etc.) tienen dos políticas permisivas para `authenticated`+`SELECT`
  (`X_read_public` + `X_write_master`, esta última con `for all`
  incluye `SELECT`). Se podrían fusionar en una sola política con
  `using (condición_pública or is_master())`, pero es un cambio de
  RLS transversal, no puntual de esta fase.
