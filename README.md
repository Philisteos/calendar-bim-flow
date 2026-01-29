# 📅 Sistema de Trazabilidad de Tareas - Google Calendar

Sistema automatizado de gestión de tareas que integra Google Forms, Sheets, Calendar y Apps Script para crear, actualizar y cerrar tareas con trazabilidad completa.

## 🚀 Características

- ✅ **Creación de tareas** desde Google Forms
- 📝 **Actualizaciones** con historial completo
- ✔️ **Cierre de tareas** con registro de finalización
- 🔗 **Integración automática** con Google Calendar
- 📊 **Base de datos** en Google Sheets
- 🎨 **Código de colores** visual para cada tipo de evento
- 🆔 **Sistema TaskID** único para cada tarea

## 📋 Requisitos

- Cuenta de Google (Gmail)
- Acceso a Google Workspace:
  - Google Forms
  - Google Sheets
  - Google Calendar
  - Google Apps Script

## 🛠️ Instalación

Para implementar este sistema en tu cuenta de Google, sigue la guía completa de implementación:

**➡️ [Ver Guía de Implementación Completa](GUIA_IMPLEMENTACION_CALENDARIO.md)**

La guía incluye:
1. Configuración de Google Sheets
2. Creación de formularios
3. Instalación del código Apps Script
4. Configuración de triggers
5. Pruebas del sistema

## 📁 Estructura del Proyecto

```
├── README.md                           # Este archivo
├── GUIA_IMPLEMENTACION_CALENDARIO.md   # Guía completa paso a paso
├── script google calendar.js           # Código principal del sistema
└── funcion_temporal_update.js          # Función auxiliar para reprocesar updates
```

## 🎯 ¿Cómo funciona?

1. **Usuario completa formulario** → Se crea registro en Sheet
2. **Trigger automático** → Apps Script detecta nueva entrada
3. **Se crea evento** en Google Calendar con información de la tarea
4. **Se genera TaskID único** que permite hacer seguimiento
5. **Updates y cierres** se vinculan a la tarea original mediante TaskID

## 🎨 Código de Colores

El sistema usa colores para identificar rápidamente el tipo de evento:

- 🟦 **Azul**: Tareas nuevas (CREAR)
- 🟨 **Amarillo**: Actualizaciones (UPDATE)
- 🟩 **Verde**: Cierres de tareas (CIERRE)

## 📝 Uso Básico

### Crear una Tarea
1. Completa el formulario de "Crear Tarea"
2. Automáticamente aparecerá en tu calendario
3. Se generará un TaskID único

### Actualizar una Tarea
1. Usa el formulario de "Update"
2. Ingresa el TaskID de la tarea
3. Se creará un microevento de actualización en el calendario

### Cerrar una Tarea
1. Usa el formulario de "Cierre"
2. Ingresa el TaskID de la tarea
3. Se marcará como finalizada en el calendario

## 🔧 Configuración

Todos los parámetros del sistema se configuran desde la hoja "Config" del Google Sheet:

- Duración de eventos
- ID del calendario
- URLs de formularios
- Colores de eventos
- Notificaciones

## 🐛 Solución de Problemas

Si los eventos no se crean automáticamente:
1. Verifica que los triggers estén activos en Apps Script
2. Revisa los permisos del calendario
3. Consulta la sección de troubleshooting en la guía de implementación

## 👤 Usuario Destino

**Email:** db@mi-studio.cl  
**Fecha de desarrollo:** Enero 2026

## 📄 Licencia

Este proyecto es de uso personal. Desarrollado para gestión de tareas con Google Workspace.

## 🤝 Contribuciones

Este es un proyecto personal, pero si encuentras errores o tienes sugerencias, no dudes en abrir un issue.

---

**Nota:** Este es un proyecto para Google Apps Script. Los archivos `.js` deben copiarse al editor de Google Apps Script (no se ejecutan localmente).
