# Tarea: Carga de 8 productos (fichas de WhatsApp) + 2 categorías nuevas

Riesgo: Normal (categorías + contenido de producto, sin cambios de
código de aplicación más allá del ícono de categoría).

## Contexto

El usuario compartió 8 fichas técnicas reales (capturas de WhatsApp,
`~/Downloads/WhatsApp Unknown 2026-08-28 at 9.54.59 PM/`) para cargar
al catálogo, autorizando crear categorías si hacía falta.

Identificados 3 tipos de equipo:
- **Balanceadoras** (4: TECNI-U579, TECNI-T115, TECNI-7050,
  TECNI-7020) — categoría ya existente (`balanceadoras`), mismas 12
  specs.
- **Inspector de llantas** (2: TECNI-PL-S275, TECNI-PL-S825) —
  categoría nueva (`inspector-llantas`), 6 specs (Modelo, Voltaje,
  Precisión de aire, Diámetro del rin, Ancho del rin, Peso neto).
- **Rectificadora de rines** (2: 1 Puesto y Con Motor, TECNI) —
  categoría nueva (`rectificadora-rines`), 5 specs (Cono matriz,
  Dimensión, Motor, Sitios de trabajo, Estructura).

## Hecho

- Migración `20260829120000_seed_categorias_inspector_rectificadora.sql`:
  2 categorías nuevas + sus `attribute_definitions`.
- 8 productos creados (SKU, slug, nombre, descripción corta, tipo
  `equipment`, marca TECNI, `is_serialized=true`,
  `warranty_months=12`) — vía `execute_sql` (contenido de aplicación,
  mismo criterio que los productos ya cargados anteriormente: no se
  trackean en migraciones, solo el esquema/categorías).
- Specs cargadas para los 8 productos (`product_attributes`), leídas
  directamente de las fichas.
- Accesorios opcionales (`product_accessories`) para las 4
  Balanceadoras: "Conos céntricos Rin 17.5" y "Adaptador de moto"
  (sección "Partes opcionales" de la ficha — las "Partes estándar"
  quedan fuera por ser incluidas, no opcionales).
- `apps/web/lib/category-icons.ts`: íconos `search` e `compress` para
  las 2 categorías nuevas.

## Pendiente — imágenes

**No se pudieron subir las fotos de producto.** Las credenciales de
R2 en este entorno local (`.env.local`) son un placeholder
(`R2_ACCESS_KEY_ID`/`R2_SECRET_ACCESS_KEY` = literalmente
`[SENSITIVE]`, 11 caracteres) — confirmado además con
`vercel env pull --environment=production`: esas variables **no
existen** todavía en el proyecto de Vercel, ni siquiera en producción.
Es la misma limitación documentada en tareas anteriores.

Los 8 productos quedaron creados como **borrador**
(`is_active=false`) a propósito — no se publican sin foto, para no
mostrar un producto sin imagen en el catálogo. Recorté la foto de
producto de cada ficha (sin el texto/spec table) y se las envié al
usuario para que las suba manualmente desde
`/admin/productos/[id]#imagenes`; en cuanto tenga al menos una foto
cada uno, marcar "Activo" para publicarlos.

Una vez el usuario configure `R2_ACCESS_KEY_ID`/`R2_SECRET_ACCESS_KEY`/
`R2_ACCOUNT_ID`/`R2_BUCKET_NAME`/`R2_PUBLIC_URL` reales en Vercel
(`docs/19-DEPLOYMENT.md`), esta limitación desaparece para futuras
cargas.

## Verificación

- `pnpm typecheck && pnpm lint` en verde.
- `mcp__Supabase__execute_sql` confirmó los 8 productos, sus specs y
  accesorios.
- `mcp__Supabase__get_advisors` (security): sin hallazgos nuevos.
- Chrome: `GET /catalogo/categoria/inspector-llantas`,
  `/rectificadora-rines`, `/balanceadoras` → 200 (vacías, productos en
  borrador — esperado hasta que tengan foto).
- Sin RLS nueva — categorías/specs reutilizan políticas genéricas.
