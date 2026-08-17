# 15 — Módulo de contenido

Volver a [`00-INDEX.md`](./00-INDEX.md) · Esquema en
[`04-DATABASE-SCHEMA-B.md`](./04-DATABASE-SCHEMA-B.md) sección 7 · RLS en
[`05-RLS-SECURITY-C.md`](./05-RLS-SECURITY-C.md) · Panel maestro en
[`16-ADMIN-MASTER.md`](./16-ADMIN-MASTER.md)

---

## 1. Por qué existe

Que `master` publique contenido — blog, banners, promociones — sin pedirle
un despliegue a nadie (`CLAUDE.md` sección 1, "que Tecni opere el sitio sin
desarrollador"). Las tres tablas (`posts`, `banners`, `promotions`) siguen
el mismo patrón de visibilidad: **público ve solo lo activo/publicado y
vigente, `master` ve y escribe todo**, sin excepción de rol intermedio —
ni `seller` ni `technician` tienen permiso de escritura acá
(`06-AUTH-ROLES.md` sección 2: "Banners y promociones ❌" y "Publicar en
blog 🔸 borrador" para `seller` — ver sección 4 más abajo, ese matiz
particular sigue fuera de alcance de esta fase, `seller` no tiene UI de
blog todavía).

---

## 2. Blog (`posts`)

```
master crea post → is_published = false (borrador, default del esquema)
   │  visible solo para master en /admin/blog
   ▼
master publica → is_published = true, published_at (ahora o fecha futura)
   │
   ▼
anon/authenticated ven el post cuando is_published = true
   Y published_at <= now() — un post "publicado" con fecha futura
   sigue sin aparecer en público hasta que llegue esa fecha
   (esto es "programar", no un estado nuevo del enum: no hay enum,
   la programación es la combinación de las dos columnas)
```

`seo_title`/`seo_description` son opcionales — si vienen vacíos, la
página usa `title`/`excerpt` como fallback (mismo patrón que el resto del
catálogo, nunca un `<title>` vacío).

---

## 3. Banners (`banners`)

Un banner es una imagen (o dos: `image_url`/`mobile_image_url`) con un
enlace opcional, una posición de orden y un `placement` — dónde aparece.
**Sin enum en la base** (`placement` es `text` con default
`'home_hero'`) — los valores válidos se validan en `packages/core`
(`ALLOWED_BANNER_PLACEMENTS`, lista blanca en código, no en el esquema):
`home_hero`, `catalog_top`, `announcement_bar` (franja angosta sobre el
navbar), `promotions` (fondo de la sección de descuentos del home) y
`category_hero` (carrusel con overlay de texto en
`/catalogo/categoria/[slug]`, requiere elegir a qué categoría
pertenece). `/admin/banners` agrupa la lista por estos placements en
vez de una tabla plana.

`announcement_bar` es el único sin imagen — `image_url` es nullable a
nivel de esquema para este caso; en su lugar usa `icon` (texto, uno de
5 valores fijos en `ALLOWED_ANNOUNCEMENT_ICONS`/
`apps/web/lib/announcement-icons.ts`). El campo `link_url` de cualquier
banner se elige de un desplegable (páginas reales del sitio + categorías
+ "Otro" para URL libre) en vez de escribirse a mano — **excepto
`home_hero`** (ver 3.1 abajo).

Vigencia: `starts_at`/`ends_at` nulos = siempre vigente; con fechas, solo
visible dentro del rango. `is_active = false` lo oculta sin borrarlo
(un banner desactivado se puede reactivar, no hay que recrearlo) —
**excepto `home_hero`**, que solo expone "Activo" (ver 3.1).

### 3.1 Caso especial: `home_hero`

El hero del home tiene dos partes independientes, ambas editables desde
`/admin/banners` (nunca desde `/admin/configuracion`, para tenerlas
juntas — decisión explícita del usuario):

- **Fotos** (el carrusel de la derecha): banners normales con
  `placement = 'home_hero'`. Como el título ya no se pinta sobre la
  imagen (se quitó el overlay), "Datos básicos" de estos banners se
  reduce a solo el checkbox **Activo** — título, enlace, ubicación,
  posición y vigencia dejan de ser editables desde la UI para este
  placement (siguen en la fila sin tocarse, solo no se exponen). Sin
  posición editable, el orden entre varias fotos del hero no se puede
  ajustar desde el panel.
- **Texto** (badge, título en 2 líneas, descripción, 2 botones
  opcionales con texto+enlace+on/off cada uno): un único registro
  compartido por todas las fotos, guardado en `settings` con prefijo
  `home_hero_*` (`apps/web/lib/settings-config.ts` →
  `HOME_HERO_TEXT_FIELDS`). Se edita en un `<details>` colapsado dentro
  de `/admin/banners/[id]` o `/admin/banners/nuevo` para cualquier
  banner de ese placement (`updateHeroTextAction`,
  `apps/web/app/(staff)/admin/banners/actions.ts`) — no es un campo por
  banner, cambiarlo afecta el hero completo.

---

## 4. Promociones (`promotions`)

Descuento sobre un producto específico o una categoría completa —
`product_id`/`category_id`, ambos nullable, se espera que solo uno de los
dos venga lleno por promoción (validado en `packages/core`, no en el
esquema — no hay `check` que lo fuerce). `discount_type` tampoco es enum:
lista blanca en código, dos valores: `percentage` (`discount_value` es un
porcentaje, 0–100) y `fixed_amount` (`discount_value` en COP). Misma
vigencia que banners.

**Cómo se aplica el descuento:** fuera de alcance de esta fase — las
promociones se **muestran** (badge en el catálogo, franja informativa),
pero el precio final que ve el cliente sigue viniendo de `resolvePrice()`
sin tocar. Aplicar el descuento al precio real de Siigo es una decisión de
negocio que no está tomada (¿el descuento lo calcula la web o ya viene
aplicado desde Siigo?) — anotado como `PENDIENTE-DECISIÓN` en
`progress/TODO.md`.

---

## 5. Roles

Solo `master` escribe en las tres tablas. Lectura pública (`anon` incluido)
de lo activo/publicado/vigente — igual que `categories`/`brands` en la
Fase 2, esto no expone ningún precio ni dato de empresa. `seller` tiene
lectura de "borrador" de blog en la matriz de `06-AUTH-ROLES.md`
(`Publicar en blog 🔸 borrador`) — esa capacidad específica (que un
vendedor redacte un borrador sin poder publicarlo) queda fuera de alcance
de esta fase; hoy la matriz documenta la intención, no hay UI para
`seller` en `/admin/blog` todavía.

---

## 6. Contacto (`contact_messages` + settings `contact_*`)

`/contacto` (rediseño con hero, tarjetas de contacto rápido y sidebar de
sede/horario) muestra WhatsApp, teléfono, correo, dirección y horario
desde `settings` (claves `contact_whatsapp`, `contact_phone`,
`contact_phone_hours`, `contact_email`, `contact_address_line`,
`contact_address_city`, `contact_map_link`, `contact_hours_weekday`,
`contact_hours_saturday`, `contact_response_time`), editables por
`master` desde `/admin/configuracion` — agrupadas en su propia sección
("Datos de contacto"/"Ubicación"/"Horario de atención") con el tipo de
input correcto (teléfono, correo, URL), no como JSON crudo genérico.
Sin esos datos reales todavía, cada valor arranca en `"Pendiente de
definir"` — nunca un teléfono o dirección inventados; una tarjeta solo
se oculta si el valor queda completamente vacío (`contact_map_link`).

Lectura pública acotada: `settings_read_contact_public`
(`05-RLS-SECURITY-C.md`) permite a `anon`/`authenticated` leer **solo**
las claves `contact_*` — el resto de `settings` (`quote_threshold_cop`,
etc.) sigue bloqueado, sin cambios.

El formulario en sí no cambió: sigue insertando en `contact_messages`
vía `submitContactMessage` (`packages/core`), sin sesión requerida.
