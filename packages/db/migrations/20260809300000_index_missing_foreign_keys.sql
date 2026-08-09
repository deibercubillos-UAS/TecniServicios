-- Migración: index_missing_foreign_keys
-- Paso 2.2 de ACTIVE-fase-6-endurecimiento-A.md: get_advisors (rendimiento)
-- marcó 34 foreign keys sin índice de cobertura (INFO, "unindexed_foreign_keys")
-- en todo el proyecto — primera auditoría de rendimiento de punta a punta.
-- CLAUDE.md sección 7 exige índice en toda columna usada en WHERE/JOIN/
-- ORDER BY frecuente; toda FK de este proyecto se usa en un JOIN o en una
-- política RLS (auth_company_ids(), member_role, etc.), así que las 34
-- califican. Cambio seguro y reversible — solo agrega índices, no toca
-- datos ni políticas.
--
-- Reversión: drop index concurrently <nombre>; (uno por uno, o todos con
-- drop index si no hay preocupación de bloqueo en producción real).

create index if not exists cart_items_product_id_idx on cart_items (product_id);
create index if not exists carts_company_id_idx on carts (company_id);
create index if not exists carts_profile_id_idx on carts (profile_id);
create index if not exists categories_parent_id_idx on categories (parent_id);
create index if not exists contact_messages_user_id_idx on contact_messages (user_id);
create index if not exists maintenance_reports_request_id_idx on maintenance_reports (request_id);
create index if not exists maintenance_reports_technician_id_idx on maintenance_reports (technician_id);
create index if not exists maintenance_requests_equipment_id_idx on maintenance_requests (equipment_id);
create index if not exists maintenance_requests_requested_by_idx on maintenance_requests (requested_by);
create index if not exists order_items_order_id_idx on order_items (order_id);
create index if not exists order_items_product_id_idx on order_items (product_id);
create index if not exists orders_placed_by_idx on orders (placed_by);
create index if not exists orders_quote_id_idx on orders (quote_id);
create index if not exists orders_seller_id_idx on orders (seller_id);
create index if not exists owned_equipment_order_id_idx on owned_equipment (order_id);
create index if not exists owned_equipment_product_id_idx on owned_equipment (product_id);
create index if not exists payments_order_id_idx on payments (order_id);
create index if not exists posts_author_id_idx on posts (author_id);
create index if not exists product_documents_product_id_idx on product_documents (product_id);
create index if not exists product_images_product_id_idx on product_images (product_id);
create index if not exists promotions_category_id_idx on promotions (category_id);
create index if not exists promotions_product_id_idx on promotions (product_id);
create index if not exists quote_items_product_id_idx on quote_items (product_id);
create index if not exists quote_items_quote_id_idx on quote_items (quote_id);
create index if not exists quotes_requested_by_idx on quotes (requested_by);
create index if not exists settings_updated_by_idx on settings (updated_by);
create index if not exists shipments_created_by_idx on shipments (created_by);
create index if not exists shipments_order_id_idx on shipments (order_id);
create index if not exists support_tickets_assigned_to_idx on support_tickets (assigned_to);
create index if not exists support_tickets_company_id_idx on support_tickets (company_id);
create index if not exists support_tickets_equipment_id_idx on support_tickets (equipment_id);
create index if not exists support_tickets_opened_by_idx on support_tickets (opened_by);
create index if not exists ticket_messages_author_id_idx on ticket_messages (author_id);
create index if not exists ticket_messages_ticket_id_idx on ticket_messages (ticket_id);
