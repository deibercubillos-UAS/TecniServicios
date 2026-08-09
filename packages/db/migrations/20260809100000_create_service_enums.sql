-- Migración: create_service_enums
-- Paso 2.1 (Fase 4, ACTIVE-fase-4-postventa-A.md). Exacta a
-- 04-DATABASE-SCHEMA-A.md. Verificado antes de crear: no existían
-- (`maintenance_status`/`ticket_status`/`ticket_priority`), a diferencia
-- de los enums de comercio que sí venían sembrados desde la Fase 0.
-- Reversión: drop type maintenance_status, ticket_status, ticket_priority;

create type maintenance_status as enum ('requested','confirmed','rescheduled','in_progress','completed','cancelled');
create type ticket_status as enum ('open','assigned','waiting_customer','resolved','closed');
create type ticket_priority as enum ('low','medium','high','critical');
