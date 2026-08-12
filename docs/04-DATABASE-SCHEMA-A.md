# 04 — Esquema de base de datos

Volver a [`00-INDEX.md`](./00-INDEX.md) · Políticas en [`05-RLS-SECURITY-A.md`](./05-RLS-SECURITY-A.md)

**Antes de crear cualquier tabla, lee `05-RLS-SECURITY-A.md`.**
Una tabla sin política RLS no se despliega.

---

## 1. Convenciones

- PostgreSQL 15 (Supabase). Tablas en `snake_case` plural.
- PK: `id uuid primary key default gen_random_uuid()`.
- Auditoría: `created_at timestamptz not null default now()`,
  `updated_at timestamptz not null default now()` (trigger).
- Borrado lógico donde importa: `deleted_at timestamptz`. Nunca `DELETE` en
  pedidos, cotizaciones, facturas ni auditoría.
- Dinero: `numeric(14,2)`. Moneda COP fija en v1.
- Enums nativos de Postgres para estados cerrados.

---

## 2. Enums

```sql
create type user_role as enum ('customer','seller','technician','master');
create type company_member_role as enum ('owner','buyer','accounting','workshop');
create type product_type as enum ('equipment','part','supply');
create type quote_status as enum ('requested','in_progress','sent','accepted','rejected','expired');
create type order_status as enum ('pending_payment','paid','preparing','shipped','delivered','cancelled');
create type payment_status as enum ('pending','approved','declined','voided','refunded');
create type maintenance_status as enum ('requested','confirmed','rescheduled','in_progress','completed','cancelled');
create type ticket_status as enum ('open','assigned','waiting_customer','resolved','closed');
create type ticket_priority as enum ('low','medium','high','critical');
```

---

## 3. Identidad y empresas

```sql
-- Perfil extendido de auth.users
create table profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  full_name     text not null,
  phone         text,
  role          user_role not null default 'customer',
  avatar_url    text,
  is_active     boolean not null default true,
  last_seen_at  timestamptz,
  -- Autorización de tratamiento de datos (Ley 1581, ver 05-RLS-SECURITY-B.md
  -- sección 8). Agregadas en el paso 8.1 de la Fase 1, al construir /registro.
  consent_accepted_at    timestamptz,
  consent_ip             inet,
  consent_policy_version text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table companies (
  id              uuid primary key default gen_random_uuid(),
  legal_name      text not null,
  trade_name      text,
  document_type   text not null default 'NIT',
  document_number text not null,
  verification_digit text,
  address         text,
  city            text,
  department      text,
  phone           text,
  email           text,
  siigo_customer_id text,              -- vínculo con el tercero en Siigo
  is_verified     boolean not null default false,
  assigned_seller_id uuid references profiles(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (document_type, document_number)
);

-- Un usuario puede pertenecer a una o varias empresas
create table company_members (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references companies(id) on delete cascade,
  profile_id  uuid not null references profiles(id) on delete cascade,
  member_role company_member_role not null default 'buyer',
  is_primary  boolean not null default false,
  created_at  timestamptz not null default now(),
  unique (company_id, profile_id)
);

create index on company_members (profile_id);
create index on companies (assigned_seller_id);
```

**`company_members` es la tabla más importante para la seguridad.** Todas las
políticas RLS de datos comerciales se apoyan en ella.

---

## 4. Catálogo

Las especificaciones **no son comunes entre categorías** (una balanceadora se
compara por diámetro de rin; un escáner por protocolos soportados). Por eso se usa
un modelo híbrido: columnas comunes + atributos definidos por categoría.

```sql
create table categories (
  id          uuid primary key default gen_random_uuid(),
  parent_id   uuid references categories(id) on delete set null,
  slug        text not null unique,
  name        text not null,
  description text,
  icon_url    text,
  image_url   text,  -- foto hero full-bleed, CategoryHeroCard (03-UI-COMPONENTS.md §3)
  position    int not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

create table brands (
  id        uuid primary key default gen_random_uuid(),
  slug      text not null unique,
  name      text not null,
  logo_url  text,
  is_active boolean not null default true
);

create table products (
  id            uuid primary key default gen_random_uuid(),
  sku           text not null unique,          -- clave de sincronización con Siigo
  siigo_product_id text,
  slug          text not null unique,
  name          text not null,
  short_description text,
  description   text,
  type          product_type not null default 'equipment',
  category_id   uuid not null references categories(id),
  brand_id      uuid references brands(id),
  is_serialized boolean not null default false, -- ¿genera postventa?
  warranty_months int,
  is_active     boolean not null default true,
  is_featured   boolean not null default false,
  is_bestseller boolean not null default false, -- curado a mano por master, no ranking de order_items (RLS de pedidos es por empresa)
  -- precio: espejo de Siigo, nunca editable a mano
  price_cop     numeric(14,2),
  tax_rate      numeric(5,2) not null default 19.00,
  price_source  text not null default 'siigo',
  price_synced_at timestamptz,
  price_is_stale boolean not null default true,
  stock_status  text not null default 'unknown',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz
);

create index on products (category_id) where deleted_at is null;
create index on products (brand_id);
create index on products (is_active, is_featured);
create index on products using gin (to_tsvector('spanish', name || ' ' || coalesce(short_description,'')));

create table product_images (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  url        text not null,
  alt        text,
  position   int not null default 0,
  is_primary boolean not null default false
);

-- Favoritos: guardados por usuario registrado desde la ficha/carta de
-- producto (corazón). Base para remarketing (campañas por correo sobre
-- productos guardados) — nunca visible a otro usuario ni a otra empresa.
create table favorites (
  profile_id uuid not null references profiles(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (profile_id, product_id)
);

-- Definición de atributos POR CATEGORÍA (habilita el comparador)
create table attribute_definitions (
  id           uuid primary key default gen_random_uuid(),
  category_id  uuid not null references categories(id) on delete cascade,
  key          text not null,          -- 'rim_diameter_in'
  label        text not null,          -- 'Diámetro de rin'
  unit         text,                   -- 'pulgadas'
  data_type    text not null default 'text', -- text|number|boolean|enum
  options      jsonb,                  -- valores válidos si es enum
  is_filterable boolean not null default false,
  is_comparable boolean not null default true,
  position     int not null default 0,
  unique (category_id, key)
);

create table product_attributes (
  product_id    uuid not null references products(id) on delete cascade,
  definition_id uuid not null references attribute_definitions(id) on delete cascade,
  value_text    text,
  value_number  numeric,
  value_boolean boolean,
  primary key (product_id, definition_id)
);

create index on product_attributes (definition_id, value_number);

-- Documentos: manuales, fichas técnicas. Guardados en R2.
create table product_documents (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  title      text not null,
  kind       text not null default 'manual', -- manual|datasheet|certificate
  r2_key     text not null,
  file_size  bigint,
  is_public  boolean not null default false, -- manuales solo para quien compró
  created_at timestamptz not null default now()
);
```

**El comparador** (máximo 3 productos) exige misma `category_id`. Compara los
`attribute_definitions` de esa categoría marcados `is_comparable`.

---

---

## Continúa en la parte B

Comercio, postventa, contenido, funciones auxiliares para RLS y pendientes:
[`04-DATABASE-SCHEMA-B.md`](./04-DATABASE-SCHEMA-B.md)
