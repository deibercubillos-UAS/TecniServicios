# 05B — RLS y seguridad (parte B: almacenamiento, auth, cabeceras, datos personales, checklist, pruebas)

Parte A: [`05-RLS-SECURITY-A.md`](./05-RLS-SECURITY-A.md) · Volver a [`00-INDEX.md`](./00-INDEX.md)

---

## 5. Almacenamiento (Cloudflare R2)

- **Ningún bucket es público.** Todo acceso es por URL firmada generada en el
  servidor tras validar permisos.
- Vida de la firma: 15 minutos para documentos, 60 para imágenes de catálogo.
- Las claves siguen el patrón `{entidad}/{id}/{uuid}-{nombre}`. **Nunca se usa el
  nombre original del archivo como clave** (evita colisiones y filtrado de datos).
- Validación en subida: tipo MIME real (no la extensión), tamaño máximo,
  y renombrado obligatorio.

---

## 6. Autenticación

- Supabase Auth con verificación de correo obligatoria. Sin verificar, el usuario
  no ve precios ni puede comprar.
- Contraseña mínima 10 caracteres, validada contra lista de contraseñas comunes.
- Sesión: 7 días con refresh rotatorio. Los roles `seller`, `technician` y
  `master` usan **2FA obligatorio** (TOTP).
- Rate limit en `login`, `registro` y `recuperar` vía Cloudflare: 5 intentos por
  IP cada 15 minutos.
- El registro **no revela** si un correo existe. El mensaje es idéntico en ambos
  casos.

---

## 7. Cabeceras y protección de la app

```
Content-Security-Policy: default-src 'self'; img-src 'self' data: https:; ...
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

En Cloudflare: WAF activo, Bot Fight Mode, rate limiting en `/api/v1/*`
(60 req/min por IP), y reglas específicas más estrictas en autenticación.

---

## 8. Datos personales (Ley 1581 de 2012)

Detalle completo en `20-COMPLIANCE.md`. Mínimos que afectan al esquema:

- Casilla explícita de autorización de tratamiento en el registro, con fecha,
  IP y versión de la política almacenadas.
- Mecanismo para que el titular consulte, actualice y solicite supresión.
- Los datos de facturación no se eliminan (obligación fiscal); se anonimiza el
  perfil y se conserva el registro contable.

---

## 9. Checklist obligatorio antes de cada PR

- [ ] ¿Toda tabla nueva tiene `enable row level security`?
- [ ] ¿Probé la consulta como anónimo, como cliente de otra empresa y como rol inferior?
- [ ] ¿Algún endpoint nuevo devuelve precios sin validar sesión?
- [ ] ¿Validé la entrada con Zod?
- [ ] ¿Hay algún `service_role` fuera del servidor?
- [ ] ¿La operación quedó en `audit_log` si toca precio, rol, pedido o cotización?
- [ ] ¿Algún error de base de datos llega crudo al cliente?
- [ ] ¿Los archivos nuevos de R2 se sirven firmados?

**Un PR que no responde estas ocho preguntas no se aprueba.**

---

## 10. Pruebas de RLS

Cada tabla con datos sensibles tiene una prueba de integración que:

1. Crea dos empresas con un usuario cada una.
2. Inserta datos en ambas.
3. Verifica que el usuario A **no puede leer** ni una fila de B.
4. Verifica que un anónimo no lee nada.

Detalle en `18-TESTING.md`. Estas pruebas corren en CI y bloquean el merge.
