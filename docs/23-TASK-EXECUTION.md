# 23 — Ejecución de tareas por fases

Volver a [`00-INDEX.md`](./00-INDEX.md) · Reglas en [`../CLAUDE.md`](../CLAUDE.md)

**Ninguna tarea se ejecuta de una sola vez.** Toda tarea se descompone en fases y
pasos, y el avance se registra en un archivo vivo dentro de `docs/tasks/`.

El propósito es doble: reducir el riesgo de cada cambio, y **no perder el contexto
nunca** — ni entre sesiones, ni cuando la ventana de contexto se llena, ni si el
trabajo se interrumpe días.

---

## 1. Triaje: cuánto dividir

La granularidad es proporcional al riesgo. Fragmentar de más también tiene costo.

| Nivel | Cuándo | Granularidad | ¿Archivo de tarea? |
|---|---|---|---|
| **Trivial** | Un archivo, sin migraciones, reversible en segundos: cambiar un texto, ajustar un espaciado, corregir un typo | Sin fases | No. Se hace y se publica |
| **Normal** | Una funcionalidad acotada: un componente, un endpoint sencillo, una pantalla | 3–6 pasos, una sola fase | Sí |
| **Grande** | Un módulo completo, varias pantallas, cambios en varias capas | 3–5 fases de 4–8 pasos | Sí, obligatorio |
| **Riesgoso** | Migraciones, RLS, autenticación, pagos, precios, refactor amplio, integración externa | Fases de 2–4 pasos, con verificación entre cada uno | Sí, obligatorio, con plan de reversión por paso |

**Ante la duda, dividir más.** Un paso de más cuesta minutos; un paso de menos en
una migración de producción cuesta datos.

### Siempre es "riesgoso", sin importar el tamaño
- Cualquier cosa que toque RLS o políticas de seguridad
- Migraciones que alteren o borren columnas con datos
- Autenticación, roles y permisos
- Precios, cotizaciones, pedidos, pagos
- Webhooks y verificación de firmas
- Cambios que afecten `/api/v1` ya publicado

---

## 2. Anatomía de un paso

Un paso está bien definido cuando cumple las cinco condiciones:

1. **Es verificable.** Existe una forma concreta de saber si funcionó.
2. **Es reversible**, o tiene documentado cómo revertirlo.
3. **Deja el sistema funcionando.** No se termina un paso con el build roto.
4. **Cabe en una unidad de trabajo.** Si necesita explicarse en más de cinco
   líneas, son varios pasos.
5. **Tiene un solo objetivo.** "Crear la tabla y el endpoint y la UI" son tres.

Si un paso no cumple alguna, se subdivide. **No hay límite de subdivisión:** si
una fase necesita 20 pasos, tiene 20 pasos.

---

## 3. El archivo de tarea

Un archivo por tarea, en `docs/tasks/`:

```
docs/tasks/
├── README.md                     índice de tareas y su estado
├── ACTIVE-{slug}.md              en curso
└── done/DONE-{slug}.md           completadas, se archivan aquí
```

**Solo puede haber un archivo `ACTIVE-*` a la vez.** Si aparece una tarea urgente,
la actual se pausa explícitamente (se anota el motivo) antes de abrir otra.

### Ciclo de vida

```
1. Se acuerda la tarea → se crea ACTIVE-{slug}.md con el plan completo
2. Se ejecuta paso 1 → se marca, se anota el resultado, se hace commit y push
3. Se ejecuta paso 2 → se actualiza el archivo... y así sucesivamente
4. Todos los pasos hechos → se mueve a done/DONE-{slug}.md
5. Se actualiza docs/progress/CHANGELOG.md
```

**El archivo se actualiza al terminar cada paso, no al final.** Un archivo que
solo se escribe al cierre no sirve para recuperar contexto: si el trabajo se
interrumpe, refleja un estado que ya no existe.

---

## 4. Plantilla

```markdown
# TAREA: {título}

**Estado:** En curso · **Riesgo:** Normal|Grande|Riesgoso
**Inicio:** YYYY-MM-DD · **Última actualización:** YYYY-MM-DD

## Objetivo
Qué queremos lograr, en dos o tres frases. Qué NO entra en esta tarea.

## Documentos consultados
- docs/XX-...md — qué se sacó de ahí

## Decisiones tomadas durante la ejecución
- YYYY-MM-DD: {decisión} — {por qué}

## Plan

### Fase 1 — {nombre}
- [ ] 1.1 {paso}
      Verificación: {cómo sé que funcionó}
      Reversión: {cómo lo deshago}
- [ ] 1.2 {paso}
      Verificación: ...

### Fase 2 — {nombre}
- [ ] 2.1 ...

## Bitácora

### YYYY-MM-DD — paso 1.1
Hecho: {qué se hizo}
Archivos: {rutas}
Resultado: {verificación pasó / falló y por qué}
Commit: {hash o mensaje}

## Bloqueos
- {qué impide avanzar y qué se necesita para desbloquear}

## Pendientes descubiertos
- {cosas que aparecieron y NO son de esta tarea, para no desviarse}
```

