# TAREA: Fase 0 — Fundación

**Estado:** En curso · **Riesgo:** Grande
**Inicio:** 2026-08-08 · **Última actualización:** 2026-08-08

## Objetivo

Dejar un esqueleto de aplicación desplegable, tipado en estricto y fiel al
sistema de diseño: monorepo Turborepo con pnpm, `apps/web` en Next.js 15 con
Tailwind v4 y Montserrat, los seis paquetes vacíos, ESLint/Prettier
compartidos, CI con lint/typecheck/build, validación de entorno con Zod, y los
cuatro ADR fundacionales. Al terminar, una home placeholder con header y
footer debe reflejar el sistema de diseño real, sin datos inventados.

**No entra en esta tarea:**
- Tablas ni migraciones de base de datos (Fase 1, requiere leer
  `05-RLS-SECURITY.md` primero).
- Lógica de negocio en `packages/core` u otros paquetes (siguen vacíos).
- Crear proyectos Supabase, conectar Vercel/Cloudflare o cargar secretos
  reales — son tareas operativas del usuario, no de esta sesión de código.
- Componentes del catálogo, autenticación o cualquier pantalla más allá de la
  home placeholder.

## Documentos consultados

- `CLAUDE.md` — reglas de oro, stack, reglas de negocio, política de git y de secretos.
- `docs/00-INDEX.md` — mapa de documentación y estados.
- `docs/01-ARCHITECTURE.md` — estructura exacta del monorepo (sección 2), qué
  va en cada paquete (sección 3), tabla de ADR pendientes (sección 9).
- `docs/02-DESIGN-SYSTEM.md` — paleta y roles semánticos (sección 1),
  tipografía y config exacta de Montserrat (sección 2), espaciado/radios/sombras
  (sección 3), reglas de contraste, logo (sección 6).
- `docs/19-DEPLOYMENT.md` — inventario de variables (sección 4), validación
  Zod server/client (sección 5), qué NO debe pasar en un commit.
- `docs/21-ROADMAP.md` — definición de "listo" de la Fase 0.
- `docs/23-TASK-EXECUTION.md` — metodología de fases y pasos.
- `docs/progress/TODO.md` y `docs/tasks/README.md` — confirmado: no había
  tarea activa, TODO de Fase 0 coincide con el alcance pedido.

## Decisiones tomadas durante la ejecución

- 2026-08-08: se importó la base documental (`CLAUDE.md`, `docs/`,
  `design/stitch/`, `.env.example`, `.gitignore`, plantilla de PR) al
  repositorio `TecniServicios` en `main`, ya que el repo solo tenía un
  `README.md` placeholder. Commit `c0ad818`. Esto fue un paso previo a esta
  tarea, no parte del plan de fases (no toca código de aplicación).

---

## Plan

### Fase 1 — Esqueleto del monorepo y paquete de configuración compartida

- [ ] **1.1** Crear `pnpm-workspace.yaml`, `turbo.json` y `package.json` raíz
  (scripts `dev`/`build`/`lint`/`typecheck` delegados a Turborepo), más
  `.nvmrc`/`engines` para fijar versión de Node.
  - Verificación: `pnpm install` corre sin error en la raíz (workspace vacío
    de apps/packages todavía, solo estructura).
  - Reversión: `git rm` de los archivos creados; no hay estado persistente.
- [ ] **1.2** Crear `packages/config` con `package.json`, `tsconfig.base.json`
  (estricto: `strict`, `noUncheckedIndexedAccess`, sin `any` implícito) y
  `tsconfig.nextjs.json` que lo extienda para `apps/web`.
  - Verificación: `pnpm --filter @tecni/config exec tsc --showConfig` no falla.
  - Reversión: eliminar `packages/config`.
- [ ] **1.3** Añadir ESLint compartido en `packages/config` (`eslint-config.js`
  o `eslint.config.js` plano, según versión de ESLint compatible con Next 15).
  - Verificación: `pnpm exec eslint --print-config packages/config/index.ts`
    resuelve sin error.
  - Reversión: eliminar el archivo de config de ESLint.
- [ ] **1.4** Añadir Prettier compartido (`.prettierrc` en `packages/config`,
  referenciado desde la raíz).
  - Verificación: `pnpm exec prettier --check packages/config` no lanza error
    de configuración (puede reportar archivos sin formatear, eso es esperado
    aún sin código).
  - Reversión: eliminar `.prettierrc`.

### Fase 2 — Paquetes vacíos de dominio

