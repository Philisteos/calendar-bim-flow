# INSTRUCCIONES: CALENDARIOS COMPARTIDOS COMO INVITADOS

## Cambios Realizados

Se agregó funcionalidad para que al crear una tarea, el usuario pueda seleccionar un calendario compartido del proyecto, y ese calendario será agregado automáticamente como invitado del evento.

## Pasos de Implementación

### PASO 1: Actualizar el código en Apps Script

1. Abre tu Google Sheet "Sistema Trazabilidad Tareas 2026"
2. Ve a Extensiones → Apps Script
3. Borra todo el contenido actual
4. Copia el código completo del archivo actualizado: `src/script google calendar.js`
5. Pega en el editor
6. Guarda (Ctrl+S o ícono disco)

### PASO 2: Crear la hoja de Calendarios Compartidos

1. En Apps Script, selecciona la función: `crearHojaCalendariosCompartidos`
2. Click en Ejecutar
3. Se creará automáticamente una hoja llamada "Calendarios" con todos los proyectos

La hoja tendrá 3 columnas:
- CODIGO (ej: B0050-BBA)
- NOMBRE (ej: AERODROMO BALMACEDA)
- ID GOOGLE CALENDAR (ej: c_am12prga1kadviqhj0rguqdrls@group.calendar.google.com)

### PASO 3: Actualizar la hoja Config

1. En Apps Script, selecciona la función: `crearHojaConfigV2`
2. Click en Ejecutar
3. Esto actualizará Config con el nuevo parámetro: HOJA_CALENDARIOS_COMPARTIDOS = Calendarios

### PASO 4: Modificar el formulario de "Creación de Tarea"

1. Abre tu formulario de Google Forms "Creación de Tarea"
2. Agrega una nueva pregunta (después de "Código proyecto"):

   **Pregunta:** Calendario del Proyecto
   **Tipo:** Desplegable
   **Obligatoria:** Sí
   
   **Opciones (agregar estas 10):**
   - B0050-BBA
   - B0075-EPE
   - B0077-LPR
   - B0095-CMF
   - B0074-VLR
   - B0087-MA1
   - B0078-LP4
   - B0081-LT3
   - A1014-SAN
   - T0006-TDC

3. Guarda el formulario

### PASO 5: Actualizar columnas de control

1. En Apps Script, selecciona: `prepararHojasControlV2`
2. Click en Ejecutar
3. Esto asegura que las columnas de control estén bien configuradas

### PASO 6: Prueba

1. Llena el formulario de "Creación de Tarea"
2. Selecciona un proyecto del dropdown "Calendario del Proyecto"
3. Envía el formulario
4. Verifica en Google Calendar:
   - Se crea el evento
   - En la lista de invitados del evento deberías ver el calendario compartido (aparece como "Nombre del Calendario calendario")
   - El evento también aparece en el calendario compartido del proyecto

## Cómo Funciona

1. El usuario selecciona el código del proyecto (ej: B0050-BBA)
2. El script busca ese código en la hoja "Calendarios"
3. Obtiene el ID del calendario compartido
4. Al crear el evento, agrega ese calendario como invitado usando `evento.addGuest(calendarId)`
5. El evento aparece tanto en el calendario del usuario como en el calendario compartido del proyecto

## Verificación

Para verificar que funciona:
1. Crea una tarea de prueba seleccionando un proyecto
2. Abre el evento en Calendar
3. Click en "Ver detalles del evento"
4. Busca la sección "Invitados"
5. Deberías ver el calendario compartido listado

## Notas Importantes

- Los calendarios compartidos deben tener permisos configurados correctamente
- Si el calendario no aparece como invitado, verifica:
  1. Que el ID del calendario en la hoja "Calendarios" sea correcto
  2. Que tengas permisos para agregar invitados a esos calendarios
  3. Revisa el log de Apps Script (Ver → Registros) para ver mensajes de error

## Agregar Más Calendarios

Si necesitas agregar más proyectos:
1. Ve a la hoja "Calendarios"
2. Agrega una nueva fila con: CODIGO | NOMBRE | ID_CALENDAR
3. Actualiza el formulario agregando ese código en las opciones del dropdown "Calendario del Proyecto"

## Soporte

Si hay errores:
1. Ve a Apps Script → Ejecuciones
2. Busca ejecuciones con errores (en rojo)
3. Click para ver el detalle del error
4. El mensaje indicará qué falló
