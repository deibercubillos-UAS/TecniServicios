-- Migración: product_accessories
-- Aplicada: 2026-08-27, vía mcp__Supabase__apply_migration sobre el
-- proyecto tecni (sieiprqcvubkmrmvwwik).
-- Apartado opcional para mencionar accesorios disponibles por
-- producto, pedido por el usuario junto con la estandarización de
-- specs de Desmontadoras (ver 20260827205200). Clon 1:1 del patrón de
-- product_benefits (20260816110000_product_benefits_and_video.sql):
-- misma RLS (lectura pública vía subconsulta a public_products,
-- escritura solo master). A diferencia de product_benefits, `name` es
-- el único campo obligatorio — un accesorio puede ser solo un nombre
-- (ej. "Juego de garras extra"), sin descripción.
-- Reversión: drop table product_accessories;

create table product_accessories (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references products(id) on delete cascade,
  name        text not null,
  description text,
  position    int not null default 0
);

alter table product_accessories enable row level security;

create policy product_accessories_read_public on product_accessories
for select to anon, authenticated
using (product_id in (select id from public_products));

create policy product_accessories_write_master on product_accessories
for all to authenticated using (is_master()) with check (is_master());
