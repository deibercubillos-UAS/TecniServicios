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

### 2026-08-09 — paso 2.3 (cabeceras de seguridad)

- **Hecho:** ninguna cabecera de `05-RLS-SECURITY-B.md` sección 7
  la aplicaba Next.js/Vercel por defecto — `next.config.ts` estaba
  vacío. Agregado `headers()` global (`source: "/:path*"`, aplica a
  toda ruta): CSP construida en código (no hardcodeada) —
  `connect-src` deriva host y protocolo `wss:` de
  `NEXT_PUBLIC_SUPABASE_URL` en build time, sin secretos (esa variable
  ya es pública en el cliente); `script-src 'self'` sin excepciones
  porque la app no carga ningún script externo todavía (Wompi sigue
  en `WompiMockClient`, sin widget real embebido); `style-src`
  permite `'unsafe-inline'` (Tailwind/Next inyectan `<style>` en
  runtime); `frame-ancestors 'none'` + `X-Frame-Options: DENY`
  redundantes a propósito (cobertura de navegadores viejos que no
  leen CSP). HSTS, X-Content-Type-Options, Referrer-Policy,
  Permissions-Policy tal cual el doc.
- **Verificación:** `pnpm typecheck`/`pnpm lint` verdes en los 7
  paquetes. `pnpm build` falla — **hallazgo real, preexistente, no
  causado por este cambio**: confirmado con `git stash` que
  `app/(commerce)/pedidos/page.tsx` ya rompía el build en `main` antes
  de este paso (exporta `ORDER_STATUS_LABEL`, un export no válido en
  un `page.tsx` de App Router — Next.js exige que un archivo `page`
  solo exporte `default`/`metadata`/etc., `tsc` no lo detecta pero
  `next build` sí). No se corrige acá — fuera de alcance de "cabeceras
  de seguridad", anotado en pendientes. Verificación real de las
  cabeceras: `pnpm dev` + `curl -sI http://localhost:3000/` — las
  seis cabeceras presentes en la respuesta (incluida la 500 esperada
  por faltar variables de entorno reales en este shell); `connect-src`
  cae a `'self'` sin `NEXT_PUBLIC_SUPABASE_URL` cargada, sin romper el
  arranque — confirma que la función no explota con el valor vacío.
- **Archivos:** `apps/web/next.config.ts`.
- **Resultado:** verificación OK sobre las cabeceras mismas. Cierra el
  paso 2.3 y la Fase 2 (auditoría de seguridad) del plan. Sigue el
  3.1 (auditoría de Core Web Vitals).
- **Commit:** `feat(web): agrega cabeceras de seguridad (CSP, HSTS, X-Frame-Options, etc.)`

### 2026-08-09 — paso 3.1 (auditoría de Core Web Vitals)

- **Bloqueo real encontrado y resuelto primero:** `pnpm build` seguía
  roto por el hallazgo anotado en el paso 2.3
  (`ORDER_STATUS_LABEL` exportado desde un `page.tsx`, inválido en
  App Router) — bloqueaba correr Lighthouse contra un build real, así
  que se corrigió acá: la constante se movió a `lib/order-status.ts`
  (nuevo), los 4 archivos que la usaban (2 páginas que la exportaban/
  re-exportaban sin saberlo, 2 que la importaban) actualizados para
  importar del nuevo archivo. `pnpm build` avanza ahora hasta
  "Collecting page data" — se detiene ahí porque este entorno no tiene
  las credenciales reales de Supabase (`NEXT_PUBLIC_SUPABASE_URL`,
  etc.) y **no corresponde escribirlas a mano en un `.env.local` de
  este sandbox** (regla de oro 3 de `CLAUDE.md`: secretos nunca a mano
  en un archivo local, viven en Vercel).
- **Limitación real de este paso:** sin credenciales reales, ninguna
  página del sitio renderiza completa en este entorno (todas dependen
  de datos reales de Supabase) — no se puede correr Lighthouse contra
  un sitio vivo acá. Tampoco hay `lighthouse` instalado ni acceso a
  npm registry para instalarlo. **La auditoría real con Lighthouse
  contra datos reales queda pendiente de un preview de Vercel** (que sí
  tiene las credenciales) — anotado en `progress/TODO.md`.
