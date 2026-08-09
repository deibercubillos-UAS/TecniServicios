# 21 — Roadmap

Volver a [`00-INDEX.md`](./00-INDEX.md)

Siete fases. **Cada fase termina desplegada y funcionando**, no en una rama.
No se avanza a la siguiente sin cumplir la definición de "listo".

---

## Fase 0 — Fundación

**Objetivo:** que exista un esqueleto desplegable y seguro.

- Monorepo Turborepo + pnpm, con los paquetes de `01-ARCHITECTURE.md`
- Next.js 15, TypeScript estricto, Tailwind v4, ESLint, Prettier
- Tokens de diseño y fuente Montserrat cargados
- Proyectos Supabase (`staging` y `prod`) creados
- GitHub con ramas protegidas + CI (lint, typecheck, build)
- Vercel conectado, Cloudflare configurado
- Logo en `public/brand/`
- `CLAUDE.md` y `/docs` en el repositorio

**Listo cuando:** una página en blanco con el header y el logo está desplegada en
producción, el CI pasa y ningún secreto está en el repositorio.

---

## Fase 1 — Identidad y datos ✅ Listo

**Objetivo:** que un usuario pueda registrarse y su empresa exista, con RLS real.

- Migraciones de `profiles`, `companies`, `company_members`, `settings`, `audit_log`
- **RLS habilitada y probada** en las cinco tablas
- Registro, login, verificación de correo, recuperación de contraseña
- Middleware de rutas con los cinco roles
- Resend con dominio verificado (SPF, DKIM, DMARC)
- Pruebas de aislamiento entre empresas corriendo en CI

**Listo cuando:** el usuario de la empresa A no puede leer ni una fila de la
empresa B, demostrado por una prueba automatizada que bloquea el merge.

⚠️ **Esta es la fase más importante del proyecto.** Un error aquí se propaga a
todo lo demás y es carísimo de corregir después.

---

## Fase 2 — Catálogo público ✅ Listo

**Objetivo:** un catálogo navegable, sin precios para anónimos.

- Migraciones de `categories`, `brands`, `products`, `product_images`,
  `attribute_definitions`, `product_attributes`
- Home migrado desde Stitch
- Listado con filtros por categoría, marca y atributos filtrables
- Búsqueda de texto completo en español
- Ficha de producto con especificaciones por categoría
- Comparador de máximo 3 productos de la misma categoría
- Página de contacto
- SEO: metadatos, sitemap, JSON-LD **sin precios**
- `SiigoMockClient` para desarrollar sin credenciales

**Listo cuando:** un anónimo navega todo el catálogo y en ninguna parte —HTML,
JSON, metadatos— aparece un precio. Verificado con "ver código fuente".

---

## Fase 3 — Comercio ✅ Listo

**Objetivo:** vender.

- RLS real y probada en las 8 tablas de comercio (`carts`, `cart_items`,
  `quotes`, `quote_items`, `orders`, `order_items`, `payments`, `shipments`)
- Precios visibles solo para autenticados (sin cambios sobre `resolvePrice()`
  de la Fase 2)
- Carrito con la regla del umbral de `settings.quote_threshold_cop`, dividido
  visible entre compra directa y cotización antes de pagar
- Flujo de solicitud de cotización → vista del cliente → aceptación → pedido
- Checkout directo → `WompiMockClient` → webhook con verificación de firma
  real (nunca desactivada) → `orders.status = 'paid'`
- Pedidos: lista, detalle, estados, carga manual de guía de envío
  (`/ventas/pedidos`, solo vendedor/master)
- Factura visible en el detalle del pedido — "pendiente de sincronización"
  mientras no exista Siigo/R2 real, sin fabricar un enlace
- `/mi-cuenta`: resumen de pedidos, cotizaciones y datos de la empresa
- `audit_log` real en cada cotización/pedido creado o cambiado

**Desviación deliberada, documentada desde el inicio de la tarea:** sin
credenciales reales de Siigo ni Wompi (`PENDIENTE-DECISIÓN`,
`progress/TODO.md`), toda la fase se construyó contra `SiigoMockClient`
(ya existía) y `WompiMockClient` (nuevo, mismo contrato que el cliente real).
Las cotizaciones tampoco se sincronizan desde Siigo todavía — la web las
crea y las muestra, pero el consecutivo real (`siigo_number`) y el estado
`sent` los pondría Siigo, no la web. Se reemplaza sin tocar el código que lo
consume el día que existan credenciales.

**Listo cuando:** una compra real de punta a punta funciona, el pago se concilia
por webhook y el pedido queda con su guía y su factura. ✅ — con mocks
determinísticos mientras Siigo/Wompi siguen `PENDIENTE-DECISIÓN`.

---

## Fase 4 — Postventa ✅ Listo

**Objetivo:** el diferenciador frente a un catálogo cualquiera.

- RLS real y probada en las 5 tablas de postventa (`owned_equipment`,
  `maintenance_requests`, `maintenance_reports`, `support_tickets`,
  `ticket_messages`)
- `owned_equipment` generado al marcar un pedido como entregado
  (`markOrderDelivered`, primer botón real en `/ventas/pedidos`)
- `/mi-cuenta/equipos`: lista y detalle de equipos adquiridos, manual
  "pendiente de sincronización" (sin R2 real todavía)
- Agendamiento de mantenimiento por el cliente, confirmación y
  reprogramación por el técnico (`/tecnico/mantenimientos`, primer uso
  real del prefijo `/tecnico`), reporte al completar
- Tickets de soporte: el cliente abre y responde, el staff modera con
  notas internas que **nunca** llegan al cliente (`/tecnico/tickets`)
- `audit_log` real en el único evento de esta fase que toca "pedido"
  (`markOrderDelivered`)

