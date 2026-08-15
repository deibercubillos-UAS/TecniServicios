-- La ciudad de cobertura pasa de texto libre a una lista desplegable
-- (departamento + ciudad, ver apps/web/lib/colombia-geo.ts) — se agrega
-- `department` como acompañante de `city`, que ya existía.
alter table maintenance_availability add column department text;
