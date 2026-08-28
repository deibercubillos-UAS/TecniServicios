# Tarea: Categoría Balanceadoras + 12 especificaciones

Riesgo: Normal (categoría nueva + specs, sin código de aplicación —
`attribute_definitions`/`product_accessories` ya son genéricos).

## Contexto

El usuario pidió 12 specs para "Balanceadoras". No existía como
categoría separada — estaba mezclada dentro de "Alineación"
(`alineacion-balanceo`), que ya tenía 4 specs genéricas compartidas
con las alineadoras. Se confirmó con el usuario (`AskUserQuestion`):
crear "Balanceadoras" como categoría propia, para no mezclar specs de
balanceo en las fichas de alineadoras existentes.

Sobre "accesorios para compra opcionales": se confirmó que se refiere
a la sección informativa de Accesorios ya construida (nombre,
descripción, foto) — funciona para cualquier producto sin importar la
categoría, así que no requirió ningún cambio de código. El master solo
necesita cargar los accesorios desde `/admin/productos/[id]#accesorios`
cuando cree productos de esta categoría.

## Hecho

- Migración `20260828140000_seed_category_balanceadoras.sql`: crea la
  categoría `balanceadoras` (position 8) y sus 12
  `attribute_definitions` (Poder, Velocidad de balanceo, Precisión de
  balanceo, Diámetro del rin, Ancho del rin, Peso de la llanta, Tiempo
  de ciclo, Ruido, Peso neto, Temperatura de trabajo, Tamaño del
  empaque, Voltaje) — todas opcionales, texto libre sin `unit` (mismo
  criterio que Desmontadoras, por si llevan rango/unidad embebida).
- Los 2 productos "Balanceadora ..." existentes (BAL-COR-900,
  BAL-HOF-GEO) ya estaban eliminados (`deleted_at`) — no había
  productos activos que mover. Cuando el master cree o reactive
  productos de balanceo, debe asignarles esta categoría manualmente.
- `apps/web/lib/category-icons.ts`: ícono `sliders` para
  `balanceadoras` (antes caía al `box` genérico por defecto).

## Verificación

- `pnpm typecheck && pnpm lint` en verde.
- `mcp__Supabase__execute_sql` confirmó las 12 definiciones creadas en
  orden.
- Chrome: `GET /catalogo/categoria/balanceadoras` → 200 (vacía, sin
  productos activos todavía — esperado).
- Sin cambios de RLS (categoría y attribute_definitions reutilizan las
  políticas existentes, genéricas por diseño).

## Bitácora

- 2026-08-28: Aclarado con el usuario (categoría nueva vs. reusar
  Alineación; accesorios informativos vs. comprables) antes de tocar
  la base de datos.
- 2026-08-28: Migración aplicada y verificada. Tarea completa.
