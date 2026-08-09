-- Migración: seed_contact_settings
-- Rediseño de /contacto (mockup del usuario) necesita WhatsApp, teléfono,
-- correo, dirección y horario — ninguno existe todavía como dato real en
-- el sistema. Decisión explícita del usuario (AskUserQuestion): mostrar
-- la estructura completa con placeholders visibles ("Pendiente de
-- definir"), editables por master desde /admin/configuracion (genérico,
-- ya existe, no necesita UI nueva). `settings` solo tenía política para
-- master (05-RLS-SECURITY-C.md) — se agrega lectura pública acotada a
-- las claves `contact_*`, el resto de settings sigue bloqueado a anon.
-- Reversión: delete from settings where key like 'contact_%';
--            drop policy settings_read_contact_public on settings;

insert into settings (key, value, description) values
  ('contact_whatsapp', '"Pendiente de definir"', 'Número de WhatsApp mostrado en /contacto, ej. "+57 300 000 0000"'),
  ('contact_phone', '"Pendiente de definir"', 'Teléfono de ventas mostrado en /contacto'),
  ('contact_phone_hours', '"Pendiente de definir"', 'Horario de atención telefónica, ej. "Lun-Vie: 8am - 6pm"'),
  ('contact_email', '"Pendiente de definir"', 'Correo de ventas mostrado en /contacto'),
  ('contact_address_line', '"Pendiente de definir"', 'Dirección de la sede, ej. "Calle 123 # 45-67, Zona Industrial"'),
  ('contact_address_city', '"Pendiente de definir"', 'Ciudad de la sede, ej. "Bogotá D.C."'),
  ('contact_map_link', '""', 'URL de Google Maps a la sede — vacío oculta el enlace "Cómo llegar"'),
  ('contact_hours_weekday', '"Pendiente de definir"', 'Horario lunes a viernes, ej. "8:00 AM - 6:00 PM"'),
  ('contact_hours_saturday', '"Pendiente de definir"', 'Horario sábados, ej. "9:00 AM - 1:00 PM"'),
  ('contact_response_time', '"Pendiente de definir"', 'Tiempo de respuesta estimado, ej. "menos de 2 horas hábiles"');

create policy settings_read_contact_public on settings
for select to anon, authenticated
using (key like 'contact\_%' escape '\');
