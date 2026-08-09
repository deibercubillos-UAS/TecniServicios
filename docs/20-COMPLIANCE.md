# 20 — Cumplimiento legal (Colombia)

Volver a [`00-INDEX.md`](./00-INDEX.md)

Paso 1.1 de `ACTIVE-fase-6-endurecimiento-A.md`. Aplica a la plataforma de
Tecni Equipos y Servicios SAS, operando en Colombia.

⚠️ **Este documento no sustituye revisión de un abogado.** Describe con buena
fe qué exige la Ley 1581 de 2012 y cómo la plataforma responde, pero el texto
publicado a usuarios finales (política de tratamiento, términos) debe
revisarlo un profesional antes de producción — ver paso 5.2 del plan de
Fase 6.

---

## 1. Qué dato se recolecta y por qué

| Dato | Dónde vive | Base legal / propósito |
|---|---|---|
| Nombre, teléfono, correo | `profiles` | Ejecución del contrato comercial (cuenta, pedidos) |
| NIT, razón social, dirección de la empresa | `companies` | Facturación, relación B2B |
| Historial de pedidos, cotizaciones, pagos | `orders`, `quotes`, `payments` | Ejecución del contrato, obligación fiscal (DIAN) |
| Equipos adquiridos, mantenimientos, tickets | `owned_equipment`, `maintenance_*`, `support_tickets` | Postventa, garantía |
| IP y versión de política al registrarse | `profiles.consent_ip`/`consent_policy_version` | Prueba del consentimiento (Ley 1581 art. 9) |

**No se recolecta** dato sensible (salud, ideología, biometría) en ningún
flujo actual del producto.

## 2. Consentimiento — ya implementado desde la Fase 1

El registro (`registerUser`, `packages/core/src/companies/register-user.ts`)
graba `consent_accepted_at`, `consent_ip`, `consent_policy_version` en
`profiles` en el mismo insert que crea el perfil — no hay cuenta sin
consentimiento registrado. La casilla del formulario de `/registro` es
explícita, no premarcada.

**Lo que falta** (paso 5.1 del plan): un mecanismo para que el titular
ejerza sus derechos *después* de haberse registrado — hoy el consentimiento
se graba pero no hay flujo de consulta/actualización/supresión expuesto al
usuario.

## 3. Derechos del titular (art. 8, Ley 1581)

El titular puede: conocer, actualizar y rectificar sus datos; solicitar
prueba del consentimiento otorgado; presentar quejas ante la SIC; revocar el
consentimiento y/o solicitar la supresión del dato cuando no exista un deber
legal o contractual que lo impida; acceder gratuitamente a su dato.

**Cómo responde la plataforma:**
- **Conocer/actualizar:** `/mi-cuenta` (Fase 3) ya permite ver los datos
  propios; edición de perfil es una función existente de `profiles_update_self`.
- **Prueba del consentimiento:** los tres campos de `profiles` (sección 2)
  son la prueba — recuperables por soporte ante una solicitud.
- **Supresión:** **no implementada todavía** (paso 5.1). No es un simple
  `delete` — colisiona con la obligación de conservar datos de facturación
  (sección 4). El mecanismo real es anonimizar el perfil, no borrar la fila.
- **Quejas ante la SIC:** canal de contacto (sección 5).

## 4. Retención — la obligación fiscal manda sobre la supresión

Los datos de facturación (pedidos, pagos, cotizaciones aceptadas) **no se
eliminan** aunque el titular solicite supresión — la DIAN exige conservar
soportes contables. La respuesta correcta a una solicitud de supresión sobre
una cuenta con historial de compras es:

1. Anonimizar `profiles` (nombre → "Usuario eliminado", teléfono/correo →
   null, mantener el `id` como referencia interna).
2. **Conservar** `orders`/`payments`/`quotes` tal cual, ya no vinculables a
   una persona identificable en la práctica (el vínculo sigue existiendo por
   `id`, pero sin dato personal legible).
3. Registrar la anonimización en `audit_log` (regla de oro 8 de `CLAUDE.md`
   — toca "rol"/identidad del usuario).

Sin fecha de retención fija documentada todavía para los demás datos
(equipos, tickets) — pendiente de definir junto con el flujo de supresión
real (paso 5.1).

## 5. Contacto y canal de reclamos

**Pendiente de dato real:** correo/formulario dedicado a solicitudes de
Ley 1581, distinto del contacto comercial general. Hoy `contact_messages`
(Fase 2) es el único canal de contacto — sirve como canal transitorio hasta
que exista uno dedicado. Anotado en `progress/TODO.md`.

## 6. Textos públicos pendientes (paso 5.2)

- Política de tratamiento de datos personales
- Términos y condiciones de uso
- Política de garantía
- Política de envíos y devoluciones

Ninguno existe todavía como página pública. Se redactan en el paso 5.2,
marcados como borrador hasta revisión legal.

## 7. DIAN — facturación electrónica

Fuera del alcance de esta plataforma directamente: la facturación
electrónica la emite Siigo (el ERP), no la web. La web muestra la factura
que Siigo generó (ya construido en la Fase 3, `docs/13-MODULE-COMMERCE.md`).
Ningún requisito de DIAN recae sobre código propio de este repositorio más
allá de conservar el vínculo al documento de Siigo.

---

## Estado

| Ítem | Estado |
|---|---|
| Consentimiento al registrar | ✅ Implementado (Fase 1) |
| Consulta/actualización de datos propios | ✅ Implementado (`/mi-cuenta`, Fase 3) |
| Flujo de supresión/anonimización | ⬜ Pendiente (paso 5.1) |
| Canal de reclamos dedicado Ley 1581 | ⬜ Pendiente |
| Textos públicos (política, términos, garantía, envíos) | ⬜ Pendiente (paso 5.2) |
| Revisión legal profesional | ⬜ Pendiente — bloqueante antes de publicar a producción |
