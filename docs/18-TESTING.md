# 18 — Qué se prueba y cómo

Volver a [`00-INDEX.md`](./00-INDEX.md) · RLS en [`05-RLS-SECURITY.md`](./05-RLS-SECURITY.md)

---

## 1. Niveles de prueba

| Nivel | Qué cubre | Dónde vive | Corre en |
|---|---|---|---|
| Unit | Funciones puras de `packages/core` (resolución de precio, umbral de cotización, transiciones de estado) | `packages/core/**/*.test.ts` junto al código | Cada push, local |
| Integración de RLS | Aislamiento entre empresas y roles en Postgres real | `packages/db/tests/rls/**` | CI, bloquea el merge |
| E2E | Flujos completos de usuario en el navegador | Se agrega a partir de la Fase 2 (catálogo) | CI en PR, no bloqueante al inicio |

**Regla:** una función de `packages/core` que decide algo sensible (precio,
umbral, permiso) no se considera terminada sin su prueba unit. No hace falta
levantar Next.js ni un navegador para probar `packages/core` — por diseño no
depende de ninguno de los dos (ver `ADR-0002`).

---

## 2. Pruebas de aislamiento RLS

Cada tabla con datos sensibles (identificada en `05-RLS-SECURITY.md` sección
4) tiene una prueba de integración que corre contra Postgres real, no un
mock. El patrón es siempre el mismo:

1. Con `service_role` (bypassa RLS), crear dos empresas y un usuario por
   empresa.
2. Con `service_role`, insertar una fila de la tabla bajo prueba en cada
   empresa.
3. Autenticarse como el usuario de la empresa A (JWT real, no simulado) y
   confirmar que la consulta **no devuelve ni una fila** de la empresa B.
4. Confirmar que una consulta sin sesión (`anon`) no devuelve nada, salvo
   que la tabla sea explícitamente pública (`posts`, `banners`,
   `categories`, `brands`).
5. **Limpiar los datos de prueba al final**, con `service_role`. El
   proyecto Supabase de este repositorio es único (ver
   `progress/DECISIONS.md`, 2026-08-08) — no hay un `staging` separado
   que absorba el descuido. Una prueba que no limpia deja basura en la
   base que algún día tendrá clientes reales.

**Nunca se prueba RLS leyendo el código de las políticas.** Se prueba
ejecutando la consulta con la sesión real que un atacante o un error
tendría. Una política que se ve correcta en SQL y nunca se ejecutó puede
estar rota igual.

### Cómo se estructura el script

- Cliente `service_role` para el `arrange` (preparar datos) y el
  `cleanup` (borrar al final), siempre en un bloque que se ejecuta pase o
  falle la prueba.
- Un cliente por usuario de prueba, autenticado con su propio JWT real
  (`signInWithPassword` contra el proyecto), para el `act`/`assert`.
- Nunca se usa `service_role` para el `assert`. Probar con `service_role`
  no prueba nada — esa clave ignora RLS por definición.

---

## 3. Qué corre en CI y qué bloquea el merge

| Job | Bloquea merge | Cuándo se agrega |
|---|---|---|
| `lint` | Sí | Fase 0 |
| `typecheck` | Sí | Fase 0 |
| `build` | Sí | Fase 0 |
| E2E | No, al inicio | Fase 2 en adelante |

**`rls-tests` no corre en GitHub Actions** (decisión 2026-08-08, por costo
— ver `progress/DECISIONS.md`). Es un paso **manual**, obligatorio antes
de cualquier push que modifique una política RLS o el esquema de una
tabla con RLS: `pnpm --filter @tecni/db test`, corrido localmente contra
el proyecto Supabase real (`vercel env pull .env.local` trae las tres
variables — `SUPABASE_URL`, `SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_ROLE_KEY` —, nunca se commitea el archivo resultante,
ya está en `.gitignore`). Quien publica el cambio de RLS confirma en la
bitácora de la tarea que corrió el script en verde antes de hacer
`push`.

---

## 4. Qué NO se prueba (todavía)

- Carga/estrés — se evalúa en la Fase 6 (Endurecimiento).
- Accesibilidad automatizada — se agrega cuando exista la primera pantalla
  migrada de Stitch (Fase 2), junto al checklist manual de
  `17-STITCH-MIGRATION.md` sección 5.
- Integraciones externas reales (Siigo, Wompi) en CI — se usan mocks
  (`SiigoMockClient`, sandbox de Wompi) hasta que haya credenciales de
  producción.

---

## 5. Convención de nombres

- Unit: `{archivo}.test.ts` junto al código que prueba.
- Integración de RLS: `packages/db/tests/rls/{tabla}.test.ts`, una prueba
  por tabla con datos sensibles.
- Un `describe` por tabla o función; un `it` por escenario (no por
  aserción suelta).