- **Lo que sí se verificó, revisión estática de código (sin servidor
  vivo):** cero componentes `"use client"` en todo `apps/web/app` — la
  app entera es Server Components, coherente con la regla de
  `CLAUDE.md` sección 7 ("Server Components por defecto") y el mejor
  punto de partida posible para CWV (cero JS de hidratación
  innecesario). `next/font` con Montserrat autoalojada (`layout.tsx`),
  sin request a Google Fonts en runtime. **Hallazgo real, no
  corregido:** cero uso de `next/image` en todo el proyecto — las
  imágenes de producto (`packages/ui/src/product-card.tsx` y
  `catalogo/[slug]/page.tsx`) usan `<img>` nativo. No se migra a
  `next/image` en este paso porque los dominios de las URLs de imagen
  son dinámicos y desconocidos todavía (sin R2 real, `11-STORAGE-R2.md`
  sin empezar) — `next/image` con `remotePatterns` requiere conocer el
  dominio final, adivinarlo ahora sería frágil. Se migra cuando exista
  R2 real y el dominio sea conocido.
- **Archivos:** `apps/web/lib/order-status.ts` (nuevo),
  `apps/web/app/(commerce)/pedidos/page.tsx`,
  `apps/web/app/(commerce)/pedidos/[orderNumber]/page.tsx`,
  `apps/web/app/(staff)/ventas/pedidos/page.tsx`,
  `apps/web/app/(staff)/ventas/pedidos/[orderNumber]/page.tsx`.
- **Resultado:** bloqueo de build corregido y verificado
  (`pnpm typecheck`/`pnpm lint` verdes, `pnpm build` avanza hasta
  necesitar credenciales reales). Auditoría CWV real con Lighthouse
  **no completada** en este entorno — limitación de sandbox, no del
  código, con su plan de seguimiento anotado. Cierra el paso 3.1 con
  esa salvedad explícita. Sigue el 3.2 (corregir hallazgos seguros y
  acotados) — el único hallazgo real de este paso (migrar a
  `next/image`) no es seguro/acotado todavía porque depende de R2, así
  que 3.2 puede no tener nada que corregir hasta que exista R2.
- **Commit:** `fix(web): corrige export inválido en pedidos/page.tsx que rompía pnpm build`

### 2026-08-09 — paso 3.2 (corregir hallazgos de 3.1)

- **Hecho:** ninguno — revisado, el paso 3.1 dejó un solo hallazgo real
  (migrar `<img>` a `next/image`) y no es seguro/acotado todavía: exige
  `remotePatterns` con el dominio real de imágenes, que no existe sin
  R2 (`11-STORAGE-R2.md` sin empezar). Forzarlo ahora significaría
  adivinar un dominio o dejarlo mal configurado — peor que no tocarlo.
  Ya está en `progress/TODO.md` desde el paso 3.1, sin duplicar la
  entrada. El bug de build (el otro hallazgo real de 3.1) ya se
  corrigió en el propio paso 3.1, no quedaba nada pendiente de ese
  lado tampoco.
- **Archivos:** ninguno.
- **Resultado:** paso cerrado sin cambios de código, revisión
  documentada. Cierra el paso 3.2 y la **Fase 3 (rendimiento) del
  plan**. Sigue el 4.1 (auditoría manual de accesibilidad).
- **Commit:** `docs(fase-6): cierra 3.2 sin cambios — único hallazgo depende de R2`

### 2026-08-09 — paso 4.1 (auditoría manual de accesibilidad)

- **Hecho:** revisión estática contra el checklist WCAG 2.1 AA de
  `02-DESIGN-SYSTEM.md` sección 9, sobre home, catálogo, ficha de
  producto, carrito, `/mi-cuenta` (sin ruta `/checkout` separada — el
  pago va embebido en `/carrito`, `packages/core` ya documentado).
  Misma limitación que el paso 3.1: sin credenciales reales no hay
  render vivo para probar con teclado/lector de pantalla de verdad —
  auditoría de código, no interactiva.
- **Cumple:** cero `outline-none` sin reemplazo en todo el proyecto;
  un `<h1>` por carga de página real (dos casos con 2 en el archivo
  son ramas condicionales que nunca coexisten — carrito vacío vs con
  ítems, sin sesión vs con sesión); cero `<img>` sin `alt`; `<html
  lang="es">` en el layout raíz; `<header>`/`<footer>` con landmarks,
  `<nav aria-label="Principal">`; sin animación esencial (solo
  transiciones de hover en CSS, sin carrusel ni `setInterval`); sin
  botón de solo-ícono sin texto (el único caso real,
  `compare-bar.tsx`, tiene texto visible).
