# 00 — Índice de documentación

Mapa completo de `/docs` con el estado de cada módulo.
**Este archivo se actualiza en el mismo commit que cualquier documento nuevo.**

Estados: `✅ Listo` · `🚧 En progreso` · `📝 Borrador` · `⬜ Pendiente`

---

## Fundación

| # | Archivo | Estado | Contenido |
|---|---|---|---|
| 01 | `01-ARCHITECTURE.md` | ✅ | Turborepo, apps, packages, límites frontend/backend |
| 02 | `02-DESIGN-SYSTEM.md` | ✅ | Paleta, tipografía, tokens, espaciado, componentes base |
| 03 | `03-UI-COMPONENTS.md` | ✅ | Inventario de componentes y su contrato de props |
| 04 | `04-DATABASE-SCHEMA-A.md` + `-B.md` | ✅ | Tablas, relaciones, enums, índices |
| 05 | `05-RLS-SECURITY-A.md` + `-B.md` | ✅ | Políticas RLS por tabla y rol. **Crítico** |
| 06 | `06-AUTH-ROLES.md` | ✅ | Roles, matriz de permisos, rutas protegidas |
| 07 | `07-API-CONTRACTS.md` | ✅ | Contratos REST `/api/v1`, base del APK |

## Integraciones

| # | Archivo | Estado | Contenido |
|---|---|---|---|
| 08 | `08-INTEGRATION-SIIGO.md` | ✅ | Precios, cotizaciones, sincronización, fallback |
| 09 | `09-INTEGRATION-PAYMENTS.md` | ✅ | Wompi, webhooks, conciliación, reembolsos |
| 10 | `10-INTEGRATION-RESEND.md` | ⬜ | Plantillas, disparadores, dominio verificado |
| 11 | `11-STORAGE-R2.md` | ⬜ | Manuales, fichas, adjuntos, URLs firmadas |

## Módulos funcionales

| # | Archivo | Estado | Contenido |
|---|---|---|---|
| 12 | `12-MODULE-CATALOG.md` | ✅ | Catálogo, filtros, ficha, comparador (máx. 3) |
| 13 | `13-MODULE-COMMERCE.md` | ✅ | Carrito, cotizaciones, pedidos, envíos, facturas |
| 14 | `14-MODULE-SERVICE.md` | ⬜ | Mantenimientos, tickets, técnicos, historial |
| 15 | `15-MODULE-CONTENT.md` | ⬜ | Blog, banners, promociones, SEO |
| 16 | `16-ADMIN-MASTER.md` | ⬜ | Panel maestro, configuración global |

## Operación

| # | Archivo | Estado | Contenido |
|---|---|---|---|
| 17 | `17-STITCH-MIGRATION.md` | ✅ | Pipeline Google Stitch → componentes tokenizados |
| 18 | `18-TESTING.md` | ✅ | Unit, integración, E2E, pruebas de RLS |
| 19 | `19-DEPLOYMENT.md` | ✅ | Entornos, **gestión de secretos en Vercel**, despliegue |
| 20 | `20-COMPLIANCE.md` | ⬜ | Ley 1581, habeas data, DIAN, términos |
| 21 | `21-ROADMAP.md` | ✅ | Fases y definición de "listo" |
| 22 | `22-MOBILE-READINESS.md` | ⬜ | Reglas para el APK futuro |
| 23 | `23-TASK-EXECUTION.md` | ✅ | **Cómo dividir y ejecutar toda tarea.** Leer siempre |

## Registros vivos

| Archivo | Contenido |
|---|---|
| `adr/ADR-NNNN-*.md` | Una decisión arquitectónica por archivo |
| `progress/DECISIONS.md` | Decisiones de producto y negocio con fecha |
| `progress/CHANGELOG.md` | Qué se construyó, cuándo |
| `progress/TODO.md` | Tareas abiertas priorizadas |
| `tasks/ACTIVE-*.md` | Tarea en curso: plan, bitácora y estado. Solo una a la vez |
| `tasks/done/` | Tareas completadas |
| `tasks/PLANTILLA.md` | Plantilla para abrir una tarea nueva |

---

## Regla de partición

Cuando un documento se acerca a **450 líneas**:

1. Se divide temáticamente en `NN-NOMBRE-A.md` y `NN-NOMBRE-B.md`.
2. Cada parte abre con un enlace a la otra y al índice.
3. Esta tabla se actualiza en el mismo commit.
4. No se parte a mitad de una sección: la división respeta encabezados de nivel 2.

## Cómo navegar

- ¿Vas a crear una tabla? → `04` y luego **obligatoriamente** `05`.
- ¿Vas a crear una pantalla? → `02`, `03` y el `MODULE-*` correspondiente.
- ¿Vas a crear un endpoint? → `07` y el `MODULE-*` correspondiente.
- ¿Vas a tocar precios? → `08` + `05` + regla 5.1 de `CLAUDE.md`.
- ¿Necesitas una clave o variable de entorno? → `19`. **Nunca pidas el valor por chat.**
- ¿Vas a empezar cualquier tarea? → `23` **siempre**, y revisa si hay un
  `tasks/ACTIVE-*.md` abierto.
- ¿No sabes por dónde empezar? → `21-ROADMAP.md`.
