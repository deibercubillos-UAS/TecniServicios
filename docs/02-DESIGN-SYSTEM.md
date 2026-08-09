# 02 — Sistema de diseño

Volver a [`00-INDEX.md`](./00-INDEX.md)

Estilo: **industrial + tecnológico + automotriz + moderno + profesional.**
Slogan: *"Soluciones que construyen confianza"*.

---

## 1. Paleta

| Token | Hex | Uso |
|---|---|---|
| `--tecni-red` | `#D71920` | Color de marca. CTAs primarios, acentos, estados activos |
| `--tecni-black` | `#111111` | Fondo oscuro principal, header, footer |
| `--tecni-graphite` | `#2B2B2B` | Superficies elevadas sobre negro, cards oscuras, bordes |
| `--tecni-steel` | `#A7A9AC` | Texto secundario, iconos inactivos, separadores |
| `--tecni-light` | `#E5E7E9` | Fondos de sección claros, superficies alternas |
| `--tecni-white` | `#FFFFFF` | Fondo principal claro, texto sobre oscuro |

**El rojo es acento, no fondo.** Superficies grandes en rojo saturan y bajan la
percepción de profesionalismo. Regla práctica: el rojo no supera el **10%** de la
superficie visible de una pantalla, salvo el hero.

### Roles semánticos

```css
:root {
  --brand:            #D71920;
  --brand-hover:      #B31419;   /* rojo -12% luminosidad */
  --brand-active:     #8F1014;
  --brand-subtle:     #FDECEC;   /* fondo de badges y alertas suaves */

  --bg:               #FFFFFF;
  --bg-alt:           #E5E7E9;
  --bg-inverse:       #111111;
  --surface:          #FFFFFF;
  --surface-raised:   #FFFFFF;
  --surface-inverse:  #2B2B2B;

  --text:             #111111;
  --text-muted:       #6B6D70;   /* steel oscurecido: A7A9AC no pasa AA sobre blanco */
  --text-inverse:     #FFFFFF;
  --text-inverse-muted: #A7A9AC;

  --border:           #D5D7D9;
  --border-strong:    #A7A9AC;
  --border-inverse:   #2B2B2B;

  --success:          #1B8A4B;
  --warning:          #C77700;
  --danger:           #D71920;   /* coincide con marca: usar icono para distinguir */
  --info:             #1D6FB8;
}
```

### Accesibilidad — verificado

| Combinación | Ratio | WCAG |
|---|---|---|
| `#111111` sobre `#FFFFFF` | 18.9:1 | AAA |
| `#FFFFFF` sobre `#D71920` | 5.3:1 | AA (texto normal) ✅ |
| `#FFFFFF` sobre `#111111` | 18.9:1 | AAA |
| `#A7A9AC` sobre `#FFFFFF` | 2.2:1 | ❌ **Prohibido para texto** |
| `#A7A9AC` sobre `#111111` | 8.5:1 | AAA ✅ |
| `#6B6D70` sobre `#FFFFFF` | 5.1:1 | AA ✅ |

**Regla dura:** `#A7A9AC` solo se usa como texto sobre fondo oscuro. Sobre fondo
claro se usa `--text-muted` (`#6B6D70`). Este es el error más fácil de cometer con
esta paleta.

---

## 2. Tipografía

**Montserrat** en todo el sitio. Cargada con `next/font/google`, subconjunto
`latin`, `display: swap`.

```ts
import { Montserrat } from "next/font/google";
export const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-montserrat",
  display: "swap",
});
```

### Escala

| Token | Tamaño | Peso | Interletrado | Uso |
|---|---|---|---|---|
| `display` | 56 / 40 móvil | 800 | -0.02em | Hero |
| `h1` | 40 / 32 | 700 | -0.02em | Título de página |
| `h2` | 32 / 26 | 700 | -0.01em | Sección |
| `h3` | 24 / 20 | 600 | -0.01em | Card, subsección |
| `h4` | 20 / 18 | 600 | 0 | Ficha técnica |
| `body-lg` | 18 | 400 | 0 | Intro de artículo |
| `body` | 16 | 400 | 0 | Texto base |
| `body-sm` | 14 | 400 | 0 | Secundario, tabla |
| `caption` | 12 | 500 | 0.02em | Metadatos |
| `overline` | 12 | 700 | 0.12em | Etiquetas en mayúscula |
| `price` | 28 | 800 | -0.01em | Precio en ficha, tabular-nums |

