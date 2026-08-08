-- Migración: create_commerce_enums
-- Aplicada: 2026-08-08, vía mcp__Supabase__apply_migration sobre el
-- proyecto tecni (sieiprqcvubkmrmvwwik).
-- Paso 2.1 (Fase 3, ACTIVE-fase-3-comercio-A.md). Exacta a
-- 04-DATABASE-SCHEMA-A.md. Solo los enums que usa el esquema de
-- comercio (04-DATABASE-SCHEMA-B.md sección 5) — maintenance_status/
-- ticket_status/ticket_priority son de postventa (sección 6), quedan
-- para cuando toque esa fase.
-- Reversión: drop type quote_status, order_status, payment_status;

create type quote_status as enum ('requested','in_progress','sent','accepted','rejected','expired');
create type order_status as enum ('pending_payment','paid','preparing','shipped','delivered','cancelled');
create type payment_status as enum ('pending','approved','declined','voided','refunded');
