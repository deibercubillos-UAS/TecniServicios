# 04B — Esquema de base de datos (parte B)

Parte A: [`04-DATABASE-SCHEMA-A.md`](./04-DATABASE-SCHEMA-A.md) · Índice: [`00-INDEX.md`](./00-INDEX.md)

Continuación. Las convenciones y los enums están en la parte A.

---

## 5. Comercio

```sql
create table carts (
  id         uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade,
  company_id uuid references companies(id) on delete cascade,
  session_id text,                       -- carrito anónimo previo al login
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table cart_items (
  id         uuid primary key default gen_random_uuid(),
  cart_id    uuid not null references carts(id) on delete cascade,
  product_id uuid not null references products(id),
  quantity   int not null check (quantity > 0),
  unit_price_cop numeric(14,2),          -- congelado al agregar
  created_at timestamptz not null default now(),
  unique (cart_id, product_id)
);

create table quotes (
  id             uuid primary key default gen_random_uuid(),
  company_id     uuid not null references companies(id),
  requested_by   uuid not null references profiles(id),
  seller_id      uuid references profiles(id),
  status         quote_status not null default 'requested',
  siigo_quote_id text,                   -- consecutivo REAL, generado por Siigo
  siigo_number   text,
  subtotal_cop   numeric(14,2),
  tax_cop        numeric(14,2),
  total_cop      numeric(14,2),
  valid_until    date,
  customer_note  text,
  seller_note    text,
  pdf_r2_key     text,
  accepted_at    timestamptz,
  rejected_at    timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index on quotes (company_id, status);
create index on quotes (seller_id, status);

create table quote_items (
  id         uuid primary key default gen_random_uuid(),
  quote_id   uuid not null references quotes(id) on delete cascade,
  product_id uuid references products(id),
  description text not null,
  quantity   int not null,
  unit_price_cop numeric(14,2) not null,
  tax_rate   numeric(5,2) not null default 19.00,
  total_cop  numeric(14,2) not null
);

create table orders (
  id            uuid primary key default gen_random_uuid(),
  order_number  text not null unique,     -- consecutivo propio de la web
  company_id    uuid not null references companies(id),
  placed_by     uuid not null references profiles(id),
  seller_id     uuid references profiles(id),
  quote_id      uuid references quotes(id),
  status        order_status not null default 'pending_payment',
  subtotal_cop  numeric(14,2) not null,
  tax_cop       numeric(14,2) not null,
  shipping_cop  numeric(14,2) not null default 0,
  total_cop     numeric(14,2) not null,
  shipping_address jsonb,
  siigo_invoice_id text,
  invoice_pdf_r2_key text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index on orders (company_id, status);

create table order_items (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id),
  description text not null,
  quantity   int not null,
  unit_price_cop numeric(14,2) not null,
  tax_rate   numeric(5,2) not null default 19.00,
  total_cop  numeric(14,2) not null
);

create table payments (
  id             uuid primary key default gen_random_uuid(),
  order_id       uuid not null references orders(id),
  provider       text not null default 'wompi',
  provider_ref   text,                    -- id de transacción Wompi
  status         payment_status not null default 'pending',
  amount_cop     numeric(14,2) not null,
  method         text,
  raw_response   jsonb,
  paid_at        timestamptz,
  created_at     timestamptz not null default now()
);

create unique index on payments (provider, provider_ref) where provider_ref is not null;

-- Envío: guía cargada manualmente por el vendedor
create table shipments (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references orders(id),
  carrier       text,
  tracking_number text,
  tracking_url  text,
  shipped_at    timestamptz,
  delivered_at  timestamptz,
  notes         text,
  created_by    uuid references profiles(id),
  created_at    timestamptz not null default now()
);
```

---

## 6. Postventa

```sql
-- Cada equipo serializado entregado
create table owned_equipment (
  id            uuid primary key default gen_random_uuid(),
  company_id    uuid not null references companies(id),
  product_id    uuid not null references products(id),
  order_id      uuid references orders(id),
  serial_number text,
  delivered_at  date,
  warranty_until date,
  location_note text,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);

create index on owned_equipment (company_id);

create table maintenance_requests (
  id            uuid primary key default gen_random_uuid(),
  company_id    uuid not null references companies(id),
  equipment_id  uuid not null references owned_equipment(id),
  requested_by  uuid not null references profiles(id),
  technician_id uuid references profiles(id),
  status        maintenance_status not null default 'requested',
  preferred_date date,
  confirmed_at  timestamptz,
  scheduled_at  timestamptz,
  completed_at  timestamptz,
  description   text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index on maintenance_requests (technician_id, status);
create index on maintenance_requests (company_id, status);

create table maintenance_reports (
  id            uuid primary key default gen_random_uuid(),
  request_id    uuid not null references maintenance_requests(id) on delete cascade,
  technician_id uuid not null references profiles(id),
  work_done     text not null,
  parts_used    jsonb,
  recommendations text,
  next_service_date date,
  attachments   jsonb,                   -- llaves de R2
  customer_signature_r2_key text,
  created_at    timestamptz not null default now()
);

create table support_tickets (
  id            uuid primary key default gen_random_uuid(),
  ticket_number text not null unique,
  company_id    uuid not null references companies(id),
  equipment_id  uuid references owned_equipment(id),
  opened_by     uuid not null references profiles(id),
  assigned_to   uuid references profiles(id),
  status        ticket_status not null default 'open',
  priority      ticket_priority not null default 'medium',
  subject       text not null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  resolved_at   timestamptz
);

create table ticket_messages (
  id         uuid primary key default gen_random_uuid(),
  ticket_id  uuid not null references support_tickets(id) on delete cascade,
  author_id  uuid not null references profiles(id),
  body       text not null,
  is_internal boolean not null default false,  -- nota interna, invisible al cliente
  attachments jsonb,
  created_at timestamptz not null default now()
);

-- Cupos abiertos por master para agendar mantenimiento. `id` es la
-- llave real desde que se agregó generación masiva (varios técnicos
-- para la misma fecha) — `unique(available_date, technician_id)` evita
-- abrir dos veces al mismo técnico el mismo día. El cupo (`max_visits`)
-- es compartido a nivel de fecha entre todas sus filas, nunca se parte
-- por técnico.
create table maintenance_availability (
  id            uuid primary key default gen_random_uuid(),
  available_date date not null,
  max_visits    integer not null default 1 check (max_visits > 0),
  notes         text,
  technician_id uuid references profiles(id),  -- metadato informativo
  department    text,                           -- Colombia, ver
  city          text,                           -- apps/web/lib/colombia-geo.ts
  created_by    uuid references profiles(id),
  created_at    timestamptz not null default now()
);

create unique index on maintenance_availability (available_date, technician_id)
  where technician_id is not null;
```

