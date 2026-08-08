# 05 — RLS y seguridad

Volver a [`00-INDEX.md`](./00-INDEX.md) · Esquema en [`04-DATABASE-SCHEMA-A.md`](./04-DATABASE-SCHEMA-A.md)

**Documento crítico.** Si algo aquí contradice otro doc, este gana.

---

## 1. Postura

Tres capas independientes. Ninguna confía en la anterior:

1. **Middleware** — decide si el rol puede *ver la ruta*.
2. **`packages/core`** — decide si el usuario puede *ejecutar la acción*.
3. **RLS en Postgres** — decide qué *filas* devuelve la consulta.

Si el middleware falla, RLS sigue protegiendo.
Si RLS falla, es una brecha total. Por eso RLS se prueba, no se asume.

---

## 2. Reglas absolutas

1. **Toda tabla lleva `alter table X enable row level security;`** en la misma
   migración que la crea. No en una posterior.
2. Habilitar RLS sin políticas **bloquea todo** — ese es el estado seguro por
   defecto. Se abre permiso por permiso, nunca al revés.
3. **`service_role` solo en el servidor**, en rutas de API y webhooks. Jamás en
   un Server Component que renderice para el usuario, jamás en el navegador.
4. **Los precios nunca llegan al cliente anónimo.** Ni en el HTML, ni en el JSON
   de hidratación, ni en `<meta>`, ni en JSON-LD, ni en el sitemap.
5. Toda entrada externa se valida con **Zod** antes de tocar la base de datos.
6. Los webhooks (Wompi, Siigo) **verifican firma** antes de procesar. Un webhook
   sin verificación de firma es un endpoint de escritura público.

---

## 3. El problema de los precios

Es la regla de negocio más fácil de romper accidentalmente. Cuatro fugas típicas:

| Fuga | Cómo se evita |
|---|---|
| Server Component consulta `products.*` y pasa todo al cliente | Se seleccionan columnas explícitas. `price_cop` solo si hay sesión |
| JSON-LD de producto incluye `offers.price` | El bloque `offers` se omite para anónimos |
| El endpoint público `/api/v1/catalog/products` devuelve precio | Dos respuestas distintas según sesión, decididas en el servidor |
| El sitemap o el feed de Google Shopping expone precios | No se genera feed de precios en v1 |

**Implementación:** dos vistas separadas.

```sql
-- Vista pública: SIN precio
create view public_products as
select id, sku, slug, name, short_description, description, type,
       category_id, brand_id, is_active, is_featured, stock_status
from products
where is_active = true and deleted_at is null;

-- La tabla products conserva el precio y solo la leen usuarios autenticados
```

⚠️ `get_advisors` marca esta vista como `security_definer_view` (ERROR) — es el
diseño intencional, no un descuido. Una vista sin `security_invoker = true`
corre con los privilegios de quien la creó (`postgres`), no del rol que
consulta; eso es exactamente lo que permite que `anon` lea filas de `products`
sin tener ninguna política propia ahí. Ponerle `security_invoker = true`
haría que la vista evaluara el `select` subyacente con los privilegios de
`anon`, que no tiene política en `products` — devolvería siempre 0 filas y
la vista dejaría de servir para nada. Se acepta el ERROR con esta
justificación por escrito.

```sql
alter table products enable row level security;

-- Cualquiera lee el catálogo, pero la app usa public_products para anónimos
create policy products_read_authenticated on products
for select to authenticated
using (is_active = true and deleted_at is null);

create policy products_write_master on products
for all to authenticated
using (is_master()) with check (is_master());
```

**La regla en `core`:** `resolvePrice(product, ctx)` devuelve `null` si
`ctx.userId` es nulo. Toda la UI consume esa función, nunca `product.price_cop`
directo.

---

## 4. Políticas por tabla

### `profiles`
```sql
alter table profiles enable row level security;

create policy profiles_self on profiles
for select to authenticated using (id = auth.uid() or is_master());

create policy profiles_update_self on profiles
for update to authenticated
using (id = auth.uid()) with check (id = auth.uid() and role = auth_role());
-- El check impide que un usuario se auto-promueva de rol
```

