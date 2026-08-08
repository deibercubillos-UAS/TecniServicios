-- Migración: create_contact_messages
-- Aplicada: 2026-08-08, vía mcp__Supabase__apply_migration sobre el
-- proyecto tecni (sieiprqcvubkmrmvwwik).
-- Paso 8.1 (Fase 2, ACTIVE-fase-2-catalogo-publico-A.md): formulario
-- público de contacto. RLS: cualquiera escribe, nadie anónimo lee —
-- ver docs/05-RLS-SECURITY.md, tabla contact_messages.
-- Reversión: drop table contact_messages;

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

alter table contact_messages enable row level security;

create policy contact_messages_insert_public on contact_messages
for insert to anon, authenticated
with check (true);

create policy contact_messages_read_master on contact_messages
for select to authenticated
using (is_master());