La sección **"Pendientes descubiertos"** es importante: evita que una tarea se
expanda sin control. Lo que aparece y no corresponde se anota y se pasa a
`docs/progress/TODO.md`, no se resuelve sobre la marcha.

---

## 5. Reglas de ejecución

1. **Se presenta el plan completo antes de ejecutar el primer paso** y se espera
   el visto bueno del usuario. Un plan aprobado a medias produce trabajo perdido.
2. **Un paso a la vez.** Al terminar, se reporta el resultado y se espera
   confirmación antes del siguiente, salvo que el usuario pida ir de corrido.
3. **Si un paso falla, no se avanza.** Se anota el fallo en la bitácora, se
   diagnostica y se corrige o se replantea el plan.
4. **Si el plan resulta equivocado a mitad de camino, se reescribe.** El plan
   sirve al trabajo, no al revés. El cambio se anota con su motivo.
5. **Cada paso completado se publica** (`commit` + `push`), incluyendo la
   actualización del archivo de tarea. Ver `CLAUDE.md` sección 10.
6. **Cada paso deja el sistema funcionando.** Si un cambio necesita tres pasos
   para no romper nada, son tres pasos y el intermedio también compila.

---

## 6. Recuperación de contexto

Este es el motivo principal de todo lo anterior.

**Al empezar cualquier sesión:**
```
1. Leer CLAUDE.md
2. Leer docs/tasks/README.md
3. ¿Hay un ACTIVE-*.md? → leerlo completo
4. Retomar desde el primer paso sin marcar
```

**Cuando la ventana de contexto se acerque al límite**, antes de continuar:
- Actualizar el archivo de tarea con el estado exacto
- Anotar en la bitácora qué se estaba haciendo y qué sigue
- Publicar

Así, una sesión nueva retoma leyendo un solo archivo. **El archivo de tarea es la
memoria del proyecto; el contexto de la conversación es desechable.**

Por eso la bitácora registra *qué se hizo y por qué*, no solo *qué falta*: una
sesión nueva necesita entender las decisiones, no únicamente la lista pendiente.

---

## 7. Ejemplo — tarea riesgosa

```markdown
# TAREA: Habilitar RLS en tablas de identidad

**Estado:** En curso · **Riesgo:** Riesgoso

## Objetivo
Habilitar y probar RLS en profiles, companies y company_members.
NO entra: tablas de catálogo ni de comercio.

## Plan

### Fase 1 — Preparación
- [ ] 1.1 Crear funciones auxiliares auth_role(), auth_company_ids(), is_master()
      Verificación: las tres se ejecutan sin error en SQL editor
      Reversión: drop function
- [ ] 1.2 Crear dos empresas y dos usuarios de prueba en staging
      Verificación: existen y puedo autenticarme con ambos

### Fase 2 — profiles
- [ ] 2.1 Habilitar RLS en profiles (sin políticas)
      Verificación: una consulta como usuario devuelve 0 filas — bloqueo total
      Reversión: disable row level security
- [ ] 2.2 Añadir política de lectura propia
      Verificación: el usuario A ve su perfil y NO ve el de B
- [ ] 2.3 Añadir política de actualización con check de rol
      Verificación: el usuario A no puede cambiarse el rol a master

### Fase 3 — companies
- [ ] 3.1 ...
```

Nótese el paso 2.1: **habilitar RLS sin políticas primero**, para confirmar que el
bloqueo total funciona antes de abrir permisos. Ese paso intermedio es lo que
distingue un plan seguro de uno optimista.

---

## 8. Qué NO hacer

- Marcar un paso como hecho sin ejecutar la verificación.
- Ejecutar varios pasos y actualizar el archivo al final.
- Aprovechar para "arreglar de paso" algo fuera del plan. Va a
  "Pendientes descubiertos".
- Escribir pasos vagos: "mejorar el catálogo" no es un paso.
- Dejar el archivo de tarea sin publicar. Si no se hizo push, no existe.
