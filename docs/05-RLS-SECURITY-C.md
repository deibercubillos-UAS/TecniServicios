# 05C — RLS y seguridad (parte C: comercio y postventa)

Parte A: [`05-RLS-SECURITY-A.md`](./05-RLS-SECURITY-A.md) · Parte B: [`05-RLS-SECURITY-B.md`](./05-RLS-SECURITY-B.md) · Volver a [`00-INDEX.md`](./00-INDEX.md)

### Comercio: `carts`, `cart_items`, `quotes`, `quote_items`, `orders`, `order_items`, `payments`, `shipments`

Paso 1.3 de `ACTIVE-fase-3-comercio-A.md`. Mismo principio en las ocho:
**la empresa dueña lee lo suyo, el vendedor asignado lee lo suyo, `master`
lee todo.** Las tablas "hijas" (`cart_items`/`quote_items`/`order_items`) no
repiten la condición — leen vía subconsulta a su tabla padre, mismo patrón ya
usado con `product_images`/`public_products` más arriba.

```sql
-- carts: solo la empresa dueña (v1 de esta fase no tiene carrito anónimo,
-- 13-MODULE-COMMERCE.md sección 1 — sin session_id, sin política para anon).
alter table carts enable row level security;

create policy carts_owner on carts
for all to authenticated
using (company_id in (select auth_company_ids()) or is_master())
with check (company_id in (select auth_company_ids()));

alter table cart_items enable row level security;

create policy cart_items_owner on cart_items
for all to authenticated
using (cart_id in (select id from carts) or is_master())
with check (cart_id in (select id from carts));
-- El `using`/`with check` de cart_items confía en la política de carts para
-- filtrar el conjunto — un `select id from carts` sin condición propia
-- porque RLS ya se la aplicó a esa subconsulta (mismo mecanismo que
-- product_images -> public_products).
```

```sql
-- quotes: ya documentado arriba (sección "quotes, orders, owned_equipment,
-- support_tickets") — se repite acá solo para dejar el bloque de comercio
-- completo en un solo lugar. orders es idéntica, mismo patrón, columna
-- seller_id también presente en el esquema.
alter table quotes enable row level security;

create policy quotes_read on quotes
for select to authenticated
using (company_id in (select auth_company_ids()) or seller_id = auth.uid() or is_master());

create policy quotes_insert on quotes
for insert to authenticated
with check (company_id in (select auth_company_ids()) or auth_role() in ('seller','master'));

create policy quotes_update_staff on quotes
for update to authenticated
using (seller_id = auth.uid() or is_master());
-- El cliente nunca actualiza su propia cotización (ver nota más arriba).

alter table quote_items enable row level security;

create policy quote_items_read on quote_items
for select to authenticated
using (quote_id in (select id from quotes));

create policy quote_items_write_staff on quote_items
for all to authenticated
using (quote_id in (select id from quotes where seller_id = auth.uid()) or is_master())
with check (quote_id in (select id from quotes where seller_id = auth.uid()) or is_master());

-- Agregada en el paso 6.1 de la Fase 3 (ACTIVE-fase-3-comercio-A.md):
-- el cliente necesita poder cargar los ítems que pide al SOLICITAR la
-- cotización, antes de que exista un vendedor asignado —
-- `quote_items_write_staff` sola lo bloqueaba por completo.
-- `quote_items_write_staff` sigue siendo la única forma de editar o
-- borrar ítems después de creada (el cliente no puede tocar lo que ya
-- envió, solo agregar más filas a través de esta política).
create policy quote_items_insert_owner on quote_items
for insert to authenticated
with check (quote_id in (select id from quotes where company_id in (select auth_company_ids())));

alter table orders enable row level security;

create policy orders_read on orders
for select to authenticated
using (company_id in (select auth_company_ids()) or seller_id = auth.uid() or is_master());

create policy orders_insert on orders
for insert to authenticated
with check (company_id in (select auth_company_ids()));
-- El cliente crea su propio pedido (checkout directo o aceptar cotización) —
-- a diferencia de quotes, acá no hace falta el rol seller/master en el
-- insert, `acceptQuote()`/el checkout corren con la sesión del cliente.

create policy orders_update_staff on orders
for update to authenticated
using (seller_id = auth.uid() or is_master());
-- El cliente nunca cambia `status` a mano — eso lo hace el webhook de pagos
-- (service_role, sin política porque bypassa RLS) o el vendedor (envío).

alter table order_items enable row level security;

create policy order_items_read on order_items
for select to authenticated
using (order_id in (select id from orders));

create policy order_items_insert on order_items
for insert to authenticated
with check (order_id in (select id from orders where company_id in (select auth_company_ids())));
-- Sin update/delete: una vez creado el pedido, sus ítems son inmutables —
-- corregirlo es cancelar y crear uno nuevo, no editar en sitio.
```

