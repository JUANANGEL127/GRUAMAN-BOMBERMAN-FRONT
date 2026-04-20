# PRD Frontend - Indicador Central

Documento funcional para llevar al repo frontend una definicion alineada con:

- el backend ya implementado del Indicador Central,
- el workbook actual enriquecido,
- y los ajustes nuevos pedidos para correo segmentado y envio mensual acumulado.

---

## 1. Objetivo

Construir una experiencia administrativa para el Indicador Central donde el frontend:

- consulte y actualice la configuracion activa,
- permita ejecutar cortes manuales,
- explique correctamente la semantica del indicador,
- y quede preparado para alinearse con el siguiente ajuste backend:
  - comparativos total / Grua Man / Bomberman,
  - correo con graficas embebidas,
  - envio mensual acumulado diario.

El frontend **no calcula** el indicador.  
El backend sigue siendo la unica fuente de verdad para:

- dataset,
- resumen,
- workbook,
- snapshots,
- ejecuciones,
- scheduler/cron.

---

## 2. Contexto

Hoy el backend ya soporta:

- configuracion versionada,
- ejecucion manual,
- cron automatico en backend,
- workbook XLSX con:
  - `Resumen`
  - `Comparativo ingreso`
  - `Detalle`
  - `Ausencias - No ingreso`
  - `Desempeño por persona`

Ademas, ya existe un PRD de ajuste backend para el siguiente cambio:

- `specs/prd-ajustes-indicador-central-correo-mensual.md`

Ese ajuste todavia **no esta implementado**, pero el frontend conviene dejarlo documentado desde ya para no quedar desalineado.

---

## 3. Usuarios

- Administrador operativo
- Coordinacion IT / soporte funcional
- Lider funcional / aprobador del seguimiento
- Direccion: solo lectura futura, fuera de esta fase

---

## 4. Alcance frontend

### 4.1 Incluye

- pantalla de configuracion del Indicador Central,
- formulario para destinatarios multiples,
- configuracion de umbrales,
- configuracion de exclusiones,
- visualizacion del scope activo,
- ejecucion manual de cortes,
- panel de resultado de ejecucion,
- acceso a descarga del workbook generado por backend,
- explicacion funcional de la semantica del indicador.

### 4.2 No incluye

- recalcular metricas en frontend,
- definir la expresion cron desde UI,
- dashboards BI externos,
- scheduler visual editable,
- motor de correo desde frontend.

---

## 5. Responsabilidad del frontend vs backend

### 5.1 Lo que si gestiona el frontend

- `destinatarios`
- `distribucion_habilitada`
- `umbrales`
- `scope`
- `formatos_por_empresa`
- `exclusiones`
- ejecucion manual del indicador

### 5.2 Lo que NO gestiona el frontend

- la expresion cron
- la zona horaria del cron
- el lock distribuido
- la generacion interna del snapshot
- la logica de agregacion
- la semantica de idempotencia

### 5.3 Implicacion importante

Si en el ajuste nuevo se agrega un modo de envio como `mensual_acumulado`, el frontend puede:

- seleccionar ese modo,
- mostrarlo,
- explicarlo,

pero el scheduler sigue siendo backend.

---

## 6. Contrato backend que el frontend debe consumir

### 6.1 Configuracion activa

El frontend debe consumir y editar esta estructura logica:

```json
{
  "destinatarios": ["correo@dominio.com"],
  "umbrales": {
    "alerta_pct": 70,
    "objetivo_pct": 90
  },
  "formatos_por_empresa": {
    "1": ["chequeo_alturas", "permiso_trabajo", "horas_jornada"],
    "2": ["inspeccion_epcc", "permiso_trabajo", "horas_jornada"]
  },
  "exclusiones": [],
  "distribucion_habilitada": false,
  "scope": {
    "empresa_ids": [1, 2],
    "obra_id": null,
    "obra_nombre": null,
    "segmentar_por_obra": false,
    "nombres": []
  }
}
```

### 6.2 Ejecucion manual actual

```json
{
  "fecha_corte": "2026-04-06",
  "corte_tipo": "diario",
  "omitir_envio": true
}
```

