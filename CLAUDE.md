# CLAUDE.md — Tecni Equipos y Servicios SAS

Documento maestro. **Léelo completo antes de cualquier tarea.**
Es un índice y un contrato de reglas, no un manual: el detalle vive en `/docs`.

---

## 1. Qué estamos construyendo

Plataforma web B2B para **Tecni Equipos y Servicios SAS**, empresa colombiana de
maquinaria, herramientas, repuestos y consumibles para el sector automotriz
(alineación, balanceo, elevación, diagnóstico, lubricación, insumos).

No es un e-commerce genérico. Es un **portal comercial + postventa**:
catálogo con precios reservados a usuarios registrados, cotizaciones sincronizadas
con Siigo, seguimiento de pedidos, y un módulo de servicio técnico
(mantenimientos, tickets, manuales por equipo adquirido).

**Slogan:** "Soluciones que construyen confianza".

---

## 2. Reglas de oro (no negociables)

1. **Ningún archivo `.md` supera 500 líneas.** Si un documento crece, se parte en
   `NN-NOMBRE-A.md` / `NN-NOMBRE-B.md` y se actualiza `docs/00-INDEX.md` en el
   **mismo commit**. Sin excepción.
2. **Toda tabla en Supabase tiene RLS habilitada.** Una tabla sin política es un
   bug de seguridad, no una tarea pendiente. Ver `docs/05-RLS-SECURITY-A.md`.
3. **Todo secreto vive en Vercel → Environment Variables.** Nunca en el
   repositorio, nunca en un `.env` versionado, nunca pegado en el chat, nunca
   escrito a mano en un archivo local. El entorno local se sincroniza con
   `vercel env pull`. Ver `docs/19-DEPLOYMENT.md`.
4. **`SUPABASE_SERVICE_ROLE_KEY` jamás sale del servidor.** Nunca en un componente
   cliente, nunca en una variable `NEXT_PUBLIC_*`.
5. **Los precios no se sirven a usuarios anónimos.** Ni en HTML, ni en JSON, ni en
   metadatos, ni en el payload de un Server Component. Ver `docs/05-RLS-SECURITY-A.md`.
6. **Toda la lógica de negocio vive en `packages/core`**, expuesta por
   `/api/v1/*`. El frontend nunca consulta la base de datos directamente para
   operaciones de escritura. Esto es lo que permite el APK futuro sin reescribir.
7. **Ninguna respuesta de API rompe contrato sin versionar.** `/api/v1` es
   inmutable una vez publicado; los cambios incompatibles crean `/api/v2`.
8. **Todo cambio de precio, rol, pedido o cotización se registra en `audit_log`.**
9. **Documentar antes de codear.** Feature sin su `.md` actualizado = feature no
   terminada. El doc se escribe primero, el código después.
10. **TypeScript estricto.** Nada de `any`, nada de `@ts-ignore` sin un comentario
    que explique por qué y un TODO con fecha.
11. **Al terminar toda tarea, haz `git add`, `git commit` y `git push` a `main`**,
    salvo que el usuario pida explícitamente otra rama o pida no publicar.
    Ver sección 10 de este documento.
12. **Toda tarea se divide en fases y pasos pequeños y verificables**, y su avance
    se registra en un archivo vivo en `docs/tasks/`, actualizado **al terminar
    cada paso**. Cuanto más riesgoso el cambio, más fina la división. No hay
    límite de subdivisión. Ver `docs/23-TASK-EXECUTION.md`.

---

---

## 3. Stack

| Capa | Tecnología | Notas |
|---|---|---|
| Monorepo | Turborepo + pnpm | Ver `docs/01-ARCHITECTURE.md` |
| Frontend | Next.js 15 (App Router), React 19, TypeScript | Una sola app web |
| Estilos | Tailwind CSS v4 + shadcn/ui | Tokens en `docs/02-DESIGN-SYSTEM.md` |
| Base de datos | Supabase (PostgreSQL + Auth + Realtime) | RLS obligatoria |
| Archivos | Cloudflare R2 | Manuales, fichas técnicas, adjuntos |
| Correo | Resend | Transaccional. Dominio verificado |
| Pagos | Wompi | Ver `docs/09-INTEGRATION-PAYMENTS.md` |
| ERP | Siigo Nube Pro (API) | Precios y cotizaciones |
| Hosting | Vercel | `preview` por PR, `production` en `main` |
| DNS / WAF | Cloudflare | Proxy, rate limiting, bot protection |
| Repo | GitHub | Ramas protegidas |

