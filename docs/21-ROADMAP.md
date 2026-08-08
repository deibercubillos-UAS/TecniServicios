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

## Fase 1 — Identidad y datos

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

## Fase 2 — Catálogo público

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

## Fase 3 — Comercio

**Objetivo:** vender.

- Integración real con Siigo: precios y cotizaciones
- Precios visibles solo para autenticados
- Carrito con la regla del umbral de $5.000.000 COP
- Flujo de solicitud de cotización con notificación al vendedor
- Cotizaciones sincronizadas desde Siigo, visibles para cliente y vendedor
- Aceptación de cotización → pedido
- Checkout con Wompi + webhook con verificación de firma
- Pedidos, estados, carga manual de guía de envío
- Facturas visibles en el dashboard
- Dashboard del cliente: pedidos, cotizaciones, facturas, empresa

**Listo cuando:** una compra real de punta a punta funciona, el pago se concilia
por webhook y el pedido queda con su guía y su factura.

---

## Fase 4 — Postventa

**Objetivo:** el diferenciador frente a un catálogo cualquiera.

- `owned_equipment` generado al entregar un pedido
- Manuales privados en R2, servidos con URL firmada, solo a quien compró
- Agendamiento de mantenimiento por el cliente
- Panel de técnico: confirmar, reprogramar, ejecutar, reportar
- Tickets de soporte con notas internas
- Panel de vendedor: clientes, cotizaciones, pedidos, agenda de visitas
- Notificaciones por correo en cada cambio de estado

**Listo cuando:** un cliente agenda un mantenimiento, el técnico lo confirma y
ejecuta, y el reporte queda en el historial del equipo.

---

## Fase 5 — Panel maestro y contenido

**Objetivo:** que Tecni opere el sitio sin desarrollador.

- CRUD de productos, categorías, marcas, atributos por categoría
- Gestión de banners y promociones con vigencia
- Blog con editor, borradores y programación
- Usuarios, roles y permisos
- Configuración global (incluido el umbral de cotización)
- Visor de auditoría
- Métricas básicas

**Listo cuando:** el master publica un producto nuevo, cambia un banner y publica
un artículo sin tocar código ni pedir un despliegue.

---

## Fase 6 — Endurecimiento

**Objetivo:** que soporte tráfico real y cumpla la ley.

- Auditoría de seguridad completa contra el checklist de `05-RLS-SECURITY.md`
- Optimización de rendimiento (Core Web Vitals, imágenes, caché)
- Accesibilidad WCAG 2.1 AA en las pantallas principales
- Ley 1581: política de tratamiento, consentimiento registrado, flujo de supresión
- Términos, políticas de garantía, envíos y devoluciones
- Monitoreo, alertas y respaldos verificados (probar la restauración, no solo el respaldo)
- Documentación de operación para el equipo de Tecni

**Listo cuando:** la restauración de un respaldo se probó con éxito y la política
de datos está publicada y aceptada en el registro.

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
| 1–7 | ⬜ Pendiente |

Tareas abiertas en `progress/TODO.md`.