**El cambio de rol solo ocurre por función `security definer` invocada por un
master, y queda en `audit_log`.**

### `companies`
```sql
alter table companies enable row level security;

create policy companies_read on companies
for select to authenticated
using (
  id in (select auth_company_ids())
  or assigned_seller_id = auth.uid()
  or is_master()
);

create policy companies_update_own on companies
for update to authenticated
using (
  id in (
    select company_id from company_members
    where profile_id = auth.uid() and member_role in ('owner','accounting')
  ) or is_master()
);
```

### `company_members`
```sql
alter table company_members enable row level security;

create policy members_read on company_members
for select to authenticated
using (profile_id = auth.uid() or company_id in (select auth_company_ids()) or is_master());
```

⚠️ Esta política se autorreferencia vía `auth_company_ids()`. La función es
`security definer`, lo que evita la recursión infinita. **No reemplazar la
función por una subconsulta directa sobre `company_members`.**

### `quotes`, `orders`, `owned_equipment`, `support_tickets`

Todas comparten el mismo patrón. Ejemplo con `quotes`:

```sql
alter table quotes enable row level security;

create policy quotes_read on quotes
for select to authenticated
using (
  company_id in (select auth_company_ids())
  or seller_id = auth.uid()
  or is_master()
);

create policy quotes_insert on quotes
for insert to authenticated
with check (company_id in (select auth_company_ids()) or auth_role() in ('seller','master'));

create policy quotes_update_staff on quotes
for update to authenticated
using (seller_id = auth.uid() or is_master());
```

**El cliente nunca actualiza una cotización directamente.** Aceptar o rechazar
pasa por `/api/v1/quotes/:id/accept`, que valida estado y registra auditoría.

### `ticket_messages` — caso especial
```sql
alter table ticket_messages enable row level security;

create policy ticket_messages_read on ticket_messages
for select to authenticated
using (
  (
    is_internal = false
    and ticket_id in (
      select id from support_tickets where company_id in (select auth_company_ids())
    )
  )
  or auth_role() in ('technician','seller','master')
);
```

Las notas internas quedan fuera del `select` del cliente. **Además, la API nunca
devuelve el conteo total de mensajes sin filtrar**, porque un conteo revela la
existencia de notas internas.

### `product_documents` — manuales
```sql
alter table product_documents enable row level security;

create policy docs_read on product_documents
for select to authenticated
using (
  is_public = true
  or product_id in (
    select product_id from owned_equipment where company_id in (select auth_company_ids())
  )
  or auth_role() in ('technician','seller','master')
);
```

Los manuales privados **solo los ve quien compró el equipo**. El archivo en R2 se
sirve con URL firmada de vida corta (15 min), nunca con enlace público.

⚠️ Esta política depende de `owned_equipment`, que no existe hasta el módulo de
postventa. Hasta entonces, `product_documents` queda con RLS habilitada y
**sin ninguna política** (bloqueada por completo) — no se aplica esta política
antes de tiempo con una versión recortada, se espera a tener la tabla real.

### `product_images`, `attribute_definitions`, `product_attributes`

Datos de catálogo sin precio — mismo criterio de lectura pública que
`categories`/`brands`, pero referenciando `public_products` (la vista sin
precio) en vez de `products` directo: si la política mirara `products`, la
subconsulta correría con los privilegios de quien pregunta, y `anon` no tiene
política ahí — la fila nunca aparecería. `public_products` es una vista
propiedad de `postgres`, así que la subconsulta bypassa esa restricción sin
necesitar una función `security definer` aparte.

```sql
alter table product_images enable row level security;
alter table attribute_definitions enable row level security;
alter table product_attributes enable row level security;

create policy product_images_read_public on product_images
for select to anon, authenticated
using (product_id in (select id from public_products));

create policy attribute_definitions_read_public on attribute_definitions
for select to anon, authenticated
using (category_id in (select category_id from public_products));

create policy product_attributes_read_public on product_attributes
for select to anon, authenticated
using (product_id in (select id from public_products));

create policy product_images_write_master on product_images
for all to authenticated using (is_master()) with check (is_master());

create policy attribute_definitions_write_master on attribute_definitions
for all to authenticated using (is_master()) with check (is_master());

create policy product_attributes_write_master on product_attributes
for all to authenticated using (is_master()) with check (is_master());
```

