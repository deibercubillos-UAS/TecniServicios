-- Migración: create_search_products_function
-- Aplicada: 2026-08-08, vía mcp__Supabase__apply_migration sobre el
-- proyecto tecni (sieiprqcvubkmrmvwwik).
-- Paso 7.2 (Fase 2, ACTIVE-fase-2-catalogo-publico-A.md): búsqueda de
-- texto completo en español, plainto_tsquery simple (sin sinónimos ni
-- fuzzy, docs/12-MODULE-CATALOG.md sección 5). Reutiliza la misma
-- expresión del índice gin ya definido en products (to_tsvector sobre
-- name + short_description).
-- Lee de public_products (no products) — sin precio, misma vista que
-- ya bypassa RLS para anon. security invoker (por defecto): el acceso
-- lo da el grant sobre la vista, no hace falta security definer.
-- Reversión: drop function search_products(text);

create function search_products(search_query text)
returns table (
  id uuid,
  slug text,
  name text,
  brand_id uuid,
  category_id uuid,
  created_at timestamptz,
  rank real
)
language sql
stable
as $$
  select
    p.id, p.slug, p.name, p.brand_id, p.category_id, p.created_at,
    ts_rank(
      to_tsvector('spanish', p.name || ' ' || coalesce(p.short_description, '')),
      plainto_tsquery('spanish', search_query)
    ) as rank
  from public_products p
  where to_tsvector('spanish', p.name || ' ' || coalesce(p.short_description, ''))
        @@ plainto_tsquery('spanish', search_query)
  order by rank desc, p.id;
$$;

grant execute on function search_products(text) to anon, authenticated;
