# Decisiones de producto y negocio

Registro cronológico. Cada entrada: qué se decidió, por qué, y qué se descartó.

---

## 2026-08-08 — Un solo proyecto Supabase (desviación de la regla de entornos separados)
**Decidido:** un único proyecto Supabase (`tecni`, región `sa-east-1`), usado
por `Production`, `Preview` y `Development` a la vez.
**Contradice:** `docs/19-DEPLOYMENT.md` sección 3 y `docs/01-ARCHITECTURE.md`
sección 7, que exigen proyectos `staging`/`prod` separados — "nunca se
comparte base de datos entre preview y producción".
**Por qué:** decisión explícita del usuario ("crea solo un proyecto, que sea
definitivo"), confirmada tras advertir el riesgo.
**Riesgo asumido:** cualquier prueba local, cualquier PR de preview, o
cualquier migración fallida puede tocar directamente datos reales de
clientes de Tecni desde el día uno de la Fase 1. No hay red de seguridad de
aislamiento por entorno.
**Mitigación disponible:** extremar cuidado en migraciones (probar el SQL
antes en un cliente local de Postgres, no directo contra `tecni`); crear un
proyecto `staging` separado más adelante si el riesgo se materializa o el
plan gratuito deja de ser limitante.
**Revisar:** si el volumen de datos reales crece, o tras el primer incidente
de datos de prueba mezclados con reales.

## 2026-08-07 — Monorepo con una sola aplicación web
**Decidido:** Turborepo con `apps/web` única, en lugar de separar `apps/admin`.
**Por qué:** simplicidad operativa en la fase inicial.
**Costo asumido:** la seguridad depende del middleware y de RLS, no del
aislamiento físico. Se compensa con pruebas de RLS obligatorias en CI.
**Descartado:** app de administración separada. Se puede extraer más adelante sin
reescribir, porque la lógica vive en `packages/core`.

## 2026-08-07 — Siigo es fuente de precios, la web es fuente de catálogo
**Decidido:** el master crea los productos en la web; Siigo solo aporta precios,
vinculados por SKU. Las cotizaciones se crean en Siigo y la web las muestra.
**Por qué:** la web necesita contenido rico (fotos, specs, manuales) que el ERP no
maneja bien; la contabilidad necesita que el precio y el consecutivo sean del ERP.
**Consecuencia:** un producto sin SKU válido en Siigo no muestra precio.

## 2026-08-07 — Umbral de $5.000.000 COP para cotización asistida
**Decidido:** por debajo, compra directa con Wompi. Por encima, solicitud de
cotización con acompañamiento del vendedor.
**Por qué:** los equipos de alto valor requieren asesoría, negociación y
condiciones de pago que una pasarela no resuelve.
**Implementación:** parámetro en `settings.quote_threshold_cop`, editable desde el
panel maestro. Nunca hardcodeado.

## 2026-08-07 — Registro con verificación de correo, sin aprobación manual
**Decidido:** basta verificar el correo para ver precios.
**Por qué:** reducir fricción comercial.
**Riesgo asumido:** la competencia puede ver los precios registrándose.
**Mitigación disponible:** exigir aprobación de un vendedor para NITs nuevos.
Revisar si se detecta abuso.

## 2026-08-07 — Atributos definidos por categoría, no globales
**Decidido:** modelo híbrido — columnas comunes en `products` + tabla
`attribute_definitions` por categoría.
**Por qué:** las especificaciones no son comparables entre categorías. Una
balanceadora se compara por diámetro de rin; un escáner por protocolos soportados.
Un esquema global habría producido tablas comparativas llenas de "N/A".
**Consecuencia:** el comparador exige que los 3 productos sean de la misma categoría.

## 2026-08-07 — Guía de envío cargada manualmente
**Decidido:** el vendedor registra transportadora y número de guía a mano.
**Por qué:** integrar transportadoras en v1 añade complejidad sin valor
proporcional al volumen esperado.
**Revisar:** cuando el volumen de pedidos justifique la automatización.

## 2026-08-07 — Wompi como pasarela
**Decidido:** Wompi para la fase 3.
**Estado:** en evaluación, no contratada.
**Alternativas descartadas por ahora:** Mercado Pago, ePayco, PayU.

## 2026-08-07 — Publicación directa a `main`
**Decidido:** al terminar cada tarea, Claude Code hace `commit` y `push` a `main`
automáticamente, sin flujo de rama + PR.
**Por qué:** el desarrollo es de una sola persona y el proyecto no está en
producción. El flujo de PR añadiría fricción sin revisor que lo aproveche.
**Costo asumido:** no hay red de seguridad ante un push con código roto. Se
compensa con dos puertas obligatorias antes de cada push: `typecheck` + `lint`
en verde, y verificación de que no hay secretos en el commit.
**Revisar en:** Fase 6, o en cuanto se sume otra persona al repositorio. En ese
momento se vuelve a rama + PR con `main` protegida y se registra aquí.
**Descartado por ahora:** protección de rama en GitHub.

## 2026-08-07 — Vercel como única bóveda de secretos
**Decidido:** todo secreto (claves de Siigo, Wompi, R2, Resend, service_role de
Supabase) vive exclusivamente en Vercel → Environment Variables. El entorno local
se sincroniza con `vercel env pull`, nunca escribiendo valores a mano.
**Por qué:** un solo lugar con el valor en texto plano reduce la superficie de
filtración. Evita que las claves circulen por chat, correo o archivos locales, que
es como se filtran en la práctica.
**Consecuencia:** Claude Code nunca pide ni escribe valores de secretos. Si falta
una variable, indica cuál y el usuario la carga en Vercel.
**Regla asociada:** un secreto que llegó a un commit se considera comprometido y
se rota, aunque se reescriba el historial.

## 2026-08-07 — Ejecución por fases con archivo de seguimiento
**Decidido:** toda tarea no trivial se divide en fases y pasos pequeños,
verificables y reversibles, con seguimiento en `docs/tasks/ACTIVE-{slug}.md`
actualizado al terminar cada paso.
**Por qué:** dos razones. Reduce el riesgo de cada cambio, especialmente en
migraciones, RLS y pagos. Y conserva el contexto: una sesión nueva retoma leyendo
un solo archivo, sin depender del historial de conversación.
**Matiz:** la granularidad es proporcional al riesgo. Las tareas triviales no
generan archivo; fragmentar de más también cuesta tiempo.
**Regla asociada:** el archivo se actualiza al terminar cada paso, nunca al final.
Un archivo escrito solo al cierre no sirve para recuperar contexto.

## 2026-08-08 — `rls-tests` no corre en GitHub Actions
**Decidido:** el script de pruebas de aislamiento RLS (`packages/db/tests/rls/`)
no se integra como job de CI. Se corre manualmente, local, contra el proyecto
Supabase real, antes de cualquier push que toque una política RLS o el esquema
de una tabla con RLS.
**Por qué:** decisión explícita del usuario, para evitar el costo de minutos de
GitHub Actions. Contradice `docs/18-TESTING.md` versión original (paso 4.2 del
plan de Fase 1 la daba por CI, bloqueante) — se corrigió esa sección en el mismo
commit que esta decisión.
**Consecuencia:** no hay bloqueo automático ante un push que rompa RLS. La
verificación depende de la disciplina de quien publica: correr
`pnpm --filter @tecni/db test` en verde antes de `git push`, y dejar constancia
en la bitácora de la tarea correspondiente.
**Riesgo asumido:** un push que rompe el aislamiento entre empresas puede llegar
a `main` sin que nada lo detenga automáticamente, dado que el proyecto Supabase
es único (sin `staging`) y `main` despliega directo a producción.
**Revisar en:** cuando el proyecto tenga presupuesto para Actions, o al sumar
otra persona al repositorio (junto con la revisión de rama+PR ya prevista).

## 2026-08-08 — Reversión: `rls-tests` sí corre en GitHub Actions
**Decidido:** se revierte la decisión anterior (mismo día). `rls-tests` vuelve
a ser un job de CI en `.github/workflows/ci.yml`, bloqueante, con
`SUPABASE_URL`/`SUPABASE_ANON_KEY`/`SUPABASE_SERVICE_ROLE_KEY` como GitHub
Secrets.
**Por qué:** el usuario prefiere que la verificación corra automatizada
(Claude Code no puede ejecutar el script localmente sin la `service_role`
key, que no puede compartirse por chat) en vez de depender de que alguien la
corra a mano cada vez.
**Consecuencia:** vuelve el bloqueo automático de merge ante RLS roto.
`docs/progress/TODO.md` lista los tres secrets como bloqueante hasta que el
usuario los cargue en GitHub.
**Pendiente para más adelante:** el usuario pidió recordar borrar estos
secrets de GitHub si en el futuro se abandona este flujo (por ejemplo, al
mover a un runner propio o replantear costos otra vez). Ver
`progress/TODO.md`.

## 2026-08-08 — `env.ts`: Siigo/Wompi/Resend/R2 quedan opcionales
**Decidido:** en `packages/shared/src/env.ts`, las variables de Siigo, Wompi,
Resend y R2 (y `NEXT_PUBLIC_SITE_URL`) pasan de requeridas a `.optional()` en
`serverSchema`/`clientSchema`. Solo las tres de Supabase quedan obligatorias.
**Por qué:** al ir a conectar `env.ts` a `apps/web` (paso 5.2 de la Fase 1) se
detectó que el esquema original exigía las 20 variables del inventario de
`19-DEPLOYMENT.md`, incluidas las de integraciones que todavía no existen en
el código (Siigo, Wompi, Resend, R2 siguen "PENDIENTE-DECISIÓN" en
`progress/TODO.md`). Conectarlo tal cual habría roto el build de producción
sin ningún beneficio — exactamente lo que la decisión de Fase 0 (ver entrada
de `packages/shared/env.ts` en `tasks/done/DONE-fase-0-fundacion-A.md`) había
anticipado y por lo que no se conectó entonces.
**Consecuencia:** cada bloque de variables vuelve a ser requerido en la
migración que conecta esa integración de verdad (Siigo → Fase 3, Wompi →
Fase 3, Resend → cuando exista dominio, R2 → Fase 4). Hasta entonces, código
que dependa de una de esas variables debe manejar `undefined` explícitamente
— no asumir que `env.ts` ya la garantiza.
**Verificado:** `pnpm --filter web build` pasa con solo las tres de Supabase;
falla con un mensaje claro (`SUPABASE_SERVICE_ROLE_KEY: Invalid input`) si
falta una de las tres — confirma que la validación sigue funcionando donde
importa.

## 2026-08-08 — `profiles` gana columnas de consentimiento de datos
**Decidido:** se agregan `consent_accepted_at`, `consent_ip`,
`consent_policy_version` a `profiles`, no documentadas originalmente en
`04-DATABASE-SCHEMA-A.md`.
**Por qué:** al construir `/registro` (paso 8.1) se detectó que
`05-RLS-SECURITY.md` sección 8 exige guardar fecha, IP y versión de la
política junto a la casilla de autorización de tratamiento de datos, pero
ningún doc de esquema definía dónde vive ese dato — `20-COMPLIANCE.md` sigue
sin escribirse. Se corrigió en el mismo paso (no se avanza con un paso
incompleto): columnas en `profiles` (el titular es la persona, no la
empresa), `04-DATABASE-SCHEMA-A.md` actualizado en el mismo commit.
**Pendiente:** `20-COMPLIANCE.md` debe escribirse antes de recolectar datos
reales de producción (ya listado en `progress/TODO.md`) y ahí formalizar
esta decisión con el detalle completo de Ley 1581.
