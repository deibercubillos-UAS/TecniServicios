-- Migración: fix_search_products_search_path
-- Aplicada: 2026-08-08, vía mcp__Supabase__apply_migration sobre el
-- proyecto tecni (sieiprqcvubkmrmvwwik).
-- get_advisors marcó search_products con search_path mutable (WARN) —
-- riesgo real de que alguien con privilegios sobre otro esquema
-- redefina to_tsvector/plainto_tsquery y la función los resuelva ahí en
-- vez de pg_catalog. Fijado explícito.

alter function search_products(text) set search_path = pg_catalog, public;
