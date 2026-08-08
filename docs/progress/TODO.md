# TODO

Tareas abiertas, ordenadas por prioridad. Se actualiza en cada sesión de trabajo.

---

## Bloqueantes (impiden avanzar)

- [ ] Obtener credenciales de la API de Siigo Nube Pro
- [ ] Confirmar que el plan expone endpoints de cotizaciones
- [ ] Definir el dominio de producción
- [ ] Contratar y configurar Wompi (sandbox primero)
- [ ] Obtener el inventario real de productos y categorías

## Fase 0 — en curso

- [x] Inicializar Turborepo + pnpm
- [ ] Configurar `apps/web` con Next.js 15 y TypeScript estricto
- [ ] Configurar Tailwind v4 con los tokens de `02-DESIGN-SYSTEM.md`
- [ ] Cargar Montserrat con `next/font`
- [ ] Colocar el logo en `public/brand/` (todas las variantes)
- [ ] Crear proyectos Supabase `staging` y `prod`
- [ ] Configurar GitHub: repositorio privado, plantilla de PR disponible (sin protección de rama por ahora, ver DECISIONS)
- [ ] CI: lint, typecheck, build
- [ ] Conectar Vercel y Cloudflare
- [ ] Crear los tres entornos en Vercel y cargar ahí todos los secretos
- [ ] Ejecutar `vercel link` + `vercel env pull .env.local` en la máquina de desarrollo
- [ ] Implementar `packages/shared/env.ts` con validación Zod al arranque
- [ ] Escribir `ADR-0001` a `ADR-0004`

## Documentación pendiente

- [ ] `03-UI-COMPONENTS.md` — al migrar la primera pantalla de Stitch
- [ ] `07-API-CONTRACTS.md` — antes del primer endpoint
- [ ] `09-INTEGRATION-PAYMENTS.md` — antes de la fase 3
- [ ] `10-INTEGRATION-RESEND.md` — antes de la fase 1
- [ ] `11-STORAGE-R2.md` — antes de la fase 4
- [ ] `12` a `16` — al iniciar cada módulo
- [ ] `18-TESTING.md` — antes de la fase 1
- [ ] `20-COMPLIANCE.md` — antes de recolectar datos reales
- [ ] `22-MOBILE-READINESS.md` — antes de la fase 3

## Preguntas abiertas

- [ ] ¿Se sincroniza inventario desde Siigo o se ignora en v1?
- [ ] ¿La factura electrónica DIAN se dispara desde la web o es proceso manual?
- [ ] ¿Un vendedor puede comprar en nombre de un cliente, o solo cotizar?
- [ ] ¿El técnico necesita ver precios para cotizar repuestos en sitio?
