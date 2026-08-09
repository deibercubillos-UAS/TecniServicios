-- Migración: create_favorites
-- Corazón de favoritos en cada carta/ficha de producto — solo visible con
-- sesión, base para remarketing futuro (docs/12-MODULE-CATALOG.md sección
-- 6b). RLS: cada usuario ve y escribe solo sus propias filas, ni seller ni
-- master las leen (05-RLS-SECURITY-A.md sección `favorites`).
-- Reversión: drop table favorites;

create table favorites (
  profile_id uuid not null references profiles(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (profile_id, product_id)
);

alter table favorites enable row level security;

create policy favorites_owner_all on favorites
for all to authenticated
using (profile_id = auth.uid())
with check (profile_id = auth.uid());
