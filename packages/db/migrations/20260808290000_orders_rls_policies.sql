-- Migración: orders_rls_policies
-- Aplicada: 2026-08-08, vía mcp__Supabase__apply_migration sobre el
-- proyecto tecni (sieiprqcvubkmrmvwwik).
-- Paso 3.3 (Fase 3, ACTIVE-fase-3-comercio-A.md). Exacta a
-- 05-RLS-SECURITY-A.md, sección "Comercio". A diferencia de quotes, el
-- cliente sí puede insertar su propio pedido (checkout directo o
-- aceptar cotización corren con su sesión).

create policy orders_read on orders
for select to authenticated
using (company_id in (select auth_company_ids()) or seller_id = auth.uid() or is_master());

create policy orders_insert on orders
for insert to authenticated
with check (company_id in (select auth_company_ids()));

create policy orders_update_staff on orders
for update to authenticated
using (seller_id = auth.uid() or is_master());

create policy order_items_read on order_items
for select to authenticated
using (order_id in (select id from orders));

create policy order_items_insert on order_items
for insert to authenticated
with check (order_id in (select id from orders where company_id in (select auth_company_ids())));