### 6.3 Ejecucion manual futura esperada

Cuando se implemente el nuevo ajuste backend, el frontend debe poder alinearse con un modo adicional explicito, por ejemplo:

```json
{
  "fecha_corte": "2026-04-12",
  "corte_tipo": "mensual_acumulado",
  "omitir_envio": true
}
```

> Nota: este modo todavia no existe hoy en backend. Queda documentado porque el frontend futuro debe contemplarlo.

### 6.4 Respuesta de ejecucion

El frontend debe poder leer y mostrar al menos:

- `success`
- `already_processed`
- `snapshot_batch_id`
- `resumen`
- `ejecucion.estado`
- `ejecucion.error_message`

---

## 7. Semantica de negocio que la UI debe respetar

### 7.1 Ingreso vs cumplimiento

La UI debe explicar claramente que:

- **Ingreso / actividad registrada** = `horas_jornada`
- **Cumplimiento** = formatos operativos esperados excluyendo `horas_jornada`

No son la misma metrica.

### 7.2 Scope real: empresa-first

El scope base es **empresa-first**.

Reglas que la UI debe reflejar:

- el default actual es `empresa_ids = [1, 2]`
- empresas fuera de 1 y 2 quedan fuera si no se agregan explicitamente
- `obra_id` y `obra_nombre` son filtros opcionales
- si se activa `segmentar_por_obra`, la obra pasa a ser filtro estricto
- para volver a modo empresa-first puro, la UI debe guardar:
  - `obra_id = null`
  - `obra_nombre = null`
  - `segmentar_por_obra = false`

### 7.3 Diario vs mensual vs mensual acumulado

La UI debe ser explicitamente clara con la granularidad:

- `diario` actual:
  - procesa una sola fecha
  - su resumen es `persona_dia`
- `mensual` actual:
  - representa mes completo
  - usa `persona_unica_mensual` como base principal
  - trae `metricas_persona_dia` como contexto
- `mensual_acumulado` futuro:
  - debera representar desde el dia 1 del mes hasta la fecha de corte efectiva
  - no debe confundirse ni con diario puntual ni con mes completo

### 7.4 Persona-día vs persona unica

La UI no debe presentar como "operarios evaluados" algo que en realidad representa persona-día sin aclararlo.

Ejemplo de confusion real detectada:

- `Operarios evaluados = 4170`
- `Personas consolidadas en desempeño = 138`

Eso hoy puede ser tecnicamente correcto en export por rango con semantica diaria, pero funcionalmente confuso.

Por eso la UI debe:

- mostrar granularidad visible,
- usar labels claros,
- y evitar mezclar persona-día y persona unica sin contexto.

---

## 8. Requerimientos funcionales

### RF-01 - Consultar configuracion activa

El frontend debe cargar la configuracion activa al entrar al modulo.

### RF-02 - Editar destinatarios multiples

El usuario debe poder agregar, editar y eliminar correos dentro de un arreglo.

### RF-03 - Editar umbrales

El usuario debe poder editar al menos:

- `alerta_pct`
- `objetivo_pct`

### RF-04 - Editar exclusiones

El usuario debe poder cargar nombres excluidos del calculo como lista editable.

### RF-05 - Visualizar scope activo

El frontend debe mostrar si el indicador esta filtrado por empresa, obra o nombres especificos.

### RF-06 - Ejecutar corte manual

El usuario debe poder lanzar un corte indicando:

- fecha de corte
- tipo de corte disponible en backend
- si quiere `omitir_envio`

### RF-07 - Mostrar resultado de ejecucion

Luego de ejecutar, el frontend debe mostrar:

- estado
- snapshot batch
- resumen
- granularidad del resumen
- error si falla

### RF-08 - Descargar workbook coherente con backend

El frontend debe ofrecer la descarga del XLSX generado por backend.

Contenido minimo actual esperado:

- `Resumen`
- `Comparativo ingreso`
- `Detalle`
- `Ausencias - No ingreso`
- `Desempeño por persona`

### RF-09 - Explicar la semantica del reporte

La UI debe comunicar que el workbook actual:

