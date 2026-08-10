-- Migración: product_documents_rls
-- `product_documents` no tenía ninguna política RLS (bug preexistente,
-- confirmado por el comentario en apps/web/components/product-tabs.tsx:
-- "product_documents sigue sin política de lectura"). Sin política, RLS
-- deniega todo por defecto — ni master podía escribir, ni el catálogo
-- público podía mostrar fichas técnicas, ni un cliente podía ver el
-- manual de su propio equipo. docs/tasks/ACTIVE-productos-imagenes-
-- fichas-import.md fase 1.
-- Reversión:
--   drop policy product_documents_read_public on product_documents;
--   drop policy product_documents_read_owner on product_documents;
--   drop policy product_documents_write_master on product_documents;

alter table product_documents enable row level security;

-- Fichas técnicas y cualquier documento marcado público — visible a
-- cualquiera (regla de negocio 5.1: el catálogo sin precio es público,
-- las especificaciones también).
create policy product_documents_read_public on product_documents
for select to anon, authenticated
using (is_public = true);

-- Manuales privados (is_public = false): solo el dueño del equipo
-- (misma empresa) puede leerlos — regla de negocio 5.5.
create policy product_documents_read_owner on product_documents
for select to authenticated
using (
  is_public = false
  and exists (
    select 1 from owned_equipment oe
    where oe.product_id = product_documents.product_id
      and oe.company_id in (select auth_company_ids())
  )
  or is_master()
);

create policy product_documents_write_master on product_documents
for all to authenticated
using (is_master())
with check (is_master());