---

## 4. Índice de documentación

Todo el detalle está en `/docs`. **Antes de tocar código, lee el doc del módulo.**

| Doc | Cuándo leerlo |
|---|---|
| `docs/00-INDEX.md` | Siempre. Mapa completo y estado de cada módulo |
| `docs/01-ARCHITECTURE.md` | Antes de crear cualquier carpeta o paquete |
| `docs/02-DESIGN-SYSTEM.md` | Antes de escribir una sola clase de Tailwind |
| `docs/03-UI-COMPONENTS.md` | Antes de crear un componente nuevo |
| `docs/04-DATABASE-SCHEMA-A.md` / `-B.md` | Antes de cualquier migración |
| `docs/05-RLS-SECURITY-A.md` + `-B.md` | Antes de crear una tabla o exponer un dato |
| `docs/06-AUTH-ROLES.md` | Antes de tocar permisos o rutas protegidas |
| `docs/07-API-CONTRACTS.md` | Antes de crear un endpoint |
| `docs/08-INTEGRATION-SIIGO.md` | Precios, cotizaciones, sincronización |
| `docs/09-INTEGRATION-PAYMENTS.md` | Wompi, webhooks, conciliación |
| `docs/10-INTEGRATION-RESEND.md` | Plantillas y disparadores de correo |
| `docs/11-STORAGE-R2.md` | Subida y firma de archivos |
| `docs/12-MODULE-CATALOG.md` | Catálogo, filtros, ficha, comparador |
| `docs/13-MODULE-COMMERCE.md` | Carrito, cotizaciones, pedidos, envíos |
| `docs/14-MODULE-SERVICE.md` | Mantenimientos, tickets, técnicos |
| `docs/15-MODULE-CONTENT.md` | Blog, banners, promociones |
| `docs/16-ADMIN-MASTER.md` | Panel maestro |
| `docs/17-STITCH-MIGRATION.md` | Pipeline Google Stitch → componentes |
| `docs/18-TESTING.md` | Qué se prueba y cómo |
| `docs/19-DEPLOYMENT.md` | **Secretos, variables de entorno**, entornos, despliegue |
| `docs/20-COMPLIANCE.md` | Ley 1581, habeas data, DIAN, políticas |
| `docs/21-ROADMAP.md` | Fases y definición de "listo" |
| `docs/22-MOBILE-READINESS.md` | Reglas para no romper el APK futuro |
| `docs/23-TASK-EXECUTION.md` | **Cómo dividir y ejecutar toda tarea.** Leer siempre |
| `docs/tasks/` | Tareas en curso y completadas. Memoria del proyecto |
| `docs/adr/` | Decisiones arquitectónicas, una por archivo |
| `docs/progress/` | `DECISIONS.md`, `CHANGELOG.md`, `TODO.md` |

---

## 5. Reglas de negocio que definen el producto

Estas cinco reglas explican por qué la plataforma no es una tienda normal.
Si una implementación las contradice, la implementación está mal.

### 5.1 Los precios son privados
Un visitante anónimo ve el catálogo, las fotos y las especificaciones.
**No ve precios.** Ve un CTA: "Inicia sesión para ver precios".
El precio se resuelve en el servidor, después de validar la sesión.

### 5.2 Umbral de $5.000.000 COP
- Producto **< $5.000.000 COP** → compra directa: carrito → Wompi → pedido.
- Producto **≥ $5.000.000 COP** → no hay botón de compra. Hay
  **"Solicitar cotización"**, que crea una solicitud asignada a un vendedor.
- El umbral es un **parámetro de configuración** (`settings.quote_threshold_cop`),
  editable desde el panel maestro. Nunca hardcodeado.