```sql
-- payments: la empresa dueña del pedido lee su historial, master lee todo.
-- Sin insert/update/delete para authenticated en absoluto — solo el webhook
-- (service_role) escribe. Si alguna vez se necesita que un cliente inicie un
-- pago desde el navegador, sigue siendo el servidor quien llama a Wompi y
-- escribe el intento, nunca el cliente directo a la tabla.
alter table payments enable row level security;

create policy payments_read on payments
for select to authenticated
using (
  order_id in (select id from orders where company_id in (select auth_company_ids()))
  or is_master()
);
```

```sql
-- shipments: la empresa dueña del pedido lee la guía; solo vendedor/master
-- la cargan (envío es manual en esta fase, 13-MODULE-COMMERCE.md sección 6).
alter table shipments enable row level security;

create policy shipments_read on shipments
for select to authenticated
using (
  order_id in (select id from orders where company_id in (select auth_company_ids()))
  or is_master()
);

create policy shipments_write_staff on shipments
for all to authenticated
using (auth_role() in ('seller','master'))
with check (auth_role() in ('seller','master'));
```

⚠️ **`orders_insert` es la única política de esta fase donde el cliente
escribe una tabla de comercio directo** (crear su propio pedido). Todo lo
demás que cambia estado (`orders.status`, `payments`, `quotes.status`) pasa
por el vendedor, `master`, o `service_role` desde el webhook — nunca el
cliente. Verificado con datos reales de dos empresas en el paso 3 de la
tarea (RLS), no solo leído acá.

---

### Postventa: `owned_equipment`, `maintenance_requests`, `maintenance_reports`, `support_tickets`, `ticket_messages`

Paso 1.2 de `ACTIVE-fase-4-postventa-A.md`. A diferencia del bloque de
comercio, **ni `owned_equipment` ni `support_tickets` tienen una columna de
vendedor asignado propia** — el vendedor ve lo de sus clientes vía
`companies.assigned_seller_id` (ya usada en `companies_read`, sección
"companies" arriba), no vía `seller_id` en la propia fila.

**Hallazgo real durante la verificación (paso 3.2):** una versión anterior
de `owned_equipment_read` consultaba `maintenance_requests` directo en el
`using`, y `maintenance_insert_owner` (más abajo) consulta `owned_equipment`
en su `with check` — el ciclo entre las dos tablas producía
`infinite recursion detected in policy for relation "maintenance_requests"`
en el primer insert real, mismo problema que `auth_company_ids()`/
`auth_role()` ya resolvían para `company_members`/`profiles`. Se aplicó el
mismo patrón: una función `security definer` rompe el ciclo porque corre
bypassando RLS, no como una subconsulta directa evaluada con los privilegios
de quien pregunta.

```sql
-- owned_equipment: sin insert/update/delete para `authenticated` salvo
-- `master` — la creación real la dispara `markOrderDelivered()` con
-- `service_role` al entregar un pedido (14-MODULE-SERVICE.md sección 2),
-- nunca el cliente ni el vendedor directo a la tabla.
alter table owned_equipment enable row level security;

create or replace function auth_assigned_equipment_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select equipment_id from maintenance_requests where technician_id = auth.uid();
$$;

create policy owned_equipment_read on owned_equipment
for select to authenticated
using (
  company_id in (select auth_company_ids())
  or company_id in (select id from companies where assigned_seller_id = auth.uid())
  or id in (select auth_assigned_equipment_ids())
  or is_master()
);

create policy owned_equipment_write_master on owned_equipment
for all to authenticated
using (is_master())
with check (is_master());
```