- separa ingreso y cumplimiento,
- incluye comparativo visual,
- mantiene tabs operativas,
- y en mensual usa persona unica como base principal.

### RF-10 - Prepararse para comparativos futuros en correo y workbook

Cuando el backend implemente el nuevo ajuste, la UI debe estar preparada para reflejar que el resultado ejecutivo se organiza en:

- comparativo total,
- comparativo Grua Man,
- comparativo Bomberman.

### RF-11 - Prepararse para modo mensual acumulado

Cuando exista en backend, la UI debe poder presentar y disparar el modo `mensual_acumulado` con descripcion clara:

- "desde el primer dia del mes hasta la fecha de corte efectiva"

### RF-12 - No permitir lectura equivocada del universo evaluado

La UI debe mostrar labels o ayudas contextuales cuando el backend responda en semantica `persona_dia`, para que negocio no interprete esa cifra como personas unicas.

---

## 9. UX recomendada

### 9.1 Pantalla: Configuracion

Bloques:

1. Destinatarios
2. Umbrales
3. Scope
4. Exclusiones
5. Estado de distribucion automatica
6. Boton "Guardar configuracion"

### 9.2 Pantalla: Ejecucion manual

Bloques:

1. Fecha de corte
2. Tipo de corte
3. Checkbox "Ejecutar sin envio"
4. Boton "Ejecutar indicador"
5. Panel de resultado
6. Acceso a descarga del workbook

### 9.3 Ayuda contextual recomendada

La UI deberia mostrar mensajes breves como:

- "Diario: evalua una fecha puntual"
- "Mensual: resume el mes completo"
- "Mensual acumulado: resume desde el dia 1 hasta la fecha de corte" (cuando exista)

### 9.4 Vista de resumen

La vista debe dejar visible:

- granularidad
- total evaluado
- con ingreso
- sin ingreso
- cumplimiento
- nota de interpretacion si aplica

---

## 10. Workbook y correo: alineacion esperada

### 10.1 Estado actual

Hoy el frontend solo descarga el workbook; no controla el correo.

### 10.2 Estado objetivo siguiente

Cuando se implemente el nuevo ajuste backend, el frontend debe quedar alineado con un resultado ejecutivo donde:

- el correo incluye graficas,
- el workbook puede incluir comparativo total + comparativos por empresa,
- el scope activo define el universo evaluado,
- el modo mensual acumulado se entiende sin ambiguedad.

---

## 11. Criterios de aceptacion

- CA-01: Un admin puede ver la configuracion activa sin tocar base de datos.
- CA-02: Los destinatarios se editan como arreglo dinamico.
- CA-03: Se puede guardar una nueva configuracion activa con feedback claro.
- CA-04: Se puede ejecutar un corte manual con y sin envio.
- CA-05: El resultado muestra resumen, estado y errores si aplica.
- CA-06: La UI no implementa logica de calculo.
- CA-07: La UI explica correctamente ingreso vs cumplimiento.
- CA-08: La UI muestra claramente la granularidad del resultado.
- CA-09: La UI no confunde persona-día con persona unica.
- CA-10: La UI queda preparada para alinearse con el futuro modo `mensual_acumulado`.

---

## 12. Riesgos

- Si la UI no aclara granularidad, negocio puede interpretar mal las metricas.
- Si el frontend intenta reinterpretar calculos, rompe alineacion con backend.
- Si el scheduler se intenta modelar como algo editable en frontend sin soporte real backend, se crea una expectativa falsa.
- Si el PRD frontend no contempla desde ahora el ajuste de correo/mensual acumulado, el siguiente flujo en el repo frontend va a arrancar desalineado.

---

## 13. Recomendacion de implementacion frontend

### Primera iteracion

- pantalla admin simple
- formulario de configuracion
- ejecucion manual
- panel de resultado
- descarga del XLSX
- ayudas de granularidad

### Segunda iteracion

- historico de ejecuciones
- lectura de snapshots
- mejor lectura de comparativos
- alineacion con `mensual_acumulado`
- soporte UI para el nuevo comportamiento ejecutivo total / Grua Man / Bomberman