- Un carrito mixto se divide: los ítems por debajo del umbral se pagan, los que
  están por encima pasan a solicitud de cotización. El usuario ve esto explícito
  antes de pagar.

### 5.3 Siigo manda en precios, la web manda en catálogo
- El **master crea y edita los productos** en la web (nombre, fotos, specs,
  categoría, manuales). La web es dueña del contenido.
- **Siigo es la fuente de verdad del precio.** Se sincroniza por código de
  producto. Si Siigo no responde, se usa el último precio cacheado y se marca
  como "precio sujeto a confirmación".
- **Las cotizaciones se crean en Siigo** y la web las muestra. La web no genera
  consecutivos. El vendedor cotiza en Siigo; el cliente la ve en su dashboard.

### 5.4 Una empresa, varios usuarios
El cliente real es una **empresa** (`companies`, identificada por NIT).
Los usuarios pertenecen a una empresa con un rol interno. Cotizaciones, pedidos,
equipos y facturas son de la **empresa**, no de la persona.
Un usuario ve los datos de su empresa, nunca de otra. Esto es la base del RLS.

### 5.5 El equipo vendido genera postventa
Cuando un pedido se entrega, cada equipo serializado crea un registro en
`owned_equipment`. Eso habilita: manual descargable, agendamiento de
mantenimiento, tickets de soporte e historial de servicio.
El módulo de servicio es lo que diferencia esta plataforma de un catálogo.

---

## 6. Roles

| Rol | Alcance |
|---|---|
| `anonymous` | Catálogo sin precios, blog, contacto |
| `customer` | Su empresa: dashboard, equipos, cotizaciones, pedidos, facturas, manuales, mantenimientos, tickets |
| `seller` | Sus clientes asignados: cotizaciones, pedidos, agenda de visitas, seguimiento |
| `technician` | Agendamientos, confirmación de visitas, tickets, reportes de mantenimiento |
| `master` | Todo: contenido, productos, banners, promociones, usuarios, permisos, configuración |

Matriz de permisos completa en `docs/06-AUTH-ROLES.md`.
Un usuario tiene **un rol de plataforma**. Los permisos internos de empresa
(comprador, contabilidad, jefe de taller) son un campo aparte y solo aplican
dentro de `customer`.

---

## 7. Convenciones de código

**Nombres**
- Archivos y carpetas: `kebab-case`
- Componentes React: `PascalCase`
- Funciones y variables: `camelCase`
- Tablas y columnas SQL: `snake_case`, tablas en plural
- Constantes: `SCREAMING_SNAKE_CASE`
- Migraciones: `YYYYMMDDHHMMSS_descripcion_corta.sql`

**Git**
- Rama de trabajo por defecto: `main` (ver sección 10)
- Ramas alternas, cuando el usuario las pida: `feat/`, `fix/`, `docs/`, `refactor/`, `chore/`
- Commits: Conventional Commits (`feat(catalog): agrega filtro por marca`)
- Un commit = una unidad funcional coherente. No mezcles módulos sin relación.

**React / Next.js**
- Server Components por defecto. `"use client"` solo cuando hay estado,
  eventos o APIs del navegador.
- Nunca `<form>` HTML nativo con submit tradicional: Server Actions o handlers.
- Datos sensibles jamás en props de componentes cliente.

**Base de datos**
- Toda migración es reversible o documenta explícitamente por qué no lo es.
- Nada de `SELECT *` en código de producción.
- Índices en toda columna usada en `WHERE`, `JOIN` u `ORDER BY` frecuente.
- Dinero: `numeric(14,2)`, nunca `float`. Moneda COP.

**Errores**
- Nunca se filtra un error de base de datos al cliente. Se registra en el
  servidor y se devuelve un mensaje genérico con un código de referencia.

---

## 8. Flujo de trabajo para cada tarea

**Antes de empezar cualquier sesión:**

1. Lee este archivo.
2. Lee `docs/tasks/README.md`. Si existe un `ACTIVE-*.md`, léelo completo y
   retoma desde el primer paso sin marcar.

**Para una tarea nueva:**

