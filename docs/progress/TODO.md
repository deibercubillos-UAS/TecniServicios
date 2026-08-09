# TODO

Tareas abiertas, ordenadas por prioridad. Se actualiza en cada sesión de trabajo.

---

## Bloqueantes (impiden avanzar)

- [ ] **Urgente:** cambiar el repositorio `TecniServicios` a privado en
      GitHub (Settings → General → Danger Zone → Change visibility).
      Actualmente es público.
- [x] `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
      cargados como GitHub Repository Secrets (2026-08-08). `rls-tests`
      verificado en verde en CI.
      **Recordatorio para más adelante:** borrarlos de GitHub si en el
      futuro se abandona este flujo (ver `progress/DECISIONS.md`,
      2026-08-08).
- [ ] Obtener credenciales de la API de Siigo Nube Pro
- [ ] Confirmar que el plan expone endpoints de cotizaciones
- [ ] Definir el dominio de producción
- [ ] Contratar y configurar Wompi (sandbox primero)
- [ ] Obtener el inventario real de productos y categorías
- [ ] Confirmar las cifras reales de la franja de estadísticas del home
      (años de experiencia, talleres atendidos, referencias en catálogo) —
      hoy están en placeholder visible (`"—"`) con un `TODO` fechado en el
      código, ver `apps/web/app/(public)/page.tsx`. No publicar a
      producción sin reemplazarlas.

## Fase 0 — código completo (ver `tasks/done/DONE-fase-0-fundacion.md`), pendientes operativos abajo

- [x] Inicializar Turborepo + pnpm
- [x] Configurar `apps/web` con Next.js 15 y TypeScript estricto
- [x] Configurar Tailwind v4 con los tokens de `02-DESIGN-SYSTEM.md`
- [x] Cargar Montserrat con `next/font`
- [x] Colocar el logo en `public/brand/` (todas las variantes)
- [x] Crear proyecto Supabase (`tecni`, `sa-east-1`) — **un solo proyecto**,
      desviación de la regla de `staging`/`prod` separados, ver DECISIONS
- [ ] Configurar GitHub: repositorio privado (**urgente**, ver Bloqueantes),
      plantilla de PR ya disponible (sin protección de rama por ahora, ver DECISIONS)
- [x] CI: lint, typecheck, build (verificado en verde en GitHub Actions)
- [x] Conectar Vercel (deploy en verde, confirmado)
- [ ] Conectar Cloudflare — bloqueado: no hay dominio de producción todavía
      (usuario decidió no comprar uno por ahora). Ver "Definir el dominio de
      producción" arriba.
- [x] NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY y
      SUPABASE_SERVICE_ROLE_KEY cargadas en Vercel por el usuario
- [ ] Ejecutar `vercel link` + `vercel env pull .env.local` en la máquina de desarrollo
- [x] Implementar `packages/shared/env.ts` con validación Zod (conectado a
      `apps/web` en la Fase 1, paso 5.2 — Siigo/Wompi/Resend/R2 quedan
      opcionales hasta que cada integración exista, ver DECISIONS)
- [x] Escribir `ADR-0001` a `ADR-0004`

## Fase 1 — código completo (ver `tasks/done/DONE-fase-1-identidad-datos-*.md`)

- [x] RLS real y probada en `profiles`, `companies`, `company_members`,
      `settings`, `audit_log` (con usuarios reales, en CI)
- [x] `/registro`, `/login`, `/verificar`, `/recuperar`
- [x] Trigger `handle_new_user`, Auth Hook `custom_access_token_hook`
      (claim `user_role`)
- [x] `middleware.ts` con `ROUTE_RULES` por rol
- [ ] Resend con dominio verificado — bloqueado, sin dominio de producción
      todavía (mismo bloqueante que Cloudflare). Verificación/recuperación
      usan el correo integrado de Supabase Auth mientras tanto.

## Fase 2 — código completo (ver `tasks/done/DONE-fase-2-catalogo-publico-*.md`)

- [x] RLS real y probada en `categories`, `brands`, `products`,
      `product_images`, `attribute_definitions`, `product_attributes`,
      `contact_messages` (`product_documents` queda sin políticas por
      diseño hasta postventa)
- [x] Home migrada de Stitch, componentes tokenizados en `packages/ui`
- [x] Header global auditado contra el navbar de Stitch
- [x] Listado con filtros, búsqueda de texto completo, ficha de producto,
      comparador (máx. 3, misma categoría)
- [x] Página de contacto (formulario real, `contact_messages`)
- [x] SEO: sitemap, robots.txt, JSON-LD de producto sin precio

## Fase 3 — código completo (ver `tasks/done/DONE-fase-3-comercio-*.md`)

- [x] RLS real y probada en `carts`, `cart_items`, `quotes`, `quote_items`,
      `orders`, `order_items`, `payments`, `shipments`
- [x] `WompiMockClient` para desarrollar sin credenciales (mismo patrón que
      `SiigoMockClient`)
- [x] Carrito con división por umbral, cotización, aceptación → pedido
- [x] Checkout directo, transacción con Wompi, webhook con firma verificada
- [x] `/pedidos`, `/pedidos/[orderNumber]`, `/pedidos/confirmacion`
- [x] `/ventas/pedidos` — carga manual de guía de envío (primer uso real del
      prefijo `/ventas`)
- [x] `/mi-cuenta` — primera pantalla real de esa ruta
- [x] `audit_log` real en cotizaciones y pedidos (hallazgo corregido en el
      paso 10.1, ver `tasks/done/DONE-fase-3-comercio-D.md`)

## Fase 4 — código completo (ver `tasks/done/DONE-fase-4-postventa-*.md`)

- [x] RLS real y probada en `owned_equipment`, `maintenance_requests`,
      `maintenance_reports`, `support_tickets`, `ticket_messages`
- [x] `markOrderDelivered` — genera `owned_equipment` al entregar,
      registrado en `audit_log`
- [x] `/mi-cuenta/equipos`, `/mi-cuenta/mantenimientos`,
      `/mi-cuenta/tickets` — lista, detalle, agendar, responder
- [x] `/tecnico/mantenimientos`, `/tecnico/tickets` — primer uso real del
      prefijo `/tecnico`; confirmar/reprogramar/reportar, notas internas
      que nunca llegan al cliente (verificado con datos reales, incluido
      el conteo)
- [ ] **Panel de asignación de técnico** — hoy se asigna desde `/ventas`
      (política `maintenance_assign_staff`) o vía SQL, sin UI dedicada.
      Reclasificado de "Fase 4" a pendiente sin fase asignada.
- [ ] **Panel de vendedor completo** (clientes, agenda de visitas) —
      estaba en el objetivo original de Fase 4, no se construyó. Sin
      fase asignada todavía.

## Fase 5 — código completo (ver `tasks/done/DONE-fase-5-panel-maestro-*.md`)

- [x] RLS real y probada en `posts`, `banners`, `promotions`, primera
      política real de `settings`, `change_user_role()` (security
      definer) y `company_members_write_master`
- [x] `/admin/productos`, `/admin/categorias`, `/admin/marcas` — CRUD de
      contenido, nunca precio ni stock
- [x] `/admin/banners`, `/admin/blog`, `/admin/promociones` — vigencia,
      publicar/despublicar/programar, alcance producto o categoría
- [x] `/admin/configuracion` — edición de `settings`, empieza por
      `quote_threshold_cop`
- [x] `/admin/usuarios` — cambio de rol de plataforma y rol interno,
      auditado desde el primer uso
- [x] `/admin/auditoria`, `/admin/metricas` — visor de `audit_log` con
      filtros, conteos reales sin gráficas fabricadas
- [ ] **Editor de atributos dinámicos por categoría**
      (`attribute_definitions`/`product_attributes`) — no se construyó
      en `/admin/productos` (paso 4.1), reclasificado a pendiente sin
      fase asignada, mismo criterio que el panel de asignación de
      técnico de la Fase 4.

## Deuda técnica descubierta

- [x] **`pnpm build` fallaba en `app/(commerce)/pedidos/page.tsx`** —
      exportaba `ORDER_STATUS_LABEL`, un named export no válido en un
      `page.tsx` de App Router (Next.js exige que solo exporte
      `default`/`metadata`/etc.; `tsc`/`pnpm typecheck` no lo detecta,
      `next build` sí). Descubierto en el paso 2.3 de la Fase 6 al
      intentar verificar las cabeceras de seguridad con un build real,
      confirmado preexistente con `git stash`. **Corregido en el paso
      3.1**: movida a `apps/web/lib/order-status.ts`, 4 archivos
      actualizados (2 la exportaban/reexportaban sin saberlo, 2 la
      importaban). `pnpm build` ahora avanza hasta necesitar
      credenciales reales. **Sigue sin explicar por qué CI en verde no
      lo atrapó** — revisar si el workflow corre `next build` o solo
      `tsc`/lint.
- [ ] **Auditoría real de Core Web Vitals con Lighthouse contra un
      preview de Vercel** — el paso 3.1 de la Fase 6 no pudo correrla:
      este sandbox no tiene credenciales reales de Supabase (no
      corresponde escribirlas a mano en un `.env.local` acá, regla de
      oro 3) y sin ellas ninguna página renderiza completa; tampoco
      hay `lighthouse` instalado ni acceso a internet para instalarlo.
      Sí se hizo una revisión estática (cero `"use client"`, `next/font`
      autoalojada, cero `next/image` — ver bitácora del paso 3.1).
      Correr Lighthouse real contra un preview de Vercel cuando exista
      uno con datos reales.
- [ ] **Migrar `<img>` nativo a `next/image`** en
      `packages/ui/src/product-card.tsx` y
      `apps/web/app/(public)/catalogo/[slug]/page.tsx` — hallazgo del
      paso 3.1. No se hizo ahí porque `next/image` con imágenes
      externas requiere `remotePatterns` con el dominio conocido, y
      todavía no existe R2 real (`11-STORAGE-R2.md` sin empezar) —
      migrar cuando el dominio de las imágenes sea real y estable.
- [ ] **14 políticas RLS reevalúan `auth.<function>()` por fila**
      (`auth_rls_initplan`, `get_advisors` rendimiento) en `profiles`,
      `companies`, `company_members`, `quotes`, `quote_items`, `orders`,
      `maintenance_requests`, `owned_equipment`, `maintenance_reports` —
      se corrige envolviendo la llamada en `(select auth.<function>())`.
      Descubierto en el paso 2.2 de la Fase 6, no corregido ahí porque
      toca RLS de 9 tablas y necesita verificación propia por tabla.
- [ ] **15 tablas con políticas RLS permisivas duplicadas para el mismo
      rol+acción** (`multiple_permissive_policies`, `get_advisors`
      rendimiento) — patrón `X_read_public` + `X_write_master` (`for
      all`) ambas alcanzan `SELECT` para `authenticated` en
      `banners`/`posts`/`promotions`/`categories`/`brands`/etc. Se
      podrían fusionar en una sola política. Descubierto en el mismo
      paso 2.2, mismo motivo para no resolverlo ahí.
- [x] **`registerUser` (Fase 1) no registra en `audit_log`** — mismo defecto
      que se corrigió en la Fase 3 para cotizaciones/pedidos/pagos, pero
      para cambios de rol. Descubierto en el paso 10.1 de Fase 3, no
      corregido ahí a propósito (unidad de trabajo distinta). **Corregido
      en el paso 6.2 de la Fase 5**: `changeUserRole`/
      `changeCompanyMemberRole` (el único camino real para cambiar rol de
      un usuario que no sea el propio) auditan desde el primer uso.
      `registerUser` en sí sigue sin auditar su propia inserción inicial
      de rol — se acepta porque el registro siempre crea con `role =
      'customer'` por default del esquema, no hay elección de rol que
      auditar en ese punto.
- [ ] **Ningún Server Action del proyecto valida con Zod** — se usa
      `typeof` manual en todos (Fase 1, 2 y 3 por igual). El checklist de
      `05-RLS-SECURITY-B.md` sección 9 lo pide explícitamente; es una
      decisión de arquitectura pendiente (¿vale la pena el cambio de
      patrón en todo el repo, o se deja así?), no un bug puntual.
- [x] **`07-API-CONTRACTS.md` no existía cuando se creó
      `/api/v1/webhooks/wompi`** (paso 7.3) — viola la regla de oro 9
      ("documentar antes de codear"). Descubierto y corregido en el
      paso 10.2 al revisar la lista de documentación pendiente.

## Documentación pendiente

- [x] `03-UI-COMPONENTS.md`
- [x] `07-API-CONTRACTS.md` — escrito tarde (paso 10.2 de Fase 3, debió
      escribirse antes del webhook de Wompi en el paso 7.3 — hallazgo
      del propio checklist "documentar antes de codear", corregido acá)
- [x] `09-INTEGRATION-PAYMENTS.md`
- [ ] `10-INTEGRATION-RESEND.md` — cuando exista dominio de producción
- [ ] `11-STORAGE-R2.md` — antes de servir manuales/adjuntos reales
      (deferido en Fase 4 con la misma honestidad que la factura de
      Fase 3 — "pendiente de sincronización", nunca un enlace fabricado)
- [x] `12-MODULE-CATALOG.md`
- [x] `13-MODULE-COMMERCE.md`
- [x] `14-MODULE-SERVICE.md`
- [ ] `15`/`16` — al iniciar cada módulo
- [x] `18-TESTING.md`
- [ ] `20-COMPLIANCE.md` — antes de recolectar datos reales (ya hay una
      desviación registrada en DECISIONS sobre columnas de consentimiento
      en `profiles`, a formalizar acá)
- [ ] `22-MOBILE-READINESS.md` — antes de la fase 3

## Preguntas abiertas

- [ ] ¿Se sincroniza inventario desde Siigo o se ignora en v1?
- [ ] ¿La factura electrónica DIAN se dispara desde la web o es proceso manual?
- [ ] ¿Un vendedor puede comprar en nombre de un cliente, o solo cotizar?
- [ ] ¿El técnico necesita ver precios para cotizar repuestos en sitio?