**Cuerpo de texto: interlineado 1.6.** Títulos: 1.15–1.25.
Ancho máximo de párrafo: 70 caracteres.
Precios y cantidades siempre con `font-variant-numeric: tabular-nums`.

---

## 3. Espaciado y geometría

Escala base **4px**: `4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96 · 128`.

**Radios** — el lenguaje industrial pide esquinas contenidas, no redondeadas.

```css
--radius-sm: 2px;    /* badges, chips */
--radius:    4px;    /* botones, inputs, cards */
--radius-lg: 8px;    /* modales, contenedores grandes */
--radius-full: 999px; /* solo avatares y contadores */
```

**Sombras** — discretas. La jerarquía se construye con borde y contraste, no con
sombras difusas.

```css
--shadow-sm: 0 1px 2px rgba(17,17,17,.08);
--shadow:    0 2px 8px rgba(17,17,17,.10);
--shadow-lg: 0 8px 24px rgba(17,17,17,.14);
```

**Breakpoints:** `sm 640` · `md 768` · `lg 1024` · `xl 1280` · `2xl 1536`.
Contenedor máximo: `1280px` con `24px` de padding lateral (`16px` en móvil).

---

## 4. Elementos de lenguaje visual

Lo que hace que el sitio se lea "industrial automotriz" y no genérico:

- **Barra de acento roja** de 4px en el borde superior o izquierdo de cards
  destacadas y encabezados de sección.
- **Encabezados con overline** en mayúsculas y `letter-spacing` amplio sobre el
  título, en `--brand` o `--text-muted`.
- **Diagonales sutiles** (skew de 4–6°) en separadores de sección y en el hero.
  Con moderación: máximo dos por página.
- **Fondo negro con textura de grano fino** en secciones de marca, replicando el
  tratamiento del logo.
- **Fichas técnicas con líneas divisorias**, no con cards flotantes. La tabla
  comunica precisión mejor que la tarjeta.

**Lo que se evita:** degradados arcoíris, sombras de color, esquinas muy
redondeadas, ilustraciones caricaturescas, glassmorphism.

---

## 5. Componentes clave

### Botones

| Variante | Fondo | Texto | Borde | Uso |
|---|---|---|---|---|
| `primary` | `--brand` | blanco | ninguno | Acción principal, una por vista |
| `secondary` | transparente | `--text` | `--border-strong` | Acción alterna |
| `inverse` | blanco | `--tecni-black` | ninguno | Sobre fondo oscuro |
| `ghost` | transparente | `--text-muted` | ninguno | Terciaria |
| `danger` | `--danger` | blanco | ninguno | Destructiva, con icono |

Alturas: `sm 36px` · `md 44px` · `lg 52px`.
**Área táctil mínima 44×44px** en todos los controles.
Foco visible obligatorio: `outline: 2px solid var(--brand); outline-offset: 2px`.

### Card de producto

Imagen 4:3 sobre `--bg-alt` · badge de categoría (`overline`) · nombre en `h4`,
máximo dos líneas · marca en `caption` · zona de precio condicional:

- Usuario autenticado, `< umbral`: precio + "Agregar al carrito"
- Usuario autenticado, `≥ umbral`: "Solicitar cotización"
- Anónimo: bloque discreto **"Inicia sesión para ver el precio"**, nunca un
  precio tachado ni un placeholder que insinúe el valor
- Checkbox "Comparar" siempre visible, deshabilitado al llegar a 3

### Estados

Todo componente que carga datos define: `default`, `loading` (skeleton, no
spinner), `empty` (con acción sugerida), `error` (con reintento).
**Un estado vacío sin acción sugerida es un bug de diseño.**

---

## 6. Logo

`apps/web/public/brand/`

| Archivo | Uso |
|---|---|
| `logo-full-dark.png` | Logo completo sobre fondo oscuro |
| `logo-full-light.png` | Versión para fondo claro |
| `logo-mark.png` | Solo el isotipo (engranaje + T) |
| `favicon.ico`, `icon.png`, `apple-icon.png` | Iconos de sitio |

