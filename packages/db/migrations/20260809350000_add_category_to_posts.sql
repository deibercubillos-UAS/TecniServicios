-- Migración: add_category_to_posts
-- Rediseño de /blog (mockup del usuario) pide categorías filtrables por
-- pill — no existía taxonomía de blog. Columna simple de texto libre
-- (no una tabla de categorías aparte, mismo criterio de alcance mínimo
-- que el resto del proyecto), editable por master al crear/editar un
-- post. Las pills del listado se calculan de las categorías realmente
-- usadas en posts publicados — nunca una lista fija inventada.
-- Reversión: alter table posts drop column category;

alter table posts add column category text;
