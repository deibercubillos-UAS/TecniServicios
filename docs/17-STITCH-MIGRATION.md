# 17 — Migración desde Google Stitch

Volver a [`00-INDEX.md`](./00-INDEX.md) · Tokens en [`02-DESIGN-SYSTEM.md`](./02-DESIGN-SYSTEM.md)

---

## 1. Qué es y qué no es

Google Stitch genera la **base visual**: layout, jerarquía y composición de cada
pantalla. Es un punto de partida, no el resultado final.

**Stitch define:** distribución, jerarquía visual, densidad, flujo de la pantalla.
**Stitch NO define:** colores finales, tipografía, componentes reutilizables,
accesibilidad, estados, ni lógica.

El código de Stitch **nunca se pega directamente al repositorio.** Pasa siempre
por el pipeline de esta página.

---

## 2. Pipeline

```
1. Generar pantalla en Stitch con el prompt base (sección 3)
        │
2. Exportar el HTML/CSS a  design/stitch/{pantalla}/
        │  (carpeta fuera del build, es material de referencia)
3. AUDITAR: ¿qué es estructura, qué es decoración?
        │
4. TOKENIZAR: todo hex, tamaño y espaciado → variables de 02-DESIGN-SYSTEM
        │
5. EXTRAER componentes → packages/ui, documentar en 03-UI-COMPONENTS
        │
6. RECONSTRUIR la pantalla en Next.js con esos componentes
        │
7. VERIFICAR: contraste, foco, teclado, responsive, estados
        │
8. Registrar la pantalla en el MODULE-*.md correspondiente
```

**El paso 4 no es negociable.** Un solo hex hardcodeado que sobreviva rompe la
capacidad de mantener el sistema, y con Stitch entran decenas.

---

## 3. Prompt base para Stitch

Usar esta descripción como contexto en toda generación, ajustando solo la
pantalla concreta:

> Sitio web B2B para Tecni Equipos y Servicios SAS, empresa colombiana de
> maquinaria y herramientas para talleres automotrices (alineadoras, balanceadoras,
> elevadores, escáneres de diagnóstico, insumos).
>
> Estilo: industrial, tecnológico, automotriz, moderno y profesional.
> Transmite precisión y confianza técnica, no calidez ni juego.
>
> Colores: rojo #D71920 como acento (nunca como fondo dominante),
> negro #111111, grafito #2B2B2B, acero #A7A9AC, gris claro #E5E7E9, blanco.
> Tipografía: Montserrat. Títulos en 700–800, cuerpo en 400.
> Esquinas poco redondeadas (2–4px). Sombras discretas.
> Slogan: "Soluciones que construyen confianza".
>
> Diseño móvil primero: los usuarios navegan desde el taller.
> Denso en información técnica, jerarquía clara, mucho contraste.

**Añadir siempre al final del prompt de cada pantalla:**
> No incluyas precios visibles para usuarios no autenticados.

---

## 4. Reglas de conversión

| En el export de Stitch | Qué hacer |
|---|---|
| `#D71920` o similar | `var(--brand)` |
| Cualquier gris | El token más cercano de la escala. Nunca inventar grises |
| `padding: 22px` | Redondear a la escala de 4px → `24px` |
| `border-radius: 12px` | Reducir a `--radius` (4px) o `--radius-lg` (8px) |
| `<div>` clicable | `<button>` o `<a>` real, con estados de foco |
| Texto gris claro sobre blanco | Cambiar a `--text-muted`. Verificar contraste |
| Iconos como imagen | Reemplazar por `lucide-react` |
| Cualquier fuente que no sea Montserrat | Montserrat |
| Bloque repetido 2+ veces | Extraer a componente en `packages/ui` |
| Datos de ejemplo embebidos | Reemplazar por props tipadas |

---

## 5. Checklist por pantalla migrada

- [ ] Cero valores hexadecimales en el código final
- [ ] Cero tamaños de fuente fuera de la escala de `02-DESIGN-SYSTEM`
- [ ] Todo espaciado múltiplo de 4
- [ ] Contraste verificado en todo texto (herramienta, no a ojo)
- [ ] Navegable completa con teclado, foco siempre visible
- [ ] Estados definidos: `default`, `loading`, `empty`, `error`
- [ ] Probada en 375px, 768px y 1440px
- [ ] Componentes nuevos documentados en `03-UI-COMPONENTS.md`
- [ ] Si muestra precios: verificado el comportamiento como anónimo
- [ ] Imágenes con `next/image` y `alt` descriptivo

---

## 6. Orden de migración

Se migra en el mismo orden del roadmap, para no rehacer trabajo:

| # | Pantalla | Fase |
|---|---|---|
| 1 | Home | 2 |
| 2 | Catálogo con filtros | 2 |
| 3 | Ficha de producto | 2 |
| 4 | Comparador | 2 |
| 5 | Login / registro | 2 |
| 6 | Contacto | 2 |
| 7 | Carrito y checkout | 3 |
| 8 | Dashboard del cliente | 3 |
| 9 | Cotizaciones y pedidos | 3 |
| 10 | Panel de vendedor | 4 |
| 11 | Panel de técnico | 4 |
| 12 | Panel maestro | 5 |
| 13 | Blog | 5 |

**La 1 y la 2 se migran primero y con especial cuidado:** de ahí sale el 80% de
los componentes que reutilizarán todas las demás.

---

## 7. Herramientas del entorno de Claude Code

Con **Graphify** y **UI/UX Pro Max** instalados en el chat de código:

- Graphify se usa para diagramas de flujo y arquitectura que se incrustan en los
  `.md`, no para producción de UI.
- UI/UX Pro Max se usa para auditar las pantallas migradas contra el sistema de
  diseño y para revisar accesibilidad.
- **Ninguna de las dos reemplaza el checklist de la sección 5.** Son apoyo, no
  aprobación.

---

## 8. Qué NO se migra de Stitch

- Cualquier animación compleja: se rehace según `02-DESIGN-SYSTEM` sección 7.
- Formularios: se reconstruyen con validación Zod desde cero.
- Cualquier lógica de estado: Stitch no la genera correctamente.
- Textos de relleno: se reemplazan por contenido real o por props.
