# Tarea: Enlazar Siigo API (precios/cotizaciones/terceros) + Siigo Pay (pagos)

Riesgo: **Riesgoso** — toca credenciales reales, dinero y datos fiscales.
División fina, un paso a la vez, verificación antes de avanzar.

## Contexto

El usuario recibió del soporte de Siigo:
- Acceso web sandbox (`siigonube.siigo.com`, usuario `sandbox@siigoapi.com`).
- Endpoint de autenticación: `POST https://api.siigo.com/auth` (usuario API +
  `AccessKey`).
- Colección de Postman de referencia (no descargada acá).
- URL para generar credenciales de **producción**:
  `https://siigonube.portaldeclientes.siigo.com/generar-credenciales-api/`.

**Decisión del usuario (confirmada):** Siigo Pay **reemplaza** a Wompi como
pasarela de pago. `docs/09-INTEGRATION-PAYMENTS.md` se reescribe para Siigo
Pay; Wompi queda desmontado (mock incluido) salvo que se pida lo contrario.

**Ningún secreto real ha sido compartido en este chat** — el usuario solo
pegó el instructivo genérico, con `AccessKey`/contraseña censurados. Sigue
así: yo nunca recibo valores de secretos por chat (regla de oro 3,
`docs/19-DEPLOYMENT.md` sección 1). El usuario los carga directo en Vercel.

## Bloqueante inmediato — variables de entorno

El usuario debe cargar esto en Vercel (`Development` y `Preview` con
credenciales **sandbox**; `Production` se deja vacío hasta tener credenciales
reales, ver sección 8 de `docs/08-INTEGRATION-SIIGO.md`):

```bash
vercel env add SIIGO_USERNAME development    # sandbox@siigoapi.com (o el real de producción, entorno aparte)
vercel env add SIIGO_ACCESS_KEY development  # el AccessKey de la pantalla de Siigo
vercel env add SIIGO_BASE_URL development    # https://api.siigo.com
vercel env add SIIGO_PARTNER_ID development  # el que exige el header Partner-Id de Siigo (ver Postman)
```

Y para Siigo Pay (nombres a confirmar en el paso 0 según la documentación
real de Siigo Pay — todavía no la tengo):

```bash
SIIGO_PAY_PUBLIC_KEY
SIIGO_PAY_PRIVATE_KEY
SIIGO_PAY_WEBHOOK_SECRET
```

Después de cargarlas: `vercel env pull apps/web/.env.local` para que yo
pueda usarlas en local sin verlas (Read las enmascara automáticamente).

## Punto abierto que necesito resolver antes de la Fase de pagos

La info que pegaste cubre el **API general de Siigo** (auth, productos,
cotizaciones, terceros). **Siigo Pay es un producto separado** con su propia
documentación de checkout/webhook — no vino en lo que compartiste. Sin eso no
puedo implementar el checkout ni la verificación de firma del webhook
correctamente (y equivocarla es el tipo de bug que cuesta plata real). Voy a
buscar la documentación pública de Siigo Pay como punto de partida en la
Fase 2, pero si tienes el link/PDF que te dieron específico de Siigo Pay,
compártelo — acelera y reduce el riesgo de adivinar el formato de firma.

## Fases

### Fase 0 — Preparación (sin riesgo, sin secretos)
0.1. Confirmar con el usuario los nombres exactos de variables de Siigo Pay
     (pide el instructivo específico o yo busco la doc pública).
0.2. Usuario carga las variables sandbox en Vercel → `vercel env pull`.
0.3. Verificar que `apps/web/.env.local` recargado tiene los valores nuevos
     (sin imprimir el contenido — solo confirmar que las claves ya no dicen
     `[SENSITIVE]` con 11 caracteres).

### Fase 1 — Cliente real de Siigo API (precios + stock)
1.1. `packages/integrations/src/siigo/client.ts`: `SiigoRealClient implements
     SiigoClient` — `POST /auth` con `username`+`access_key`, cachea el
     token en memoria (expira en ~24h según Siigo, se refresca 5 min antes).
1.2. `getProductPrice(sku)` → `GET /v1/products?code={sku}`, mapea a
     `SiigoPrice`; `null` si Siigo no reconoce el SKU (nunca lanza para ese
     caso, ver contrato en `types.ts`).
1.3. Timeout 10s, 3 reintentos con backoff exponencial (regla de
     `docs/08-INTEGRATION-SIIGO.md` sección 2).
1.4. `packages/shared/src/env.ts`: sin cambios de esquema (ya están como
     `.optional()`); se agrega un factory
     `getSiigoClient()` en `packages/integrations` que devuelve
     `SiigoRealClient` si `SIIGO_ACCESS_KEY` existe, si no `SiigoMockClient`
     — el resto del código (`resolvePrice` en core) no cambia.
