# TAREA: Fase 6 — Endurecimiento (parte B: bitácora, bloqueos, pendientes)

Parte A (plan): [`ACTIVE-fase-6-endurecimiento-A.md`](./ACTIVE-fase-6-endurecimiento-A.md)

## Bitácora

### 2026-08-09 — paso 1.1 (docs/20-COMPLIANCE.md)

- **Hecho:** escrito `docs/20-COMPLIANCE.md` — qué dato se recolecta y su
  base legal, confirmación de que el consentimiento ya se registra desde
  la Fase 1 (`registerUser` graba los tres campos en el mismo insert),
  los seis derechos del art. 8 de la Ley 1581 uno por uno con cómo
  responde (o no responde todavía) la plataforma, retención fiscal
  explicada (facturación no se borra, la respuesta a supresión es
  anonimizar `profiles` sin tocar `orders`/`payments`/`quotes`), rol de
  Siigo en la facturación electrónica (fuera de este repositorio),
  tabla de estado al cierre. Advertencia explícita en el encabezado: no
  sustituye revisión de abogado.
- **Archivos:** `docs/20-COMPLIANCE.md` (nuevo, 108 líneas),
  `docs/00-INDEX.md` (estado 20 → ✅).
- **Resultado:** verificación OK, bajo el límite de 500 líneas. Cierra
  el paso 1.1. Sigue el 1.2 (checklist de accesibilidad en
  `02-DESIGN-SYSTEM.md`).
- **Commit:** `docs(compliance): agrega 20-COMPLIANCE.md`

### 2026-08-09 — paso 1.2 (checklist de accesibilidad)

- **Hecho:** agregada sección 9 ("Accesibilidad — checklist WCAG 2.1 AA") a
  `docs/02-DESIGN-SYSTEM.md`. La sección 1 ya tenía contraste verificado
  (Fase 0) — la nueva cubre lo demás: foco/teclado (incluye atrapar foco en
  modales y `Escape` para cerrar), semántica para lectores de pantalla
  (jerarquía de encabezados, `alt`, `<label>`, `aria-describedby` en
  errores de formulario, `aria-live` en contenido dinámico), estructura
  (landmarks HTML5) y objetivo táctil mínimo 44×44px (conecta con la regla
  ya existente de "móvil primero"). Marcada explícitamente como reusable
  en toda pantalla nueva, no solo para la auditoría puntual del paso 4.1.
- **Archivos:** `docs/02-DESIGN-SYSTEM.md` (235 → 289 líneas).
- **Resultado:** verificación OK, bajo el límite de 500 líneas. Cierra
  el paso 1.2. Sigue el 1.3 (`docs/24-OPERATIONS.md`).
- **Commit:** `docs(design-system): agrega checklist de accesibilidad WCAG 2.1 AA`

### 2026-08-09 — paso 1.3 (docs/24-OPERATIONS.md)

- **Hecho:** escrito `docs/24-OPERATIONS.md` — proveedores y para qué sirve
  cada uno (sin secretos, remite a `19-DEPLOYMENT.md` sección 1), qué
  monitorear y su umbral de atención (errores 5xx, uso de base de datos,
  advisors de seguridad, webhook de Wompi, SSL/DNS, builds), cómo responder
  una alerta paso a paso (incluye rollback de Vercel con "Promote to
  Production" y la regla de nunca migrar en caliente sobre producción sin
  probar antes), procedimiento de respaldo/restauración (**siempre sobre
  una rama de Supabase, nunca directo sobre producción** — la prueba real
  se hace en el paso 6.3), remisión a `19-DEPLOYMENT.md` para el detalle de
  entornos (no lo repite), sección de contactos marcada pendiente de datos
  reales de Tecni.
- **Archivos:** `docs/24-OPERATIONS.md` (nuevo, 90 líneas),
  `docs/00-INDEX.md` (fila 24 nueva, ✅), `CLAUDE.md` (fila del índice de
  documentación, sección 4).
- **Resultado:** verificación OK, ambos archivos bajo el límite de 500
  líneas. Cierra el paso 1.3 y la **Fase 1 (documentación) de esta tarea**.
  Sigue el 2.1 (auditoría de seguridad completa contra el checklist de
  `05-RLS-SECURITY-B.md`).
- **Commit:** `docs(operations): agrega 24-OPERATIONS.md`

### 2026-08-09 — paso 2.1 (auditoría de seguridad completa)

