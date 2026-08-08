# 03 — Componentes UI

Volver a [`00-INDEX.md`](./00-INDEX.md) · Tokens en [`02-DESIGN-SYSTEM.md`](./02-DESIGN-SYSTEM.md) · Pipeline de Stitch en [`17-STITCH-MIGRATION.md`](./17-STITCH-MIGRATION.md)

---

## 1. Primeros componentes: migración de la Home (Fase 2, paso 6.2)

`packages/ui` nace con los componentes extraídos al auditar
`design/stitch/home/code.html`. Todos en `packages/ui/src/`, sin lógica de
negocio, consumiendo solo clases de Tailwind mapeadas a los tokens de
`02-DESIGN-SYSTEM.md` (nunca un hex suelto).

| Componente | Uso |
|---|---|
| `Icon` | Set mínimo de íconos en línea (SVG, `currentColor`) — reemplaza Google Material Symbols |
| `Button` | `primary`/`secondary`/`tertiary`, mismos 3 niveles que definía Stitch |
| `Badge` | Insignia con punto — usada en el hero |
| `StatItem` | Ícono + número + etiqueta, franja de estadísticas |
| `FeatureCard` | Ícono + título + descripción, propuesta de valor |
| `AudienceCard` | Tarjeta de segmento (profesional / empresa), fondo degradado |
| `CategoryChip` | Ícono + etiqueta, chip de categoría con enlace |
| `TrustItem` | Ícono + etiqueta, franja de confianza |

## 2. Qué cambió respecto al export de Stitch (auditoría)

Stitch define layout y jerarquía, no color final, tipografía ni datos reales
(sección 1 de este documento en `17-STITCH-MIGRATION.md`). Al reconstruir:

- **Tipografía:** Stitch generó con Oswald + Hanken Grotesk (vía Google
  Fonts). Se descarta — el proyecto usa **Montserrat** únicamente
  (`02-DESIGN-SYSTEM.md` sección 2, ya cargada con `next/font` desde la
  Fase 0). No se agrega una segunda familia tipográfica.
- **Íconos:** Stitch usó Material Symbols vía CDN de Google Fonts —
  dependencia externa no autoseleccionada por el proyecto. Se reemplazó por
  `Icon`, un set mínimo de SVG en línea con los únicos ~20 íconos que usa
  la home real.
- **Colores:** la paleta de Stitch (rojo `#D32027`/`#AC0015`, carbón
  `#1A1A1C`) es una aproximación de IA a nuestra marca, no la fuente de
  verdad. Se mapeó a los tokens reales: `--color-brand` (`#D71920`),
  `--color-bg-inverse`/`--color-surface-inverse` (`#111111`/`#2B2B2B`),
  `--color-text-muted`, `--color-border`, etc. — ningún hex de Stitch
  sobrevivió al componente final.
- **Fotos de stock de Google:** el export traía imágenes alojadas en
  `lh3.googleusercontent.com` (URLs temporales de la generación de Stitch,
  no sirven en producción) — entre ellas, tres "fotos de clientes"
  (headshots genéricos de banco de imágenes) presentadas junto a la
  afirmación **"+500 talleres confían en nosotros"** y una calificación de
  4.5 estrellas. Se retiraron: son contenido fabricado sin respaldo real
  (ningún testimonio, cifra de clientes o reseña verificada existe
  todavía). Publicar eso sería engañoso. `AudienceCard` usa un fondo
  degradado con los tokens de marca en vez de una foto — las fotos reales
  del taller/showroom se agregan cuando el usuario las provea.
- **Cifras de la franja de estadísticas** ("15+ años", "500+ talleres",
  "10k+ referencias", "24/7 soporte"): mismo problema — sin fuente real.
  Se mantiene la sección (es una pieza de layout válida para cuando haya
  datos reales) pero **no se reconstruye en 6.3 con esos números
  inventados** — queda pendiente de que el usuario confirme las cifras
  reales antes de publicarla (ver "Pendientes descubiertos" en la tarea).

## 3. Accesibilidad (checklist de `17-STITCH-MIGRATION.md` sección 5)

- Todo ícono decorativo lleva `aria-hidden="true"` (el texto adyacente ya
  transmite el significado — ningún ícono es el único portador de
  información).
- Contraste verificado contra los tokens reales (no los de Stitch): texto
  sobre `--surface-inverse`/`--bg-inverse` usa `--text-inverse`, nunca
  gris de bajo contraste.
- Componentes interactivos (`Button`, `CategoryChip`) son elementos nativos
  (`<button>`, `<a>`) — foco de teclado y `:hover`/`:focus` vienen del
  navegador, no se suprimen.
