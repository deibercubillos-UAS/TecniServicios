# TODO

Tareas abiertas, ordenadas por prioridad. Se actualiza en cada sesión de trabajo.

---

## Bloqueantes (impiden avanzar)

- [ ] **Urgente:** cambiar el repositorio `TecniServicios` a privado en
      GitHub (Settings → General → Danger Zone → Change visibility).
      Actualmente es público.
- [x] `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
      cargados como GitHub Repository Secrets (2026-08-08). `rls-tests`
      verificado en verde en CI.
      **Recordatorio para más adelante:** borrarlos de GitHub si en el
      futuro se abandona este flujo (ver `progress/DECISIONS.md`,
      2026-08-08).
- [ ] Obtener credenciales de la API de Siigo Nube Pro
- [ ] Confirmar que el plan expone endpoints de cotizaciones
- [ ] Definir el dominio de producción
- [ ] Contratar y configurar Wompi (sandbox primero)
- [ ] Obtener el inventario real de productos y categorías

## Fase 0 — código completo (ver `tasks/done/DONE-fase-0-fundacion.md`), pendientes operativos abajo

- [x] Inicializar Turborepo + pnpm
- [x] Configurar `apps/web` con Next.js 15 y TypeScript estricto
- [x] Configurar Tailwind v4 con los tokens de `02-DESIGN-SYSTEM.md`
- [x] Cargar Montserrat con `next/font`
- [x] Colocar el logo en `public/brand/` (todas las variantes)
- [x] Crear proyecto Supabase (`tecni`, `sa-east-1`) — **un solo proyecto**,
      desviación de la regla de `staging`/`prod` separados, ver DECISIONS
- [ ] Configurar GitHub: repositorio privado (**urgente**, ver Bloqueantes),
      plantilla de PR ya disponible (sin protección de rama por ahora, ver DECISIONS)
- [x] CI: lint, typecheck, build (verificado en verde en GitHub Actions)
- [x] Conectar Vercel (deploy en verde, confirmado)
- [ ] Conectar Cloudflare — bloqueado: no hay dominio de producción todavía
      (usuario decidió no comprar uno por ahora). Ver "Definir el dominio de
      producción" arriba.
- [x] NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY y
      SUPABASE_SERVICE_ROLE_KEY cargadas en Vercel por el usuario
- [ ] Ejecutar `vercel link` + `vercel env pull .env.local` en la máquina de desarrollo
- [x] Implementar `packages/shared/env.ts` con validación Zod (conectado a
      `apps/web` en la Fase 1, paso 5.2 — Siigo/Wompi/Resend/R2 quedan
      opcionales hasta que cada integración exista, ver DECISIONS)
- [x] Escribir `ADR-0001` a `ADR-0004`

## Fase 1 — código completo (ver `tasks/done/DONE-fase-1-identidad-datos-*.md`)

- [x] RLS real y probada en `profiles`, `companies`, `company_members`,
      `settings`, `audit_log` (con usuarios reales, en CI)
- [x] `/registro`, `/login`, `/verificar`, `/recuperar`
- [x] Trigger `handle_new_user`, Auth Hook `custom_access_token_hook`
      (claim `user_role`)
- [x] `middleware.ts` con `ROUTE_RULES` por rol
- [ ] Resend con dominio verificado — bloqueado, sin dominio de producción
      todavía (mismo bloqueante que Cloudflare). Verificación/recuperación
      usan el correo integrado de Supabase Auth mientras tanto.

## Documentación pendiente

- [ ] `03-UI-COMPONENTS.md` — al migrar la primera pantalla de Stitch
- [ ] `07-API-CONTRACTS.md` — antes del primer endpoint
- [ ] `09-INTEGRATION-PAYMENTS.md` — antes de la fase 3
- [ ] `10-INTEGRATION-RESEND.md` — cuando exista dominio de producción
- [ ] `11-STORAGE-R2.md` — antes de la fase 4
- [ ] `12` a `16` — al iniciar cada módulo
- [x] `18-TESTING.md`
- [ ] `20-COMPLIANCE.md` — antes de recolectar datos reales (ya hay una
      desviación registrada en DECISIONS sobre columnas de consentimiento
      en `profiles`, a formalizar acá)
- [ ] `22-MOBILE-READINESS.md` — antes de la fase 3

## Preguntas abiertas

- [ ] ¿Se sincroniza inventario desde Siigo o se ignora en v1?
- [ ] ¿La factura electrónica DIAN se dispara desde la web o es proceso manual?
- [ ] ¿Un vendedor puede comprar en nombre de un cliente, o solo cotizar?
- [ ] ¿El técnico necesita ver precios para cotizar repuestos en sitio?