**Desviación deliberada, documentada desde el inicio de la tarea:** sin
R2 (`docs/11-STORAGE-R2.md`, sin empezar), los manuales y los adjuntos de
reportes/tickets quedan como "pendiente de sincronización", mismo
criterio que la factura en la Fase 3. Sin panel de asignación de técnico
todavía — se asigna desde `/ventas` (política `maintenance_assign_staff`)
o vía SQL mientras no exista ese panel. **Panel de vendedor completo
(clientes, agenda de visitas) reclasificado como pendiente** — no se
construyó en esta fase, queda para cuando el negocio lo priorice. Sin
notificaciones por correo — bloqueado por dominio de producción
(`progress/TODO.md`).

**Listo cuando:** un cliente agenda un mantenimiento, el técnico lo confirma y
ejecuta, y el reporte queda en el historial del equipo. ✅ — de punta a
punta con datos reales, sin archivos servidos desde R2 todavía.

---

## Fase 5 — Panel maestro y contenido ✅ Listo

**Objetivo:** que Tecni opere el sitio sin desarrollador.

- CRUD de productos, categorías, marcas — sin atributos dinámicos por
  categoría, anotado como desviación deliberada (paso aparte si hace falta)
- Gestión de banners y promociones con vigencia
- Blog con borradores, publicar/despublicar y programación —
  cuerpo en texto/markdown plano, sin editor WYSIWYG
- Usuarios, roles y permisos — cambio de rol auditado desde el primer
  uso, corrige la deuda de `registerUser`
- Configuración global (incluido el umbral de cotización)
- Visor de auditoría con filtros
- Métricas básicas (conteos reales, sin gráficas)

**Listo cuando:** el master publica un producto nuevo, cambia un banner y publica
un artículo sin tocar código ni pedir un despliegue. ✅ — de punta a punta con
datos reales, sin subida de archivos todavía (depende de `11-STORAGE-R2.md`,
sin empezar).

---

## Fase 6 — Endurecimiento 🟡 Parcial — bloqueada en un punto, ver abajo

**Objetivo:** que soporte tráfico real y cumpla la ley.

- Auditoría de seguridad completa contra el checklist de `05-RLS-SECURITY-B.md` ✅
- Optimización de rendimiento (Core Web Vitals, imágenes, caché) 🟡 — 34 índices
  faltantes corregidos; auditoría real con Lighthouse contra datos reales
  pendiente de un preview de Vercel (sandbox de desarrollo sin credenciales)
- Accesibilidad WCAG 2.1 AA en las pantallas principales ✅ — checklist creado
  y aplicado (landmark `<main>`, `role="alert"` en 27 mensajes de error)
- Ley 1581: política de tratamiento, consentimiento registrado, flujo de supresión ✅
- Términos, políticas de garantía, envíos y devoluciones ✅ — publicadas como
  borrador, sujetas a revisión legal antes de producción
- Monitoreo, alertas y respaldos verificados (probar la restauración, no solo
  el respaldo) 🟡 — integración de monitoreo de errores lista sin proveedor
  activo; **restauración de respaldo BLOQUEADA**: el proyecto Supabase real
  está en plan Free (sin respaldos automáticos diarios, sin poder crear una
  rama de prueba sin gasto real) — el usuario decidió no autorizar el gasto
  por ahora, ver `docs/tasks/done/DONE-fase-6-endurecimiento-C.md` paso 6.2
- Documentación de operación para el equipo de Tecni ✅ — `24-OPERATIONS.md`

**Listo cuando:** la restauración de un respaldo se probó con éxito y la política
de datos está publicada y aceptada en el registro. **No se cumple todavía** — la
política de datos sí está publicada (borrador), pero la restauración de respaldo
sigue bloqueada por el plan de Supabase. La fase se cierra igual porque el resto
del alcance está completo y el bloqueo depende de una decisión de negocio (subir
de plan), no de trabajo pendiente — retomar el paso 6.3 cuando se decida.

---

## Fase 7 — APK (futuro)

No se planifica en detalle todavía, pero **toda decisión anterior debe respetarla**:

- La app móvil consume `/api/v1` sin cambios en el backend
- Prioridad para el técnico: agenda, reportes en sitio, foto y firma, offline
- Segunda prioridad: cliente, para tickets y seguimiento de pedidos

Ver `22-MOBILE-READINESS.md`. **Regla vigente desde hoy:** si una funcionalidad
solo se puede usar desde el navegador porque la lógica quedó en el componente,
está mal construida.

---

## Estado

| Fase | Estado |
|---|---|
| 0 | ✅ Listo (código) — quedan tareas operativas del usuario en `progress/TODO.md` |
| 1 | ✅ Listo — RLS real y probada en las 5 tablas de identidad, registro/login/verificación/recuperación, middleware por rol. Excepción: Resend con dominio verificado queda pendiente (sin dominio de producción todavía, ver `progress/TODO.md`) |
| 2 | ✅ Listo — catálogo público sin precios para anónimos, listado, búsqueda, ficha, comparador, contacto, SEO |
| 3 | ✅ Listo — carrito con umbral, cotización, checkout con Wompi (mock), webhook verificado, pedidos, `/mi-cuenta`, `audit_log` real |
| 4 | ✅ Listo — `owned_equipment` al entregar, mantenimiento (agendar → confirmar → reportar), tickets con notas internas |
| 5 | ✅ Listo — panel maestro completo (catálogo, contenido, configuración, usuarios con cambio de rol auditado, auditoría, métricas) |
| 6 | 🟡 Parcial — ver detalle arriba, bloqueada en la restauración de respaldo por el plan de Supabase |
| 7 | ⬜ Pendiente |

Tareas abiertas en `progress/TODO.md`.
