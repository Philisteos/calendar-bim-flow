# 🚀 GUÍA COMPLETA: IMPLEMENTACIÓN SISTEMA DE TRAZABILIDAD DE TAREAS

**Usuario destino:** db@mi-studio.cl  
**Fecha:** Enero 2026

---

## 📌 ¿QUÉ HACE ESTE SISTEMA?

Este sistema automatiza la gestión de tareas mediante:
- ✅ Google Forms (para capturar información)
- ✅ Google Sheets (como base de datos)
- ✅ Google Calendar (para visualizar y trackear tareas)
- ✅ Google Apps Script (la lógica/código)

**Funcionalidades principales:**
1. Crear tareas desde un formulario
2. Cada tarea genera un evento en Calendar
3. Hacer updates (actualizaciones) a las tareas
4. Cerrar tareas cuando terminen
5. Todo queda registrado con historial completo

---

## 🎯 FASE 1: CREAR GOOGLE SHEET BASE

### Paso 1.1: Crear el Google Sheet
1. Ve a [Google Sheets](https://sheets.google.com)
2. Crea un nuevo documento
3. Nómbralo: **"Sistema Trazabilidad Tareas 2026"**

### Paso 1.2: Crear la hoja "Config"
1. Renombra "Hoja 1" → **"Config"**
2. En la celda A1 escribe: **Parámetro**
3. En la celda B1 escribe: **Valor**
4. Deja esta hoja así por ahora (la llenaremos con código)

### Paso 1.3: Crear hojas para respuestas
Crea 3 hojas adicionales (clic en + abajo a la izquierda):

1. **"Respuestas de formulario 1"** (aquí llegarán las tareas nuevas)
2. **"Respuestas UPDATE"** (aquí llegarán los updates)
3. **"Respuestas CIERRE"** (aquí llegarán los cierres)

**Tu Sheet debe tener 4 pestañas:**
- Config
- Respuestas de formulario 1
- Respuestas UPDATE
- Respuestas CIERRE

---

## 🎯 FASE 2: AGREGAR EL CÓDIGO

### Paso 2.1: Abrir el Editor de Apps Script
1. En tu Google Sheet, ve al menú: **Extensiones → Apps Script**
2. Se abrirá una nueva pestaña con el editor
3. Verás un archivo "Código.gs" con algo de código de ejemplo

### Paso 2.2: Pegar el código completo
1. **Borra todo** el contenido del archivo "Código.gs"
2. **Copia TODO el código** del archivo "script google calendar.js"
3. **Pega** en el editor de Apps Script
4. Haz clic en el ícono del disco 💾 para guardar
5. Ponle nombre al proyecto: **"Sistema Trazabilidad"**

---

## 🎯 FASE 3: EJECUTAR FUNCIONES DE SETUP (PASO POR PASO)

**⚠️ IMPORTANTE:** Vamos a ejecutar funciones una por una para obtener permisos gradualmente.

### Paso 3.1: Crear la hoja Config
1. En el editor de Apps Script, busca en el menú superior el dropdown que dice "seleccionar función"
2. Busca y selecciona: **`crearHojaConfigV2`**
3. Haz clic en el botón ▶️ **Ejecutar**

**Primera vez que ejecutes:**
- Te pedirá permisos
- Clic en "Revisar permisos"
- Selecciona tu cuenta db@mi-studio.cl
- Verás advertencia de Google (es normal, es tu propio script)
- Clic en "Avanzado" → "Ir a Sistema Trazabilidad (no seguro)"
- Clic en "Permitir"

**Resultado esperado:**
- La hoja "Config" se llenará automáticamente con los parámetros
- Verás en el log: "Config v2 creada/actualizada"

### Paso 3.2: Verificar y ajustar Config
Vuelve a tu Google Sheet y ve a la hoja "Config". Deberías ver esto:

| Parámetro | Valor |
|-----------|-------|
| DURACION_TAREA_MINUTOS | 60 |
| DURACION_UPDATE_MINUTOS | 15 |
| DURACION_CIERRE_MINUTOS | 15 |
| CALENDARIO_ID | primary |
| ENVIAR_NOTIFICACION | FALSE |
| COLOR_TAREA | 1 |
| COLOR_UPDATE | 5 |
| COLOR_CIERRE | 11 |
| (vacío) | |
| HOJA_RESPUESTAS_CREAR | Respuestas de formulario 1 |
| HOJA_RESPUESTAS_UPDATE | Respuestas UPDATE |
| HOJA_RESPUESTAS_CIERRE | Respuestas CIERRE |
| (vacío) | |
| FORM_PLACEHOLDER_TASKID | {TASK_ID} |
| FORM_URL_UPDATE | (vacío por ahora) |
| FORM_URL_CIERRE | (vacío por ahora) |

**AJUSTES IMPORTANTES:**

1. **CALENDARIO_ID**: 
   - Si quieres usar tu calendario principal, déjalo en "primary"
   - Si quieres un calendario específico:
     - Ve a Google Calendar
     - Clic en los 3 puntos del calendario que quieres usar
     - "Configuración y compartir"
     - Baja hasta "Integrar calendario"
     - Copia el **ID del calendario** (es un email tipo xxxx@group.calendar.google.com)
     - Pégalo en Config

2. **ENVIAR_NOTIFICACION**: Cámbialo a **TRUE** si quieres que se envíen emails automáticos

3. **COLORES** (números del 1 al 11):
   - 1=Lavanda, 2=Salvia, 3=Uva, 4=Flamingo, 5=Banana, 6=Mandarina, 7=Pavo real, 8=Grafito, 9=Arándano, 10=Albahaca, 11=Tomate

---

## 🎯 FASE 4: CREAR LOS GOOGLE FORMS

⚠️ **IMPORTANTE:** Debes crear y vincular los formularios ANTES de ejecutar `prepararHojasControlV2`. Esto es porque las hojas necesitan tener encabezados primero.

Ahora necesitas crear 3 formularios de Google Forms.

### Paso 4.1: FORMULARIO DE CREACIÓN (Tareas nuevas)

1. Ve a [Google Forms](https://forms.google.com)
2. Crea un nuevo formulario
3. Título: **"Creación de Tarea"**
4. Descripción: *"Formulario para registrar nuevas tareas del proyecto"*

**Preguntas que debes agregar (en este orden):**

1. **Dirección de correo electrónico**
   - Tipo: Respuesta corta
   - Obligatoria: ✅
   - (Forms puede agregarla automáticamente si activas "Recopilar direcciones de correo")

2. **Fecha**
   - Tipo: Fecha
   - Obligatoria: ✅
   - *(Esta será la fecha del evento en Calendar)*

3. **Hora inicio** (OPCIONAL)
   - Tipo: Hora
   - Si no la incluyes, el sistema usará 09:00 AM por defecto

4. **Hora fin** (OPCIONAL)
   - Tipo: Hora

5. **Código proyecto**
   - Tipo: Respuesta corta
   - Obligatoria: ✅
   - Ejemplo: "PRY-2024-001"
   - ⚠️ **MUY IMPORTANTE:** Debe ser "Respuesta corta", NO "Hora" ni "Fecha"

6. **Concepto**
   - Tipo: Respuesta corta
   - Obligatoria: ✅
   - Ejemplo: "Diseño", "Modelado", "Reunión"

7. **Tipo de actividad**
   - Tipo: Respuesta corta o Desplegable
   - Obligatoria: ✅
   - Ejemplos: "ARQ", "EST", "MEC", "ELE", "DIS"

8. **Etapa**
   - Tipo: Respuesta corta o Desplegable
   - Obligatoria: ✅
   - Ejemplos: "Anteproyecto", "Proyecto", "Construcción"

9. **Especialidad**
   - Tipo: Respuesta corta
   - Opcional

10. **Descripción**
    - Tipo: Párrafo
    - Obligatoria: ✅
    - Aquí se describe la tarea

11. **Motivo**
    - Tipo: Párrafo
    - Opcional

12. **Impacto**
    - Tipo: Párrafo
    - Opcional

13. **Complejidad**
    - Tipo: Escala lineal (1-5) o Desplegable
    - Opcional
    - Opciones: Baja, Media, Alta

14. **Comentario**
    - Tipo: Párrafo
    - Opcional

### Paso 4.2: VINCULAR FORMULARIO CREAR CON SHEET

1. En el formulario, haz clic en la pestaña **"Respuestas"**
2. Clic en el ícono de Sheets (tres puntos verdes) **"Crear hoja de cálculo"**
3. Selecciona: **"Seleccionar hoja de cálculo existente"**
4. Busca tu Sheet "Sistema Trazabilidad Tareas 2026"
5. Selecciona la hoja: **"Respuestas de formulario 1"**
6. Clic en **"Crear"**

**Verificación:**
- Ve a tu Google Sheet
- La hoja "Respuestas de formulario 1" ahora debe tener encabezados con los nombres de las preguntas
- La primera columna debe ser "Marca temporal"

### Paso 4.3: FORMULARIO UPDATE

1. Crea un nuevo formulario
2. Título: **"Update de Tarea"**
3. Descripción: *"Registra avances o actualizaciones de una tarea existente"*

**Preguntas:**

1. **Dirección de correo electrónico**
   - Tipo: Respuesta corta
   - Obligatoria: ✅

2. **TaskID**
   - Tipo: Respuesta corta
   - Obligatoria: ✅
   - Descripción: *"Ingresa el TaskID de la tarea (formato: T-YYYYMMDD-XXXXXX)"*
   - ⚠️ **IMPORTANTE:** Este campo se llenará automáticamente desde los links

3. **Comentario**
   - Tipo: Párrafo
   - Obligatoria: ✅
   - Título sugerido: "Comentario update" o "Avance"
   - Aquí el usuario describe qué avanzó

4. **Fecha** (OPCIONAL)
   - Tipo: Fecha
   - Si no se incluye, se usa la marca temporal del formulario

**Vincular con Sheet:**
- Respuestas → Crear hoja de cálculo → Seleccionar existente
- Hoja: **"Respuestas UPDATE"**

### Paso 4.4: FORMULARIO CIERRE

1. Crea un nuevo formulario
2. Título: **"Cierre de Tarea"**
3. Descripción: *"Marca una tarea como completada/cerrada"*

**Preguntas:**

1. **Dirección de correo electrónico**
   - Tipo: Respuesta corta
   - Obligatoria: ✅

2. **TaskID**
   - Tipo: Respuesta corta
   - Obligatoria: ✅

3. **Comentario**
   - Tipo: Párrafo
   - Obligatoria: ✅
   - Título: "Comentario final" o "Resumen de cierre"

4. **Complicaciones**
   - Tipo: Párrafo
   - Opcional
   - Título: "Complicaciones / Dificultades"

**Vincular con Sheet:**
- Respuestas → Crear hoja de cálculo → Seleccionar existente
- Hoja: **"Respuestas CIERRE"**

### Paso 4.5: Preparar columnas de control (AHORA SÍ)

Ahora que los 3 formularios están vinculados y las hojas tienen encabezados, podemos agregar las columnas de control.

1. Vuelve al editor de Apps Script
2. Selecciona la función: **`prepararHojasControlV2`**
3. Haz clic en ▶️ **Ejecutar**

**Resultado esperado:**
- En las 3 hojas de respuestas se agregarán columnas de control al final:
  - Procesado
  - TaskID
  - ID Evento Principal
  - ID Evento Calendar
  - Fecha Procesamiento
  - Error
- Estas columnas tendrán fondo amarillo/naranja

**Verificación:**
- Ve a cada una de las 3 hojas ("Respuestas de formulario 1", "Respuestas UPDATE", "Respuestas CIERRE")
- Deberías ver al final (después de todas las columnas del formulario) las 6 nuevas columnas con fondo amarillo/naranja
- En el log de Apps Script deberías ver 3 mensajes: "Columnas de control OK: [nombre de hoja]"

---

## 🎯 FASE 5: CONFIGURAR LINKS ENTRE FORMULARIOS

Esta es la parte **MÁS IMPORTANTE** para que funcione el sistema de UPDATE y CIERRE.

### Paso 5.1: Obtener URL prefabricada de UPDATE

1. Abre el formulario **"Update de Tarea"**
2. Ve a la pregunta **"TaskID"**
3. Haz clic en los 3 puntos ⋮ → **"Rellenar previamente"**
4. Se abrirá una vista previa del formulario
5. En el campo "TaskID", escribe exactamente: **{TASK_ID}**
6. Haz clic en **"Obtener vínculo"** (abajo)
7. Se generará un link largo
8. **Copia ese link completo**

**El link se verá así:**
```
https://docs.google.com/forms/d/e/XXXXXXXXXXX/viewform?usp=pp_url&entry.123456789=%7BTASK_ID%7D
```

Nota: `%7BTASK_ID%7D` es la versión codificada de `{TASK_ID}`

9. Ve a tu Google Sheet → hoja **"Config"**
10. En la fila de **FORM_URL_UPDATE**, pega ese link en la columna B

### Paso 5.2: Obtener URL prefabricada de CIERRE

Repite el mismo proceso con el formulario "Cierre de Tarea":
1. Formulario "Cierre de Tarea"
2. Pregunta "TaskID" → ⋮ → Rellenar previamente
3. Escribir: **{TASK_ID}**
4. Obtener vínculo
5. Copiar el link
6. Pegar en Config → fila **FORM_URL_CIERRE**

### Paso 5.3: Verificar Config final

Tu hoja Config debe tener ahora:

```
FORM_PLACEHOLDER_TASKID    {TASK_ID}
FORM_URL_UPDATE           https://docs.google.com/forms/d/e/.../viewform?usp=pp_url&entry.XXX=%7BTASK_ID%7D
FORM_URL_CIERRE           https://docs.google.com/forms/d/e/.../viewform?usp=pp_url&entry.YYY=%7BTASK_ID%7D
```

---

## 🎯 FASE 6: CONFIGURAR EL TRIGGER

Ahora configuramos para que el script se ejecute automáticamente cuando alguien responda un formulario.

### Paso 6.1: Crear el trigger

1. Ve al editor de Apps Script
2. En el menú lateral izquierdo, clic en el ícono del reloj ⏰ **"Activadores"** (Triggers)
3. Clic en **"+ Agregar activador"** (abajo a la derecha)

**Configuración del activador:**
- Elija la función que desea ejecutar: **`onFormSubmit`**
- Elija la fuente del evento: **`Desde una hoja de cálculo`**
- Seleccione el tipo de evento: **`Al enviar un formulario`**
- Notificaciones de errores: **`Notificarme inmediatamente`**

4. Clic en **"Guardar"**

**Si te pide permisos adicionales:**
- Revisar permisos
- Permitir acceso a Calendar
- Permitir

### Paso 6.2: Verificar trigger creado

En la página de "Activadores" deberías ver:
- **Función:** onFormSubmit
- **Fuente del evento:** Desde una hoja de cálculo
- **Tipo de evento:** Al enviar un formulario
- **Estado:** Activo ✅

---

## 🎯 FASE 7: PRIMERA PRUEBA (CREAR TAREA)

### Paso 7.1: Llenar el formulario de Creación

1. Abre tu formulario **"Creación de Tarea"** (modo edición)
2. Clic en el ojo 👁️ para ver vista previa
3. Llena el formulario con datos de prueba:
   - Email: tu email (db@mi-studio.cl)
   - Fecha: mañana
   - Código proyecto: TEST-001
   - Concepto: Prueba
   - Tipo de actividad: TST
   - Etapa: Testing
   - Descripción: Esta es una tarea de prueba del sistema
   - (rellena los demás campos opcionales si quieres)

4. Haz clic en **"Enviar"**

### Paso 7.2: Verificar el resultado

**En Google Sheets:**
1. Ve a la hoja "Respuestas de formulario 1"
2. Deberías ver tu respuesta en la fila 2
3. **Espera 5-15 segundos**
4. Las columnas de control (Procesado, TaskID, etc.) se deben llenar automáticamente
5. Deberías ver:
   - ✅ Procesado: TRUE
   - 📋 TaskID: algo como "T-20260129-A1B2C3"
   - 🆔 ID Evento Principal: un ID largo
   - 📅 ID Evento Calendar: el mismo ID
   - 📆 Fecha Procesamiento: fecha/hora actual
   - ❌ Error: (vacío)

**En Google Calendar:**
1. Abre tu Google Calendar
2. Ve a la fecha que pusiste en el formulario
3. Deberías ver un nuevo evento con el título formateado:
   - Ejemplo: "TEST-001_Prueba_TST_Testing Esta es una tarea de prueba del sistema"
4. Haz clic en el evento
5. Verás toda la información detallada
6. **IMPORTANTE:** Verás links "Registrar UPDATE" y "Registrar CIERRE"

### Paso 7.3: Si algo salió mal

**Si las columnas no se llenaron:**
1. Ve a Apps Script
2. Clic en ⏱️ "Ejecuciones" (menú izquierdo)
3. Busca la ejecución más reciente
4. Si hay error en rojo, haz clic para ver el detalle
5. Lee el mensaje de error

**Errores comunes:**

❌ **"No se pudo obtener la fecha del evento"**
- La pregunta "Fecha" debe ser tipo "Fecha", no texto
- Verifica que la columna en Sheets se llame "Fecha" o similar

❌ **"El campo 'Código proyecto' se está leyendo como una HORA"**
- La pregunta "Código proyecto" debe ser "Respuesta corta", NO "Hora"

❌ **"No se pudo acceder al calendario"**
- Revisa CALENDARIO_ID en Config
- Si usas un calendario específico, debe estar compartido contigo con permisos de edición

❌ **"La hoja de CREAR no tiene columna 'TaskID'"**
- Ejecuta nuevamente `prepararHojasControlV2`

### Paso 7.4: Reprocesar fila si falla

Si algo falló y quieres reintentar:

1. Ve a Apps Script
2. En el menú de funciones, selecciona: **`reprocesarFilaEnHoja`**
3. En el código, busca la función `reprocesarFilaEnHoja` (línea ~1200)
4. Clic en ▶️ Ejecutar
5. Te pedirá parámetros:
   - nombreHoja: "Respuestas de formulario 1"
   - numeroFila: 2 (o el número de fila con error)

O edita temporalmente la función:
```javascript
function reprocesarFilaPrueba() {
  reprocesarFilaEnHoja("Respuestas de formulario 1", 2);
}
```
Y ejecútala.

---

## 🎯 FASE 8: PRUEBA DE UPDATE

### Paso 8.1: Obtener el TaskID

1. Ve a tu Google Calendar
2. Abre el evento que creaste en la prueba anterior
3. En la descripción, busca el **TaskID** (ej: T-20260129-A1B2C3)
4. Cópialo

### Paso 8.2: Usar el link de UPDATE

1. **DESDE EL EVENTO EN CALENDAR**, haz clic en el link "Registrar UPDATE (avance)"
2. Se abrirá el formulario de Update
3. El campo TaskID **debe estar prellenado** con tu TaskID
4. Si no está prellenado, revisa la Fase 5 (configuración de links)

### Paso 8.3: Enviar el UPDATE

1. En el formulario de Update:
   - Email: tu email
   - TaskID: (debería estar prellenado)
   - Comentario: "Primera actualización de prueba - Avancé un 30%"
2. Enviar

### Paso 8.4: Verificar resultado

**En Sheets:**
- Hoja "Respuestas UPDATE" debe tener tu respuesta
- Columnas de control deben llenarse

**En Calendar:**
- Deberías ver un **nuevo evento** (más pequeño, 15 min) con título "...UPDATE"
- El color será diferente (amarillo/banana por defecto)
- El **evento principal** debe tener en su descripción el historial actualizado

---

## 🎯 FASE 9: PRUEBA DE CIERRE

### Paso 9.1: Cerrar la tarea

1. Desde el evento principal en Calendar, haz clic en "Registrar CIERRE"
2. Se abre el formulario de Cierre con el TaskID prellenado
3. Llena:
   - Email: tu email
   - Comentario final: "Tarea completada exitosamente"
   - Complicaciones: "Ninguna" (opcional)
4. Enviar

### Paso 9.2: Verificar cierre

**En Sheets:**
- Hoja "Respuestas CIERRE" tiene tu respuesta

**En Calendar:**
- Nuevo evento "... CIERRE ..." (15 min, color rojo/tomate)
- El evento principal ahora tiene el título: **"[CERRADA] TEST-001_..."**
- El historial incluye el cierre

---

## 🎯 FASE 10: VALIDACIÓN Y AJUSTES FINALES

### Checklist final:

- [ ] La hoja Config está completa con todos los parámetros
- [ ] Los 3 formularios están creados y vinculados a sus hojas
- [ ] Los links de UPDATE y CIERRE están en Config
- [ ] El trigger está activo
- [ ] Creaste una tarea de prueba exitosamente
- [ ] Hiciste un UPDATE exitoso
- [ ] Cerraste la tarea exitosamente
- [ ] Los eventos aparecen en Calendar con la información correcta
- [ ] Los links de UPDATE y CIERRE funcionan desde Calendar

### Ajustes recomendados:

1. **Colores en Calendar:**
   - Ajusta los números en Config para que coincidan con tu paleta

2. **Duraciones:**
   - Ajusta DURACION_TAREA_MINUTOS según tus necesidades (60 min por defecto)
   - Ajusta DURACION_UPDATE_MINUTOS y DURACION_CIERRE_MINUTOS

3. **Calendario específico:**
   - Si no quieres "contaminar" tu calendario principal, crea uno nuevo:
     - Calendar → "+" → "Crear calendario nuevo"
     - Nombre: "Tareas MI-STUDIO"
     - Copia su ID y pégalo en CALENDARIO_ID

4. **Notificaciones:**
   - Cambia ENVIAR_NOTIFICACION a TRUE si quieres emails automáticos

---

## 🆘 SOLUCIÓN DE PROBLEMAS

### Problema: "No se pudo obtener TaskID en el UPDATE"

**Causa:** El placeholder no se reemplazó correctamente.

**Solución:**
1. Ve a Config
2. Verifica que FORM_URL_UPDATE contenga `%7BTASK_ID%7D` o `{TASK_ID}`
3. Verifica que FORM_PLACEHOLDER_TASKID sea exactamente `{TASK_ID}`
4. Regenera el link prefabricado del formulario UPDATE

### Problema: Los links en Calendar no funcionan

**Solución:**
1. Ejecuta la función: `actualizarLinksEventoPrincipal`
2. Pásale el TaskID de la tarea
3. Esto reconstruirá los links en el evento

### Problema: No se crean eventos en Calendar

**Solución:**
1. Verifica permisos de Calendar en Apps Script
2. Verifica que CALENDARIO_ID sea correcto
3. Si usas un calendario personalizado, comprueba que tengas permisos de edición

### Problema: Columnas "Procesado" no se actualizan

**Causa:** El trigger no está funcionando o hay un error en el código.

**Solución:**
1. Ve a Apps Script → Ejecuciones
2. Busca errores recientes
3. Si no hay ejecuciones, verifica que el trigger esté activo
4. Reintenta manualmente con `reprocesarFilaEnHoja`

---

## 📚 FUNCIONES ÚTILES DEL SCRIPT

### Diagnóstico:

- **`diagnosticarTaskIdEnFila("Respuestas de formulario 1", 2)`**
  - Muestra qué TaskID detecta el script en una fila específica

- **`diagnosticarEventoPorId("id_del_evento")`**
  - Verifica si un evento existe en Calendar

### Mantenimiento:

- **`actualizarLinksEventoPrincipal("T-20260129-ABC123")`**
  - Regenera los links de UPDATE/CIERRE en un evento

- **`actualizarTituloEventoPrincipalDesdeSheet("T-20260129-ABC123")`**
  - Sincroniza el título del evento con los datos actuales del Sheet

### Reprocesar:

- **`reprocesarFilaEnHoja("Respuestas de formulario 1", 2)`**
  - Vuelve a procesar una fila que falló o quieres recrear

---

## ✅ SISTEMA LISTO

¡Felicitaciones! Si llegaste hasta aquí y todas las pruebas funcionaron, tu sistema está **100% operativo**.

### Próximos pasos:

1. **Comparte los formularios** con tu equipo
2. **Opcional:** Crea un documento instructivo para usuarios finales
3. **Opcional:** Personaliza los campos según las necesidades de MI-STUDIO
4. **Opcional:** Agrega más campos al formulario (el script es bastante flexible)

### Soporte:

Si tienes problemas específicos, revisa:
1. El log de ejecuciones en Apps Script
2. Los valores de la columna "Error" en las hojas
3. Esta guía en la sección de solución de problemas

---

## 📌 NOTAS IMPORTANTES

1. **No compartas el Sheet con "cualquiera con el enlace puede editar"** - Solo comparte los formularios
2. **Haz backups regulares** del Sheet (Archivo → Crear una copia)
3. **Documenta los cambios** que hagas al código
4. **El sistema NO es control horario** - es solo trazabilidad de tareas
5. **Los TaskIDs son únicos** y se generan automáticamente

---

**🎉 ¡ÉXITO EN TU IMPLEMENTACIÓN!**

*Creado el 29 de enero de 2026 para MI-STUDIO*
