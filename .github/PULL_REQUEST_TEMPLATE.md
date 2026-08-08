> El flujo por defecto es publicación directa a `main` (ver `CLAUDE.md` sección 10).
> Esta plantilla aplica cuando se trabaja en rama por petición explícita, y como
> checklist de autorrevisión antes de cualquier push.

## Qué hace este PR

<!-- Una frase. Si necesitas más de tres, probablemente son varios PRs. -->

## Documentación

- [ ] Actualicé el `.md` del módulo afectado
- [ ] Ningún `.md` supera 500 líneas
- [ ] Actualicé `docs/progress/CHANGELOG.md`
- [ ] Si hubo decisión arquitectónica, escribí el ADR

## Checklist de seguridad (obligatorio)

Referencia: `docs/05-RLS-SECURITY.md` sección 9.

- [ ] ¿Toda tabla nueva tiene `enable row level security`?
- [ ] ¿Probé la consulta como anónimo, como cliente de otra empresa y como rol inferior?
- [ ] ¿Algún endpoint nuevo devuelve precios sin validar sesión?
- [ ] ¿Validé toda entrada externa con Zod?
- [ ] ¿Hay algún `service_role` fuera del servidor?
- [ ] ¿La operación quedó en `audit_log` si toca precio, rol, pedido o cotización?
- [ ] ¿Algún error de base de datos llega crudo al cliente?
- [ ] ¿Los archivos nuevos de R2 se sirven con URL firmada?

## Diseño (si toca UI)

- [ ] Cero valores hexadecimales: solo tokens
- [ ] Contraste verificado con herramienta, no a ojo
- [ ] Estados definidos: default, loading, empty, error
- [ ] Navegable con teclado, foco visible
- [ ] Probado en 375px, 768px y 1440px

## Cómo se probó

<!-- Pasos concretos -->