**Área de respeto:** el alto del isotipo alrededor del logo.
**Tamaño mínimo:** 32px de alto para el completo, 24px para el isotipo.
El logo nunca se deforma, recolorea, rota ni se pone sobre foto sin capa de
contraste. En header claro se usa la versión de fondo claro, no la oscura con
filtro CSS.

---

## 7. Movimiento

Duraciones: `fast 120ms` · `base 200ms` · `slow 320ms`.
Curva por defecto: `cubic-bezier(0.4, 0, 0.2, 1)`.

Se anima: opacidad, transform, color de fondo y borde.
No se anima: alto, ancho, ni propiedades que provoquen reflow.

**Obligatorio** respetar `prefers-reduced-motion: reduce` desactivando toda
animación no esencial.

---

## 8. Reglas para quien implementa

1. Nunca escribas un hex en un componente. Solo variables CSS o clases de Tailwind
   mapeadas a esas variables.
2. Nunca uses `#A7A9AC` para texto sobre fondo claro.
3. Un CTA primario por pantalla. Si hay dos, uno debe ser `secondary`.
4. Todo estado interactivo necesita `hover`, `focus-visible`, `active` y
   `disabled` definidos.
5. Móvil primero. El catálogo se navega desde el celular en el taller.
6. Si un componente no está en `03-UI-COMPONENTS.md`, se documenta ahí antes de
   usarse por segunda vez.

---

## 9. Accesibilidad — checklist WCAG 2.1 AA

Paso 1.2 de `DONE-fase-6-endurecimiento-A.md`. Reusable en toda pantalla
nueva o auditoría futura — no exclusivo de la Fase 6. La sección 1
("Accesibilidad — verificado") ya cubre contraste de color; esta cubre el
resto de los criterios AA aplicables a este producto.

### Contraste
- [ ] Texto normal ≥ 4.5:1, texto grande (≥18pt o ≥14pt bold) ≥ 3:1 — usar
  solo los pares ya verificados en la sección 1, nunca un hex nuevo sin medir.
- [ ] Elementos de UI no textuales con significado (bordes de input, iconos de
  estado) ≥ 3:1 contra el fondo adyacente.

### Foco y teclado
- [ ] Todo elemento interactivo (link, botón, input, select) alcanzable con
  `Tab` en un orden lógico, sin trampas de foco.
- [ ] `focus-visible` siempre visible — nunca `outline: none` sin un
  reemplazo igual o más visible (regla 4 de la sección 8, ahora explícita
  para accesibilidad además de estética).
- [ ] Modales/dropdowns atrapan el foco mientras están abiertos y lo
  devuelven al elemento que los abrió al cerrar.
- [ ] `Escape` cierra modales, dropdowns y menús.

### Semántica y lectores de pantalla
- [ ] Un `<h1>` por página, jerarquía de encabezados sin saltos
  (`h2` → `h4` sin `h3` está mal).
- [ ] Toda imagen con significado tiene `alt` descriptivo; imagen decorativa
  usa `alt=""`.
- [ ] Todo `<input>`/`<select>`/`<textarea>` tiene `<label>` asociado (por
  `htmlFor`/`id`, nunca solo `placeholder` como etiqueta).
- [ ] Botones de solo-icono tienen `aria-label`.
- [ ] Mensajes de error de formulario asociados al campo (`aria-describedby`),
  no solo color — el color solo no comunica un error a quien no lo percibe.
- [ ] Contenido dinámico importante (confirmación de acción, error de
  servidor) en una región `aria-live` cuando no hay recarga de página de por
  medio.

### Estructura y movimiento
- [ ] Landmarks HTML5 (`<header>`, `<nav>`, `<main>`, `<footer>`) en vez de
  `<div>` genérico para la estructura de página.
- [ ] Ninguna animación esencial para entender el contenido — decorativa
  únicamente, respeta `prefers-reduced-motion` (ver sección 7, "Movimiento").
- [ ] Objetivo táctil mínimo 44×44px en botones e íconos interactivos —
  relevante en catálogo/carrito, navegado desde el celular en el taller
  (regla 5 de la sección 8).

### Cuándo se aplica
Auditoría manual contra esta lista en el paso 4.1 de la Fase 6 (home,
catálogo, ficha de producto, carrito, checkout, `/mi-cuenta`). A partir de
ahí, **toda pantalla nueva se revisa contra esta lista antes de darse por
terminada** — no es exclusiva de una auditoría puntual.