### `maintenance_requests`
```sql
create policy maintenance_read on maintenance_requests
for select to authenticated
using (
  company_id in (select auth_company_ids())
  or technician_id = auth.uid()
  or auth_role() in ('seller','master')
);

create policy maintenance_update_tech on maintenance_requests
for update to authenticated
using (technician_id = auth.uid() or is_master());
```

### Contenido público
`posts`, `banners`, `categories`, `brands`: lectura para `anon` solo de filas
activas o publicadas; escritura solo `master`.

```sql
create policy posts_read_public on posts
for select to anon, authenticated
using (is_published = true and published_at <= now());
```

### `audit_log`
```sql
alter table audit_log enable row level security;
create policy audit_read_master on audit_log for select to authenticated using (is_master());
-- Sin política de insert: solo se escribe con service_role desde el servidor.
-- Sin política de update ni delete: el log es inmutable.
```

---

## 5. Almacenamiento (Cloudflare R2)

- **Ningún bucket es público.** Todo acceso es por URL firmada generada en el
  servidor tras validar permisos.
- Vida de la firma: 15 minutos para documentos, 60 para imágenes de catálogo.
- Las claves siguen el patrón `{entidad}/{id}/{uuid}-{nombre}`. **Nunca se usa el
  nombre original del archivo como clave** (evita colisiones y filtrado de datos).
- Validación en subida: tipo MIME real (no la extensión), tamaño máximo,
  y renombrado obligatorio.

---

## 6. Autenticación

- Supabase Auth con verificación de correo obligatoria. Sin verificar, el usuario
  no ve precios ni puede comprar.
- Contraseña mínima 10 caracteres, validada contra lista de contraseñas comunes.
- Sesión: 7 días con refresh rotatorio. Los roles `seller`, `technician` y
  `master` usan **2FA obligatorio** (TOTP).
- Rate limit en `login`, `registro` y `recuperar` vía Cloudflare: 5 intentos por
  IP cada 15 minutos.
- El registro **no revela** si un correo existe. El mensaje es idéntico en ambos
  casos.

---

## 7. Cabeceras y protección de la app

```
Content-Security-Policy: default-src 'self'; img-src 'self' data: https:; ...
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

En Cloudflare: WAF activo, Bot Fight Mode, rate limiting en `/api/v1/*`
(60 req/min por IP), y reglas específicas más estrictas en autenticación.

---

## 8. Datos personales (Ley 1581 de 2012)

Detalle completo en `20-COMPLIANCE.md`. Mínimos que afectan al esquema:

- Casilla explícita de autorización de tratamiento en el registro, con fecha,
  IP y versión de la política almacenadas.
- Mecanismo para que el titular consulte, actualice y solicite supresión.
- Los datos de facturación no se eliminan (obligación fiscal); se anonimiza el
  perfil y se conserva el registro contable.

---

## 9. Checklist obligatorio antes de cada PR

- [ ] ¿Toda tabla nueva tiene `enable row level security`?
- [ ] ¿Probé la consulta como anónimo, como cliente de otra empresa y como rol inferior?
- [ ] ¿Algún endpoint nuevo devuelve precios sin validar sesión?
- [ ] ¿Validé la entrada con Zod?
- [ ] ¿Hay algún `service_role` fuera del servidor?
- [ ] ¿La operación quedó en `audit_log` si toca precio, rol, pedido o cotización?
- [ ] ¿Algún error de base de datos llega crudo al cliente?
- [ ] ¿Los archivos nuevos de R2 se sirven firmados?

**Un PR que no responde estas ocho preguntas no se aprueba.**

---

## 10. Pruebas de RLS

Cada tabla con datos sensibles tiene una prueba de integración que:

1. Crea dos empresas con un usuario cada una.
2. Inserta datos en ambas.
3. Verifica que el usuario A **no puede leer** ni una fila de B.
4. Verifica que un anónimo no lee nada.

Detalle en `18-TESTING.md`. Estas pruebas corren en CI y bloquean el merge.
