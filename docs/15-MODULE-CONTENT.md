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
(mismo patrón que `getAllowedCatalogSorts` de la Fase 2, una lista
blanca en código, no en el esquema): `home_hero`, `catalog_top`.
Vigencia: `starts_at`/`ends_at` nulos = siempre vigente; con fechas, solo
visible dentro del rango. `is_active = false` lo oculta sin borrarlo
(un banner desactivado se puede reactivar, no hay que recrearlo).

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
`master` desde `/admin/configuracion` (genérico, sin UI propia). Sin
esos datos reales todavía, cada valor arranca en `"Pendiente de
definir"` — nunca un teléfono o dirección inventados; una tarjeta solo
se oculta si el valor queda completamente vacío (`contact_map_link`).

Lectura pública acotada: `settings_read_contact_public`
(`05-RLS-SECURITY-C.md`) permite a `anon`/`authenticated` leer **solo**
las claves `contact_*` — el resto de `settings` (`quote_threshold_cop`,
etc.) sigue bloqueado, sin cambios.

El formulario en sí no cambió: sigue insertando en `contact_messages`
vía `submitContactMessage` (`packages/core`), sin sesión requerida.
