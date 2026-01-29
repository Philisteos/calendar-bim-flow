# 📅 Calendar BIM Flow - Task Tracking & Coordination System

Automated BIM task management system that integrates Google Forms, Sheets, Calendar, and Apps Script to create, update, and close tasks with complete traceability for BIM coordination workflows.

## 🚀 Features

- ✅ **Task creation** from Google Forms
- 📝 **Updates** with complete history tracking
- ✔️ **Task closure** with completion records
- 🔗 **Automatic integration** with Google Calendar
- 📊 **Database** in Google Sheets
- 🎨 **Visual color coding** for each event type
- 🆔 **Unique TaskID system** for each task
- 🏗️ **BIM-focused** workflow and coordination

## 📋 Requirements

- Google Account (Gmail)
- Access to Google Workspace:
  - Google Forms
  - Google Sheets
  - Google Calendar
  - Google Apps Script

## 🛠️ Installation

To implement this system in your Google account, follow the complete implementation guide:

**➡️ [View Complete Implementation Guide](GUIA_IMPLEMENTACION_CALENDARIO.md)** *(Spanish)*

The guide includes:
1. Google Sheets configuration
2. Form creation
3. Apps Script code installation
4. Trigger setup
5. System testing

## 📁 Project Structure

```
├── README.md                           # This file
├── GUIA_IMPLEMENTACION_CALENDARIO.md   # Step-by-step guide (Spanish)
├── src/
    ├── script google calendar.js       # Main system code
    └── funcion_temporal_update.js      # Auxiliary function for reprocessing
```

## 🎯 How It Works

1. **User completes form** → Record created in Sheet
2. **Automatic trigger** → Apps Script detects new entry
3. **Event created** in Google Calendar with task information
4. **Unique TaskID generated** for tracking
5. **Updates and closures** linked to original task via TaskID

## 🎨 Color Coding

The system uses colors to quickly identify event types:

- 🟦 **Blue**: New tasks (CREATE)
- 🟨 **Yellow**: Updates (UPDATE)
- 🟩 **Green**: Task closures (CLOSE)

## 📝 Basic Usage

### Create a Task
1. Complete the "Create Task" form
2. It will automatically appear in your calendar
3. A unique TaskID will be generated

### Update a Task
1. Use the "Update" form
2. Enter the task's TaskID
3. An update micro-event will be created in the calendar

### Close a Task
1. Use the "Close" form
2. Enter the task's TaskID
3. It will be marked as completed in the calendar

## 🔧 Configuration

All system parameters are configured from the "Config" sheet in Google Sheets:

- Event duration
- Calendar ID
- Form URLs
- Event colors
- Notifications

## 🐛 Troubleshooting

If events are not created automatically:
1. Verify that triggers are active in Apps Script
2. Check calendar permissions
3. Consult the troubleshooting section in the implementation guide

## 👤 Author

**Developed for BIM coordination workflows**  
**Date:** January 2026

## 📄 License

This is a personal project developed for task management with Google Workspace.

## 🤝 Contributing

This is a personal project, but if you find bugs or have suggestions, feel free to open an issue.

---

**Note:** This is a Google Apps Script project. The `.js` files must be copied to the Google Apps Script editor (they don't run locally).