- [ ] **2.1** Crear `packages/core` (`package.json` + `tsconfig.json` que
  extiende `packages/config` + `src/index.ts` placeholder, **sin lógica de
  negocio**, sin dependencias de React).
  - Verificación: `pnpm --filter @tecni/core build` (o `tsc --noEmit`) pasa.
  - Reversión: eliminar `packages/core`.
- [ ] **2.2** Crear `packages/db` (mismo patrón; sin migraciones ni esquema
  todavía, solo estructura y `src/index.ts` placeholder).
  - Verificación: igual que 2.1.
  - Reversión: eliminar `packages/db`.
- [ ] **2.3** Crear `packages/ui` (mismo patrón; sin componentes todavía).
  - Verificación: igual que 2.1.
  - Reversión: eliminar `packages/ui`.
- [ ] **2.4** Crear `packages/integrations` (mismo patrón; sin clientes de
  Siigo/Wompi/Resend/R2 todavía).
  - Verificación: igual que 2.1.
  - Reversión: eliminar `packages/integrations`.
- [ ] **2.5** Crear `packages/shared` (mismo patrón; aquí vivirá `env.ts` en la
  Fase 5, pero este paso solo deja la estructura y tipos/constantes vacíos).
  - Verificación: igual que 2.1.
  - Reversión: eliminar `packages/shared`.

### Fase 3 — `apps/web`: Next.js 15 + TypeScript estricto + Tailwind v4

- [ ] **3.1** Inicializar `apps/web` con Next.js 15 (App Router) y React 19,
  con la estructura exacta de `01-ARCHITECTURE.md` sección 8: grupos
  `(public)`, `(auth)`, `(customer)`, `(staff)`, y `api/v1/` (carpetas base,
  sin handlers todavía). `tsconfig.json` extiende
  `packages/config/tsconfig.nextjs.json`.
  - Verificación: `pnpm --filter web build` compila una página por defecto.
  - Reversión: eliminar `apps/web`.
- [ ] **3.2** Instalar y configurar Tailwind CSS v4 (`@tailwindcss/postcss`,
  `postcss.config.mjs`) en `apps/web`.
  - Verificación: `pnpm --filter web build` sigue compilando con Tailwind
    activo (una clase de utilidad de prueba se refleja en el CSS generado).
  - Reversión: revertir el commit del paso; quitar dependencias del
    `package.json` de `apps/web`.
- [ ] **3.3** Traducir a `globals.css` **todos** los tokens de
  `02-DESIGN-SYSTEM.md` sección 1 (paleta cruda + roles semánticos) como
  variables CSS (`:root`), sin agregar ni omitir ningún valor del documento.
  - Verificación: inspección manual línea por línea contra la tabla de la
    sección 1 del doc — cada variable del doc existe en el CSS y con el mismo
    hex; ningún hex adicional inventado.
  - Reversión: revertir el archivo `globals.css`.
- [ ] **3.4** Mapear esas variables a la configuración de Tailwind v4 (tokens
  `@theme` o equivalente v4: color, radius, shadow, spacing, breakpoints)
  según secciones 1 y 3 del doc de diseño.
  - Verificación: una clase Tailwind que use un token de marca (p. ej. fondo
    `--brand`) compila y aparece en el CSS de salida con el hex correcto.
  - Reversión: revertir el archivo de configuración de Tailwind.

### Fase 4 — Tipografía, layout raíz y home placeholder

- [ ] **4.1** Cargar Montserrat con `next/font/google` exactamente como en
  `02-DESIGN-SYSTEM.md` sección 2 (`subsets: ["latin"]`,
  `weight: ["400","500","600","700","800"]`, `variable: "--font-montserrat"`,
  `display: "swap"`), aplicada en el layout raíz.
  - Verificación: el HTML renderizado incluye la variable CSS de la fuente y
    el `<body>` la usa; no hay flash de fuente sin `display: swap`.
  - Reversión: revertir el archivo de layout.
- [ ] **4.2** **Punto de control — logo.** Antes de construir header/footer,
  confirmar si `apps/web/public/brand/` ya tiene los archivos de logo. Si no
  están, se pausa este paso y se pide al usuario que los coloque; no se
  inventa un logo de reemplazo.
  - Verificación: los tres archivos de logo (`logo-full-dark.png`,
    `logo-full-light.png`, `logo-mark.png`) existen antes de continuar.
  - Reversión: N/A (paso de verificación, no de escritura).
