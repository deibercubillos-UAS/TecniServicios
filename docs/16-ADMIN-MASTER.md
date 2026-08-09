# 16 — Panel maestro

Volver a [`00-INDEX.md`](./00-INDEX.md) · Contenido en
[`15-MODULE-CONTENT.md`](./15-MODULE-CONTENT.md) · Roles en
[`06-AUTH-ROLES.md`](./06-AUTH-ROLES.md) · RLS en
[`05-RLS-SECURITY-A.md`](./05-RLS-SECURITY-A.md) +
[`05-RLS-SECURITY-C.md`](./05-RLS-SECURITY-C.md)

---

## 1. Por qué existe

`master` es el único rol que opera el sitio sin desarrollador
(`21-ROADMAP.md` Fase 5). Todo lo que este documento describe vive bajo el
prefijo `/admin`, ya protegido por el middleware desde la Fase 1
(`06-AUTH-ROLES.md` sección 5, `{ prefix: "/admin", roles: ["master"] }`) —
esta fase construye el contenido de esas rutas, no el guardado de acceso,
que ya existe.

**Tres capas, igual que el resto del proyecto** (`05-RLS-SECURITY-A.md`
sección 1): el middleware decide si `master` puede ver la ruta, RLS decide
qué filas puede tocar. Ninguna pantalla de `/admin` confía en que "solo
`master` llega hasta acá" — cada escritura pasa por una política
`*_write_master`/`is_master()` real, probada con un rol inferior real que
la intenta y falla.

---

## 2. Catálogo (`/admin/productos`, `/admin/categorias`, `/admin/marcas`)

CRUD de contenido, **nunca de precio ni stock** — esos son de Siigo
(regla de negocio 5.3 de `CLAUDE.md`). El formulario de producto no tiene
un campo `price_cop` ni `stock_status` editable; si algún día se necesita
forzar un precio manual, es una decisión de negocio aparte
(`PENDIENTE-DECISIÓN`), no un descuido de este formulario.

Campos editables: `name`, `short_description`, `description`,
`category_id`, `brand_id`, `is_active`, `is_featured`,
`warranty_months`. Fotos y manuales quedan como referencia de
texto/URL externa mientras no exista R2 (`docs/11-STORAGE-R2.md`) — sin
subir archivo real en esta fase.

`categories`/`brands`: CRUD simple (`name`, `slug`, `is_active`).

---

## 3. Contenido (`/admin/banners`, `/admin/blog`, `/admin/promociones`)

Documentado en detalle en `15-MODULE-CONTENT.md`. El panel es el único
lugar donde se escribe en `posts`/`banners`/`promotions` — no hay otra
vía (ni Server Action pública, ni `service_role` desde un webhook).

---

## 4. Configuración (`/admin/configuracion`)

Edita `settings` — hoy solo `quote_threshold_cop` (regla de negocio 5.2
de `CLAUDE.md`: "editable desde el panel maestro. Nunca hardcodeado").
`settings` tiene RLS habilitada con **cero políticas** desde la Fase 1
(bloqueada por completo) — esta fase abre la primera política real,
`settings_write_master`, y decide si `master` lee por sesión propia o si
la lectura sigue pasando por `service_role` en el servidor (paso 1.3 de
la tarea, se resuelve ahí con la prueba real, no se asume acá).

Cada cambio de `settings` queda en `audit_log` (regla de oro 8 de
`CLAUDE.md` no lo exige literal para "configuración", pero un cambio de
umbral afecta directamente cuánto paga un cliente en línea vs. cotiza —
se audita por la misma razón que se audita un cambio de precio).

---

## 5. Usuarios y roles (`/admin/usuarios`)

`master` ve los usuarios de una empresa (vía `company_members`) y puede
cambiar `profiles.role` (rol de plataforma) o `company_members.member_role`
(rol interno de empresa). **Esta es la única pantalla que cambia un rol
fuera del registro inicial** (`registerUser`, Fase 1) — y a diferencia de
`registerUser`, que no audita el rol que asigna al crear la cuenta
(deuda técnica descubierta en el cierre de Fase 3, `progress/TODO.md`),
la función de esta fase sí registra en `audit_log` desde el día uno,
para no repetir el mismo defecto en código nuevo.

---

## 6. Auditoría (`/admin/auditoria`)

Visor de `audit_log` — la política `audit_read_master` ya existe desde la
Fase 1 (`05-RLS-SECURITY-A.md`), esta fase solo construye la pantalla:
filtros por `entity`/`actor_id`/rango de fecha, `before`/`after` en
crudo (es un log técnico, no una vista de negocio bonita). Sin
exportación ni búsqueda de texto completo en esta fase — se agrega si
hace falta después.

---

## 7. Métricas (`/admin/metricas`)

Conteos reales, sin gráficas fabricadas: pedidos por estado, cotizaciones
abiertas, tickets abiertos, mantenimientos pendientes. Cada número sale
de una consulta `count` real contra la tabla correspondiente — si un
número no tiene una fuente real todavía (por ejemplo, ingresos del mes,
que requeriría sumar `payments` conciliados), no aparece en el panel
hasta que exista esa consulta, mismo criterio que el placeholder `"—"`
de la franja de estadísticas del home (Fase 2).

---

## 8. Fuera de alcance de esta fase

- Subida de archivos reales (`11-STORAGE-R2.md`, sin empezar).
- Aplicar el descuento de una promoción al precio real —
  `PENDIENTE-DECISIÓN` (`15-MODULE-CONTENT.md` sección 4).
- Editor de blog enriquecido (WYSIWYG) — texto/markdown plano.
- Exportar auditoría o métricas a CSV/Excel.