1. Lee `docs/00-INDEX.md` y el doc del módulo afectado.
2. **Clasifica el riesgo** según `docs/23-TASK-EXECUTION.md` sección 1
   (trivial / normal / grande / riesgoso).
3. Si no es trivial, **crea `docs/tasks/ACTIVE-{slug}.md`** con el plan completo
   dividido en fases y pasos, cada uno con su verificación y su reversión.
4. **Presenta el plan y espera visto bueno** antes de ejecutar el primer paso.
5. Si la tarea implica una decisión arquitectónica, escribe primero un ADR en
   `docs/adr/`.
6. Ejecuta **un paso a la vez**. Al terminar cada uno:
   - Verifica que funcionó, con la verificación que escribiste
   - Actualiza la bitácora del archivo de tarea
   - Publica (`commit` + `push`)
   - Reporta el resultado y espera confirmación
7. Orden dentro de cada funcionalidad: esquema y RLS → contrato de API → UI.
8. Verifica seguridad: ¿qué ve un anónimo? ¿qué ve otra empresa? ¿qué ve un rol
   inferior? Si no puedes responder las tres, no está terminado.
9. Al completar todos los pasos: mueve el archivo a `docs/tasks/done/`, actualiza
   `docs/progress/CHANGELOG.md` y verifica que ningún `.md` pasó de 500 líneas.

**Si un paso falla, no avances.** Anótalo en la bitácora, diagnostica, y corrige
o replantea el plan.

---

## 9. Estado actual

**Fase 0 — Fundación.** El repositorio aún no tiene código de aplicación.
Consulta `docs/21-ROADMAP.md` para saber qué sigue y
`docs/progress/TODO.md` para las tareas abiertas.

**Decisiones pendientes** (marcadas como `PENDIENTE-DECISIÓN` en los docs):
credenciales de Siigo, contrato Wompi, dominio definitivo, inventario real de
productos y categorías.

---

## 10. Política de publicación en Git

**Al terminar cualquier tarea, publica el trabajo sin que haya que pedírtelo.**

```bash
git add .
git commit -m "tipo(alcance): descripción en imperativo"
git push origin main
```

### Cuándo se aplica
- Al completar cualquier tarea o paso de una sesión.
- Al terminar una fase del roadmap.
- Siempre que hayas modificado archivos y la tarea esté cerrada.

### Cuándo NO publicar
- Si el usuario pidió explícitamente otra rama → usa esa rama.
- Si el usuario dijo "no publiques" o "no hagas commit".
- **Si el código no compila o el typecheck falla.** Nunca se publica algo roto.
  Repórtalo y espera instrucciones.
- Si `git status` muestra un `.env` o cualquier secreto sin ignorar. **Detente,
  avisa y no publiques.** Esto no admite excepciones ni siquiera si el usuario
  insiste en la misma sesión.
- Si hay conflictos de merge sin resolver.

### Verificación obligatoria antes de cada push

```bash
git status --porcelain | grep -iE "\.env$|\.env\.[^e]|key|secret|credential" \
  && echo "DETENER: posible secreto en el commit"
pnpm typecheck && pnpm lint
```

Si cualquiera de las dos falla, no hay push.

### Formato del mensaje

Conventional Commits, en español, en imperativo:

```
feat(catalog): agrega filtro por marca y categoría
fix(auth): corrige redirección tras verificar correo
docs(rls): documenta política de ticket_messages
chore(setup): configura Turborepo y paquetes base
```

El cuerpo del commit es opcional; si el cambio necesita explicación, va ahí,
no en el título.

### Después de publicar

Confirma al usuario, en una línea, qué se publicó y con qué mensaje. Sin volcar
la salida completa de git.

### Nota sobre esta política

Publicar directo a `main` es apropiado mientras el desarrollo es de una sola
persona y el proyecto no está en producción con clientes reales.

**Cuando el proyecto entre en Fase 6 o se sume otra persona al repositorio, esta
política debe revisarse** y volver a un flujo de rama + PR con `main` protegida.
Registrar ese cambio en `docs/progress/DECISIONS.md`.

---
