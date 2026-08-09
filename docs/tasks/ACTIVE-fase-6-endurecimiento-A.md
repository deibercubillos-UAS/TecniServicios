# TAREA: Fase 6 — Endurecimiento (parte A: plan)

Parte B (bitácora, bloqueos, pendientes): [`ACTIVE-fase-6-endurecimiento-B.md`](./ACTIVE-fase-6-endurecimiento-B.md)

**Estado:** En curso · **Riesgo:** Riesgoso (seguridad, cumplimiento legal, respaldo/restauración)
**Inicio:** 2026-08-09

---

## 0. Objetivo

Que la plataforma soporte tráfico real y cumpla la ley antes de tener clientes
reales encima: auditoría de seguridad completa, rendimiento, accesibilidad,
Ley 1581 con flujo real (no solo la casilla del registro que ya existe desde
la Fase 1), textos legales publicados, respaldo probado con una restauración
real (no solo confiar en que existe), y documentación de operación para que
alguien de Tecni sin acceso a este chat pueda operar el sitio día a día.

**Qué NO entra en esta fase:** contratar proveedores reales de monitoreo/error
tracking (Sentry, etc.) — se deja la integración lista pero sin cuenta paga
real, que es decisión del usuario; el propio dominio de producción (bloqueante
ya anotado en `progress/TODO.md`); nada de Siigo/Wompi real todavía.

**Aviso de alcance:** varios pasos de esta fase producen **texto legal real**
(política de tratamiento de datos, términos, garantía, envíos, devoluciones)
para una empresa colombiana real. Se redactan con buena fe y citando la
normativa aplicable, pero **no reemplazan revisión de un abogado** antes de
publicar a producción — se anota explícito en cada documento generado.

---

## Fase 1 — Documentación

- [x] **1.1** `docs/20-COMPLIANCE.md`: Ley 1581 (habeas data), qué datos se
  recolectan, base legal, derechos ARCO, mecanismo de solicitud, retención
  fiscal (facturas no se borran), DIAN. Referencia a la casilla de consentimiento
  ya existente desde la Fase 1 (`profiles.consent_accepted_at/consent_ip/
  consent_policy_version`).
- [x] **1.2** Sección "Accesibilidad" nueva en `02-DESIGN-SYSTEM.md` (o archivo
  aparte si crece): criterios WCAG 2.1 AA aplicables (contraste, foco visible,
  navegación por teclado, `alt` en imágenes, etiquetas de formulario) — checklist
  reusable para todas las fases futuras, no solo esta.
- [x] **1.3** `docs/24-OPERATIONS.md` (nuevo): guía de operación para el equipo
  de Tecni — qué monitorear, cómo responder una alerta, cómo restaurar un
  respaldo, contactos de los proveedores (Supabase, Vercel, Cloudflare).

## Fase 2 — Auditoría de seguridad completa

- [x] **2.1** Recorrer el checklist de `05-RLS-SECURITY-B.md` sección 9 sobre
  **todo el proyecto**, no solo la última fase — primera vez que se audita de
  punta a punta desde la Fase 0. `get_advisors` (seguridad) completo, cada
  hallazgo aceptado o corregido con su motivo explícito.
- [x] **2.2** `get_advisors` (rendimiento) — índices faltantes en columnas de
  `WHERE`/`JOIN`/`ORDER BY` frecuentes, confirmar contra la regla de
  `CLAUDE.md` sección 7.
- [x] **2.3** Revisar cabeceras de seguridad (`05-RLS-SECURITY-B.md` sección 7:
  CSP, HSTS, X-Frame-Options, etc.) — confirmar cuáles ya aplica Vercel/Next.js
  por defecto y cuáles faltan configurar explícitamente.

## Fase 3 — Rendimiento

- [x] **3.1** Auditoría de Core Web Vitals en las pantallas principales (home,
  catálogo, ficha de producto) — Lighthouse o equivalente, con datos reales.
- [x] **3.2** Corregir los hallazgos de 3.1 que sean seguros y acotados
  (imágenes, fuentes, JS innecesario). Lo que requiera rediseño se anota como
  pendiente, no se improvisa acá.

## Fase 4 — Accesibilidad

- [x] **4.1** Auditoría manual contra el checklist de 1.2 en home, catálogo,
  ficha de producto, carrito, checkout, `/mi-cuenta`.
- [x] **4.2** Corregir hallazgos.

## Fase 5 — Ley 1581 y textos legales

- [x] **5.1** Flujo de consulta/actualización/supresión de datos personales
  para el titular — hoy solo existe la casilla de consentimiento al registrar
  (Fase 1), falta el mecanismo real para ejercer el derecho después.
- [x] **5.2** Páginas públicas: política de tratamiento de datos, términos y
  condiciones, garantía, envíos y devoluciones — contenido real, marcado
  explícito como borrador sujeto a revisión legal antes de producción.

## Fase 6 — Monitoreo, alertas y respaldos

- [ ] **6.1** Dejar preparada la integración de monitoreo de errores
  (variables de entorno, punto de inicialización) sin activar cuenta real —
  decisión del usuario cuál proveedor.
- [ ] **6.2** Verificar la configuración de respaldos automáticos de Supabase
  del proyecto real.
- [ ] **6.3** **Probar una restauración real** — sobre una rama/branch de
  Supabase, nunca sobre el proyecto de producción directo. Confirmar que el
  respaldo restaurado tiene los datos esperados.

## Fase 7 — Cierre

- [ ] **7.1** Checklist de seguridad final + las tres preguntas de `CLAUDE.md`.
- [ ] **7.2** Actualizar `21-ROADMAP.md`/`progress/TODO.md`/
  `progress/CHANGELOG.md`, mover la tarea a `tasks/done/`.

---

## Fuera de alcance de esta fase (anotado, no se construye acá)

- Cuentas reales de monitoreo pagas — se deja la integración lista, no activa.
- Revisión legal profesional de los textos — se marca como borrador.
- Fase 7 del roadmap (APK) — no empieza hasta que esta fase cierre.