- [ ] **4.3** Layout raíz con header (logo + navegación mínima) y footer
  (slogan real, datos mínimos de contacto si están documentados) usando solo
  tokens del sistema de diseño.
  - Verificación: `pnpm --filter web build` compila; inspección visual de que
    ningún hex está hardcodeado (`grep -rn "#" apps/web/app` no debe mostrar
    hex fuera de `globals.css`).
  - Reversión: revertir el commit del layout.
- [ ] **4.4** Home placeholder con el slogan real ("Soluciones que construyen
  confianza") y texto mínimo, respetando la escala tipográfica y el principio
  de "el rojo no supera el 10% de la superficie".
  - Verificación: `pnpm --filter web build` compila; revisión visual manual
    contra `02-DESIGN-SYSTEM.md`.
  - Reversión: revertir el commit de la home.

### Fase 5 — Validación de entorno y CI

- [ ] **5.1** Implementar `packages/shared/env.ts` con dos esquemas Zod
  separados (`serverSchema`, `clientSchema`) según `19-DEPLOYMENT.md` sección
  5, enumerando cada variable del inventario de la sección 4 de ese doc.
  `clientEnv` nunca recibe `process.env` completo.
  - Verificación: al quitar temporalmente una variable requerida del entorno
    de prueba, `pnpm --filter web build` (o un script de arranque) falla con
    un mensaje que nombra la variable faltante; al restaurarla, pasa.
  - Reversión: eliminar `packages/shared/env.ts` y su uso.
- [ ] **5.2** Crear `.github/workflows/ci.yml` con jobs de `lint`,
  `typecheck` y `build` sobre pnpm + Turborepo, disparado en push y PR.
  - Verificación: el workflow es YAML válido (`yamllint` o parseo local); si
    hay Actions disponibles en el entorno, se dispara y los tres jobs pasan
    en verde.
  - Reversión: eliminar el archivo del workflow.

### Fase 6 — ADR fundacionales

- [ ] **6.1** Escribir `docs/adr/ADR-0001-monorepo-single-app.md` (monorepo
  Turborepo con una sola app Next.js) según la tabla de `01-ARCHITECTURE.md`
  sección 9.
  - Verificación: el archivo existe, sigue un formato estándar de ADR
    (contexto, decisión, consecuencias) y no supera 500 líneas.
  - Reversión: eliminar el archivo.
- [ ] **6.2** Escribir `docs/adr/ADR-0002-core-sin-react.md` (lógica de
  negocio aislada en `packages/core` para habilitar el APK futuro).
  - Verificación: igual que 6.1.
  - Reversión: eliminar el archivo.
- [ ] **6.3** Escribir `docs/adr/ADR-0003-siigo-fuente-precios.md` (Siigo como
  fuente de precios, la web como fuente de catálogo).
  - Verificación: igual que 6.1.
  - Reversión: eliminar el archivo.
- [ ] **6.4** Escribir `docs/adr/ADR-0004-umbral-cotizacion.md` (umbral
  configurable de $5.000.000 COP para cotización).
  - Verificación: igual que 6.1.
  - Reversión: eliminar el archivo.
- [ ] **6.5** Cerrar la tarea: mover este archivo a
  `docs/tasks/done/DONE-fase-0-fundacion.md`, actualizar
  `docs/tasks/README.md`, `docs/progress/CHANGELOG.md`,
  `docs/progress/TODO.md` (marcar lo completado, dejar lo operativo que sigue
  pendiente) y `docs/21-ROADMAP.md` (estado de Fase 0).
  - Verificación: `docs/tasks/README.md` no lista un `ACTIVE-*` activo;
    ningún `.md` tocado supera 500 líneas.
  - Reversión: revertir el commit de cierre.

---

## Bitácora

_(vacía — no se ha ejecutado ningún paso todavía)_

---

## Bloqueos

- **Logo ausente.** No se recibieron `logo-full-dark.png`, `logo-full-light.png`
  ni `logo-mark.png`. No bloquea el inicio del plan (fases 1–3 no lo
  necesitan), pero bloqueará el paso **4.2** si no llega antes.

## Pendientes descubiertos

- Proyectos Supabase (`staging`/`prod`), conexión de Vercel y Cloudflare,
  y carga de los tres entornos de variables: son tareas operativas del
  usuario fuera del alcance de esta sesión de código. Ya están en
  `docs/progress/TODO.md` bajo "Bloqueantes" y "Fase 0 — en curso".
- Credenciales de Siigo, contrato de Wompi, dominio de producción e
  inventario real de productos: ya registrados como `PENDIENTE-DECISIÓN` /
  bloqueantes en `docs/progress/TODO.md`. No se resuelven aquí.