**`ticket_messages.is_internal`** requiere atención especial en RLS: una nota
interna nunca puede llegar al cliente, ni siquiera en un conteo.

---

## 7. Contenido y configuración

```sql
create table posts (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  title        text not null,
  excerpt      text,
  body         text,
  cover_url    text,
  author_id    uuid references profiles(id),
  is_published boolean not null default false,
  published_at timestamptz,
  seo_title    text,
  seo_description text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table banners (
  id         uuid primary key default gen_random_uuid(),
  title      text,
  image_url  text,              -- nullable: announcement_bar no usa imagen
  mobile_image_url text,
  link_url   text,
  icon       text,              -- solo announcement_bar (5 íconos fijos, ver
                                 -- apps/web/lib/announcement-icons.ts)
  position   int not null default 0,
  placement  text not null default 'home_hero', -- home_hero | catalog_top |
                                 -- announcement_bar | promotions
  starts_at  timestamptz,
  ends_at    timestamptz,
  is_active  boolean not null default true
);

create table promotions (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  description   text,
  discount_type text not null default 'percentage',
  discount_value numeric(10,2) not null,
  product_id    uuid references products(id),
  category_id   uuid references categories(id),
  starts_at     timestamptz,
  ends_at       timestamptz,
  is_active     boolean not null default true
);

create table testimonials (
  id          uuid primary key default gen_random_uuid(),
  author_name text not null,
  company     text,
  role        text,
  quote       text not null,
  is_active   boolean not null default true,
  position    int not null default 0,
  created_at  timestamptz not null default now()
);
-- Testimonios reales de clientes — nunca se fabrica el contenido, la
-- sección del home se oculta sola sin filas activas. Sin foto por ahora
-- (evita inventar avatares). RLS: mismo patrón que categories/banners
-- (lectura pública de activos, escritura solo master).

create table settings (
  key         text primary key,
  value       jsonb not null,
  description text,
  updated_by  uuid references profiles(id),
  updated_at  timestamptz not null default now()
);
-- Semilla obligatoria:
-- ('quote_threshold_cop', '5000000', 'Umbral para forzar cotización asistida')

create table seller_visits (
  id         uuid primary key default gen_random_uuid(),
  seller_id  uuid not null references profiles(id),
  company_id uuid not null references companies(id),
  scheduled_at timestamptz not null,
  purpose    text,
  outcome    text,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table contact_messages (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text not null,
  phone      text,
  message    text not null,
  user_id    uuid references profiles(id),
  status     text not null default 'new',
  created_at timestamptz not null default now()
);
-- Formulario de contacto público (docs/12-MODULE-CATALOG.md sección 1
-- lo excluye del catálogo). `user_id` se llena solo si quien envía tiene
-- sesión (nunca se exige login para escribir). `status`: 'new' | 'read' |
-- 'archived', para triage del master — sin panel todavía (Fase 16).

create table audit_log (
  id          bigserial primary key,
  actor_id    uuid references profiles(id),
  action      text not null,
  entity      text not null,
  entity_id   text,
  before      jsonb,
  after       jsonb,
  ip          inet,
  created_at  timestamptz not null default now()
);

create index on audit_log (entity, entity_id);
create index on audit_log (actor_id, created_at desc);
```

---

## 8. Funciones auxiliares para RLS

```sql
create or replace function auth_role() returns user_role
language sql stable security definer set search_path = public as $$
  select role from profiles where id = auth.uid();
$$;

create or replace function auth_company_ids() returns setof uuid
language sql stable security definer set search_path = public as $$
  select company_id from company_members where profile_id = auth.uid();
$$;

create or replace function is_master() returns boolean
language sql stable as $$ select auth_role() = 'master' $$;
```

Estas funciones se usan en todas las políticas. Ver `05-RLS-SECURITY-A.md`.

---

## 9. Pendientes

- `PENDIENTE-DECISIÓN`: ¿el inventario se sincroniza desde Siigo o se ignora en v1?
- Definir `attribute_definitions` reales por categoría cuando exista el catálogo.
- Evaluar particionado de `audit_log` si supera 5M de filas.
