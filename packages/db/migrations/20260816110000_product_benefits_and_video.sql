-- Migración: product_benefits_and_video
-- Fase 4 de docs/tasks/ACTIVE-cierre-brechas-ux-hunter.md. Bloques de
-- beneficios (alternados foto/texto en la ficha pública) + video
-- opcional, benchmark es.hunter.com. `video_url` va al final de la vista
-- (create or replace view no permite reordenar columnas existentes,
-- mismo criterio que 20260809310000_add_is_bestseller_to_products.sql).
-- product_benefits: mismo patrón RLS que product_images
-- (20260808172000_product_images_attributes_rls_policies.sql) — lectura
-- pública vía subconsulta a public_products, escritura solo master.
-- Reversión: alter table products drop column video_url;
--            create or replace view public_products as (versión sin
--            video_url, ver 20260809310000);
--            drop table product_benefits;

alter table products add column video_url text;

create or replace view public_products as
select id, sku, slug, name, short_description, description, type,
       category_id, brand_id, is_active, is_featured, stock_status, created_at,
       is_bestseller, video_url
from products
where is_active = true and deleted_at is null;

create table product_benefits (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references products(id) on delete cascade,
  title       text not null,
  description text not null,
  position    int not null default 0
);

alter table product_benefits enable row level security;

create policy product_benefits_read_public on product_benefits
for select to anon, authenticated
using (product_id in (select id from public_products));

create policy product_benefits_write_master on product_benefits
for all to authenticated using (is_master()) with check (is_master());