1.5. Verificación: contra sandbox real, un SKU de prueba trae precio; un SKU
     inventado da `null`, no error. `pnpm typecheck && pnpm lint`.

### Fase 2 — Sincronización programada de precios
2.1. `apps/web/app/api/cron/siigo-price-sync/route.ts` — cron cada 6h
     (Vercel Cron, protegido con `CRON_SECRET`), implementa el diagrama de
     `docs/08-INTEGRATION-SIIGO.md` sección 2 (SKU nuevo → borrador,
     `price_is_stale` según antigüedad).
2.2. `audit_log` por corrida con el conteo de cambios.
2.3. Verificación: correr el cron a mano contra sandbox, confirmar
     `products.price_synced_at` y `price_is_stale` se actualizan.

### Fase 3 — Cotizaciones y terceros
3.1. `findCustomerByDocument`, `listQuotes`, `getQuote`, `getQuotePdf` según
     contrato de `docs/08` sección 6.
3.2. Server Actions + UI para que un `seller` sincronice una cotización desde
     Siigo (el vendedor la crea EN Siigo, la web solo la trae).
3.3. Verificación: cotización de prueba creada en el sandbox de Siigo
     aparece en el dashboard del cliente/vendedor con PDF servido desde R2.

### Fase 4 — Siigo Pay (checkout + webhook) — bloqueada por el punto abierto arriba
4.1. Investigar/confirmar formato real de firma de integridad y de webhook
     de Siigo Pay (equivalente a lo que hoy tiene `WompiMockClient`).
4.2. `packages/integrations/src/siigo-pay/` — mismo patrón que `wompi/`
     (client + checksum + mock client para seguir probando sin red).
4.3. Reescribir `docs/09-INTEGRATION-PAYMENTS.md` para Siigo Pay.
4.4. `apps/web/app/api/v1/webhooks/siigo-pay/route.ts` — reemplaza al de
     Wompi; verifica firma, nunca confía en el redirect del cliente.
4.5. Actualizar el checkout (`13-MODULE-COMMERCE.md`) para usar Siigo Pay.
4.6. Retirar `wompi/` (o dejarlo marcado como no usado, a decidir con el
     usuario en ese momento — no se borra código sin confirmar).
4.7. Verificación: transacción de prueba en sandbox de Siigo Pay, webhook
     firmado correctamente marca `orders.status = 'paid'`; evento con firma
     inválida se descarta sin tocar la base (mismo criterio que hoy con
     Wompi).

### Fase 5 — Producción
5.1. Usuario genera credenciales reales en el portal de Siigo y las carga en
     Vercel → `Production` (nunca las mismas que sandbox).
5.2. Verificar en `Preview` primero, luego `Production`.
5.3. Actualizar `docs/19-DEPLOYMENT.md` sección 4 (inventario de variables)
     y `docs/progress/DECISIONS.md` con el cambio Wompi → Siigo Pay.

## Verificación transversal (cada fase)
- `pnpm typecheck && pnpm lint` en verde antes de cada push.
- `git status --porcelain | grep -iE "\.env$|\.env\.[^e]|key|secret|credential"`
  antes de cada push — si algo aparece, no se publica.
- Ningún valor de secreto se escribe en código, commit, ni se pega en este
  chat.
- `mcp__Supabase__get_advisors` tras cualquier migración.

## Nota — credenciales de Siigo API son de producción real

El usuario cargó **credenciales reales de Tecnisas** (no sandbox) en Vercel,
solo en el entorno `Production`, marcadas como `Secret` (el CLI no puede
leerlas de vuelta ni siquiera con `vercel env pull` — solo se inyectan en
tiempo de ejecución en el servidor). Implicaciones:
- Cualquier prueba contra Siigo desde acá golpea el Siigo **real** de la
  empresa. Las llamadas de solo lectura (precio/stock) son seguras; las de
  escritura (cotizaciones, terceros) de la Fase 3 en adelante necesitan más
  cuidado — no se prueban "a ver qué pasa", se confirma con el usuario antes.
- No hay forma de correr el cliente real localmente para depurar — la
  verificación real solo pasa desplegado (`Preview`/`Production`).
- Pendiente: agregar las mismas variables también a `Development`/`Preview`
  si en algún momento se quiere un sandbox real de Siigo aparte (Siigo sí
  ofrece un ambiente separado — ver el instructivo original). No bloqueante
  por ahora.