```sql
-- maintenance_requests: el cliente crea sobre un equipo de su propia
-- empresa y lee las suyas; el técnico asignado lee y actualiza (confirmar,
-- reprogramar, completar); vendedor/master asignan técnico (`update`
-- separado porque `technician_id` todavía no es el suyo en el momento de
-- asignar — `maintenance_update_tech` con `using (technician_id =
-- auth.uid())` no lo dejaría pasar antes de la asignación).
alter table maintenance_requests enable row level security;

create policy maintenance_read on maintenance_requests
for select to authenticated
using (
  company_id in (select auth_company_ids())
  or technician_id = auth.uid()
  or company_id in (select id from companies where assigned_seller_id = auth.uid())
  or is_master()
);

create policy maintenance_insert_owner on maintenance_requests
for insert to authenticated
with check (
  company_id in (select auth_company_ids())
  and equipment_id in (select id from owned_equipment where company_id in (select auth_company_ids()))
);

create policy maintenance_update_tech on maintenance_requests
for update to authenticated
using (technician_id = auth.uid() or is_master());

create policy maintenance_assign_staff on maintenance_requests
for update to authenticated
using (auth_role() in ('seller','master'))
with check (auth_role() in ('seller','master'));
```

```sql
-- maintenance_reports: solo el técnico asignado a la solicitud escribe, y
-- solo una vez — sin update/delete, el reporte es inmutable (mismo criterio
-- que order_items: corregir es un reporte nuevo, no editar el viejo).
alter table maintenance_reports enable row level security;

create policy maintenance_reports_read on maintenance_reports
for select to authenticated
using (request_id in (select id from maintenance_requests));

create policy maintenance_reports_insert_tech on maintenance_reports
for insert to authenticated
with check (
  technician_id = auth.uid()
  and request_id in (select id from maintenance_requests where technician_id = auth.uid())
);
```

```sql
-- support_tickets: el cliente abre y lee los suyos; technician/master leen
-- y escriben todo (asignar, cambiar estado); seller **solo lectura** — la
-- matriz de 06-AUTH-ROLES.md sección 2 lo marca explícito ("🔸 lectura").
alter table support_tickets enable row level security;

create policy support_tickets_read on support_tickets
for select to authenticated
using (
  company_id in (select auth_company_ids())
  or auth_role() in ('technician','seller','master')
);

create policy support_tickets_insert_owner on support_tickets
for insert to authenticated
with check (company_id in (select auth_company_ids()));

create policy support_tickets_write_staff on support_tickets
for update to authenticated
using (auth_role() in ('technician','master'))
with check (auth_role() in ('technician','master'));
```

```sql
-- ticket_messages: la política de lectura ya está documentada arriba
-- ("ticket_messages — caso especial") — se repite acá solo para dejar el
-- bloque de postventa completo. Insert: el cliente solo agrega mensajes
-- NO internos a sus propios tickets; seller/technician/master agregan
-- cualquiera, incluidas notas internas (06-AUTH-ROLES.md sección 2,
-- "Escribir nota interna": seller y technician sí, customer no).
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

create policy ticket_messages_insert_owner on ticket_messages
for insert to authenticated
with check (
  is_internal = false
  and ticket_id in (select id from support_tickets where company_id in (select auth_company_ids()))
);

create policy ticket_messages_insert_staff on ticket_messages
for insert to authenticated
with check (auth_role() in ('technician','seller','master'));
```

⚠️ **Ninguna política de `ticket_messages` deja pasar un mensaje interno al
cliente**, ni siquiera por accidente: `ticket_messages_insert_owner` exige
`is_internal = false` en el `with check`, así que un cliente no puede marcar
su propio mensaje como interno, y `ticket_messages_read` nunca incluye
`is_internal = true` en la rama del cliente. Verificado con datos reales en
el paso 3.5 de la tarea (RLS), incluido el conteo — un cliente no debe ver
ni siquiera cuántos mensajes internos existen.

---