- **Hallazgos reales (no corregidos acá, es el objetivo del paso 4.2):**
  1. **Falta landmark `<main>`** — `app/layout.tsx` envuelve el
     contenido en un `<div className="flex-1">` genérico entre
     `<SiteHeader>`/`<SiteFooter>`, no en `<main>`. Arreglo de una
     línea, sin riesgo.
  2. **28 bloques de mensaje de error sin `role="alert"`** — el
     patrón `border-danger bg-danger/10` para errores de formulario,
     repetido en 28 archivos distintos (login, registro, carrito,
     todo `/admin/*`, etc.), nunca lleva `role="alert"` ni
     `aria-live`. Matiz real: casi todos llegan por *redirect* de
     servidor con `?error=` (navegación completa, no una actualización
     en vivo), así que el criterio estricto de "contenido dinámico sin
     recarga" no aplica al pie de la letra — pero `role="alert"` sigue
     ayudando a que un lector de pantalla lo anuncie de inmediato en
     vez de que el usuario tenga que encontrarlo leyendo la página.
- **Archivos:** ninguno — auditoría, sin cambios de código.
- **Resultado:** verificación OK, 2 hallazgos reales documentados y
  acotados para el paso 4.2. Cierra el paso 4.1. Sigue el 4.2
  (corregir hallazgos).
- **Commit:** `docs(fase-6): auditoría manual de accesibilidad — 2 hallazgos reales`

### 2026-08-09 — paso 4.2 (corregir hallazgos de accesibilidad)

- **Hecho:** los dos hallazgos del paso 4.1, ambos cambios acotados y
  seguros. **1)** `app/layout.tsx`: el `<div className="flex-1">` que
  envolvía `{children}` entre `<SiteHeader>`/`<SiteFooter>` pasó a
  `<main className="flex-1">` — landmark real, sin tocar estilos.
  **2)** los 27 bloques de error con el patrón exacto
  `<p className="rounded-[var(--radius)] border border-danger
  bg-danger/10 px-3 py-2 text-sm text-danger">` (login, registro,
  recuperar, verificar, carrito, cotizaciones, contacto, todo
  `/admin/*`, `/mi-cuenta/*`, `/tecnico/*`, `/ventas/pedidos/*`) ahora
  llevan `role="alert"`. El bloque 28 encontrado en el paso 4.1
  (`pedidos/confirmacion/page.tsx`) **no se tocó a propósito** — es un
  patrón distinto (banner de 3 tonos success/danger/pending según el
  estado del pedido, no un mensaje de error de formulario), fuera del
  hallazgo documentado, forzarle `role="alert"` incluso cuando el tono
  es éxito sería incorrecto.
- **Verificación:** `pnpm typecheck`/`pnpm lint` verdes en los 7
  paquetes. Confirmado con grep que los 27 archivos llevan
  `role="alert"` exacto (`grep -rc 'role="alert"'` → 27 archivos con
  1 cada uno). **Misma limitación que 3.1/4.1**: sin credenciales
  reales en este sandbox, `pnpm dev` no renderiza ninguna página
  completa (falla en `parseServerEnv` desde el layout raíz, que
  importa validación de entorno) — no hay forma de confirmar con un
  lector de pantalla real en este entorno. Verificación queda al
  nivel de código, no de render vivo.
- **Archivos:** `apps/web/app/layout.tsx` + 27 archivos de página con
  el bloque de error (login, registro, recuperar, verificar,
  `mi-cuenta/{mantenimientos,tickets,tickets/[id]}`,
  `admin/{marcas,categorias,productos,blog,banners,promociones,configuracion,usuarios}/**`,
  `ventas/pedidos/[orderNumber]`, `tecnico/{mantenimientos,tickets/[id]}`,
  `carrito`, `cotizaciones`, `contacto`).
- **Resultado:** verificación OK a nivel de código. Cierra el paso 4.2
  y la **Fase 4 (accesibilidad) del plan**. Sigue el 5.1 (flujo de
  supresión de datos, Ley 1581).
- **Commit:** `fix(web): agrega landmark <main> y role="alert" en mensajes de error`


## Bloqueos y pendientes

Ver [`ACTIVE-fase-6-endurecimiento-C.md`](./ACTIVE-fase-6-endurecimiento-C.md)
— bitácora desde el paso 5.1 en adelante, más bloqueos y pendientes
vivos de la tarea.