- **Hecho:** `get_advisors` (seguridad) sobre todo el proyecto real —
  6 hallazgos, todos ya conocidos y aceptados en fases previas:
  `product_documents` con RLS habilitada sin política (intencional,
  bloqueada hasta que exista R2, Fase 4), la vista `public_products`
  como `security_definer_view` ERROR (intencional desde la Fase 2 —
  es lo que permite servir catálogo sin precio a `anon` sin darle
  política propia sobre `products`, documentado en
  `05-RLS-SECURITY-A.md`), y las cuatro funciones `security definer`
  ejecutables por `authenticated` (`auth_role`, `auth_company_ids`,
  `auth_assigned_equipment_ids`, `change_user_role` — cada una valida
  internamente, mismo patrón repetido y aceptado desde la Fase 1).
  **Ningún hallazgo nuevo.** Repaso manual de las 8 preguntas del
  checklist sobre todo el repositorio (no solo la última fase): precio
  nunca sale de `resolvePrice()` (grep de `price_cop` fuera de esa
  función confirma que los dos únicos lugares del catálogo público que
  lo consultan lo hacen tras `userId &&`, doble candado con la RLS de
  `products_read_authenticated`); `createServiceRoleClient` solo
  aparece en `actions.ts`/`route.ts`/Server Components, nunca en un
  `"use client"`; `recordAuditLog` cubre las cuatro categorías de la
  regla de oro 8 (rol, pedido, cotización — precio no tiene endpoint
  propio de escritura, viene de Siigo); el único `route.ts` del
  proyecto (webhook de Wompi) nunca filtra un error crudo; Zod sigue
  sin usarse en ningún Server Action (deuda técnica preexistente, sin
  cambio esta fase); sin R2 todavía, nada que firmar.
- **Archivos:** ninguno — auditoría, sin cambios de código.
- **Resultado:** verificación OK, sin hallazgos nuevos. Cierra el paso
  2.1. Sigue el 2.2 (`get_advisors` de rendimiento).
- **Commit:** `docs(fase-6): auditoría de seguridad completa, sin hallazgos nuevos`

### 2026-08-09 — paso 2.2 (get_advisors de rendimiento)

- **Hecho:** `get_advisors` (rendimiento) sobre todo el proyecto — 65
  hallazgos en 4 categorías. **`unindexed_foreign_keys` (34, INFO):**
  toda foreign key del proyecto sin índice de cobertura, en 20 tablas
  — cae directo en la regla de oro de `CLAUDE.md` sección 7 ("índices
  en toda columna usada en WHERE/JOIN/ORDER BY frecuente"), toda FK de
  este esquema se usa en un JOIN o en una política RLS. Corregido con
  una migración de 34 `create index if not exists`, cambio seguro y
  reversible (solo agrega índices, no toca datos ni políticas).
  Confirmado con un segundo `get_advisors`: las 34 desaparecieron.
  **Los otros tres tipos de hallazgo se documentan pero no se
  resuelven en este paso** (serían 3 pasos aparte, tocan RLS de ~15
  tablas, demasiado grande para colar acá sin verificación propia):
  `auth_rls_initplan` (14, WARN) — políticas que reevalúan
  `auth.<function>()` por fila en vez de `(select auth.<function>())`,
  en `profiles`/`companies`/`company_members`/`quotes`/`quote_items`/
  `orders`/`maintenance_requests`/`owned_equipment`/
  `maintenance_reports`; `multiple_permissive_policies` (15, WARN) —
  tablas con dos políticas permisivas para el mismo rol+acción (típico
  `X_read_public` + `X_write_master` ambas alcanzando `SELECT` para
  `authenticated`), se podrían fusionar; `unused_index` (2, INFO,
  preexistentes desde la Fase 2: `products_is_active_is_featured_idx`
  y `products_to_tsvector_idx`) — falso positivo esperado, sin tráfico
  real todavía, los índices sí tienen consumidor real
  (destacados/búsqueda). Los 34 índices nuevos también aparecen como
  "no usados" en la segunda corrida por el mismo motivo — se acepta,
  se empezarán a usar con tráfico real.
- **Archivos:**
  `packages/db/migrations/20260809300000_index_missing_foreign_keys.sql`
  (nuevo, 34 índices).
- **Resultado:** verificación OK — 34/34 hallazgos de índice
  corregidos y confirmados. `auth_rls_initplan`/
  `multiple_permissive_policies` anotados en "Pendientes descubiertos"
  de este archivo y en `progress/TODO.md`, no se resuelven en esta
  fase. Cierra el paso 2.2. Sigue el 2.3 (cabeceras de seguridad).
- **Commit:** `perf(db): indexa las 34 foreign keys sin cobertura detectadas por get_advisors`

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
- **`multiple_permissive_policies` (15, WARN):** varias tablas de
  contenido (`banners`, `posts`, `promotions`, `categories`, `brands`,
  etc.) tienen dos políticas permisivas para `authenticated`+`SELECT`
  (`X_read_public` + `X_write_master`, esta última con `for all`
  incluye `SELECT`). Se podrían fusionar en una sola política con
  `using (condición_pública or is_master())`, pero es un cambio de
  RLS transversal, no puntual de esta fase.