## Estado
- [x] Fase 0 — variables `SIIGO_USERNAME`/`SIIGO_ACCESS_KEY`/`SIIGO_BASE_URL`/
      `SIIGO_PARTNER_ID` cargadas en Vercel `Production` (reales, no sandbox).
- [x] Fase 1 — `SiigoRealClient` (`packages/integrations/src/siigo/client.ts`):
      auth con token cacheado (refresco 5 min antes de expirar), timeout 10s,
      3 reintentos con backoff exponencial, `getProductPrice`/`getProductStock`
      por SKU. `getSiigoClient(config)` elige real vs. mock. 5 tests unitarios
      con `fetch` mockeado (sin red, sin credenciales reales). `typecheck` y
      `lint` en verde.
- [x] Fase 2 — cron `/api/cron/siigo-price-sync` (cada 6h,
      `apps/web/vercel.json`): refresca `price_cop`/`tax_rate`/`stock_status`
      de productos activos por SKU, marca `price_is_stale` por antigüedad
      (> 6h), audita cambios de precio y SKUs que Siigo no reconoce.
      **Alcance limitado:** solo refresca SKUs que ya existen en la web —
      el descubrimiento automático de SKU nuevos (sección 2.1 del doc)
      necesita `listProducts` paginado, que se implementa en la Fase 3 junto
      con cotizaciones/terceros.
- [x] Desplegado a producción (`7e3e55e`, deploy manual vía CLI porque el
      push a `main` no disparó el deploy automático de Vercel — pendiente
      investigar por qué la integración Git no reaccionó sola). Cron ajustado
      a **diario** (9:00 UTC / 4:00 a.m. Colombia) porque el plan Hobby de
      Vercel no permite crons más frecuentes que uno al día. `turbo.json`
      actualizado con las variables de Siigo/Resend/Cron que faltaban en el
      allowlist (si no, el build las descarta).
      `GET /api/cron/siigo-price-sync` en `www.tecnisas.co` confirmado: 401
      sin header (existe y exige `CRON_SECRET`, correcto).
- [x] **Corrección de expectativas:** TECNI-309 nunca existió como producto
      en la web — el usuario lo comparó contra Siigo Nube directamente. El
      cron original solo refrescaba SKUs ya existentes en `products`, no
      creaba nada nuevo. Confirmado con el usuario (`AskUserQuestion`) que
      sí quería el descubrimiento automático ahora, no esperar a la Fase 3.
- [x] `SiigoClient.listProducts(page)` agregado al contrato — paginado real
      en `SiigoRealClient` (`/v1/products?page=N&page_size=100`, respeta
      `pagination.total_results`/`page_size` de la respuesta real);
      `SiigoMockClient.listProducts` siempre devuelve página vacía (no
      simula un catálogo completo). 3 tests nuevos, `typecheck`/`lint` en
      verde.
- [x] Cron extendido: tras refrescar precios, recorre `listProducts` (tope
      de seguridad `MAX_LIST_PAGES = 50`, ~5.000 productos) y crea un
      producto borrador (`is_active=false`) por cada SKU de Siigo que no
      exista en `products` — mismo criterio que `bulk-import-products.ts`
      (sin fotos, el master lo completa y activa a mano). Categoría "Sin
      clasificar" (`sin-clasificar`) se crea sola la primera vez que hace
      falta, resolviendo el `PENDIENTE-DECISIÓN` de
      `08-INTEGRATION-SIIGO.md` sección 2.1. Cada creación queda en
      `audit_log` (`product.siigo_sku_discovered`).
- [x] **Verificado en producción real.** Causa raíz de los 401 iniciales:
      `CRON_SECRET` no coincidía en runtime (probable variable vieja de 17
      días mal enlazada tras reorganizar el proyecto) — el usuario la rotó
      (borrar + crear de nuevo en Development/Preview/Production, valor
      generado con `openssl rand -hex 32`, nunca visto por mí) y redeploy.
      Tras eso: `/api/cron/siigo-price-sync` corrió con `vercel-cron/1.0`,
      autenticó, y TECNI-309 apareció en `/admin/productos` como borrador
      en "Sin clasificar" — confirmado por el usuario. **Fase 1 y 2
      cerradas y verificadas de punta a punta.**
- [ ] Fase 3 — cotizaciones y terceros (`listProducts`, `findCustomerByDocument`,
      `listQuotes`, `getQuote`, `getQuotePdf`).
- [ ] Fase 4 — Siigo Pay (bloqueada por documentación específica de Siigo Pay,
      ver sección "Punto abierto" arriba).
- [ ] Fase 5 — producción (ya hay credenciales de producción cargadas; falta
      confirmar que Preview/Development tengan su propio set si se decide
      tener sandbox separado).
