-- Migración: create_testimonials
-- Fase 3 de docs/tasks/ACTIVE-cierre-brechas-ux-hunter.md. Sistema de
-- testimonios reales — nace vacío, el master carga los primeros desde
-- /admin/testimonios. Sin foto por ahora (evita inventar avatares).
-- RLS: mismo patrón que categories_read_public/categories_write_master
-- (20260808170000_categories_brands_rls_policies.sql) — lectura pública
-- solo de filas activas, escritura solo master.
-- Reversión: drop table testimonials;

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

alter table testimonials enable row level security;

create policy testimonials_read_public on testimonials
for select to anon, authenticated
using (is_active = true);

create policy testimonials_write_master on testimonials
for all to authenticated using (is_master()) with check (is_master());
