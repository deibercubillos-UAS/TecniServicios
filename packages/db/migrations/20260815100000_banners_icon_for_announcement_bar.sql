-- La franja de anuncio (`announcement_bar`) no muestra imagen — el admin
-- elige un ícono de un set fijo en vez de subir una foto. `image_url` deja
-- de ser obligatoria a nivel de esquema; los demás placements la siguen
-- pidiendo desde la validación de aplicación (`packages/core/src/content/manage-banner.ts`).
alter table banners alter column image_url drop not null;
alter table banners add column icon text;
