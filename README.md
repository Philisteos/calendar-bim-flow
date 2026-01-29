# Calendar BIM Flow

Task tracking and coordination system for BIM workflows using Google Workspace tools.

## Overview

This system automates task management for BIM coordination projects by integrating Google Forms, Sheets, Calendar, and Apps Script. It provides complete traceability for task creation, updates, and closure through a unique TaskID system that links all related events.

## Key Features

- Task creation from Google Forms with automatic calendar integration
- Update tracking with complete history and version control
- Task closure workflow with completion records
- Unique TaskID system for linking related events
- Color-coded calendar events for visual task status
- Automated data persistence in Google Sheets
- BIM-focused workflow structure

## Requirements

- Google Account with access to:
  - Google Forms
  - Google Sheets
  - Google Calendar
  - Google Apps Script

## Installation

For detailed implementation instructions, see the [complete implementation guide](GUIA_IMPLEMENTACION_CALENDARIO.md) (Spanish).

The guide covers:
1. Google Sheets configuration
2. Form creation and linking
3. Apps Script code installation
4. Trigger configuration
5. Testing and validation

## Project Structure

```
├── README.md                           
├── GUIA_IMPLEMENTACION_CALENDARIO.md   
├── src/
    ├── script google calendar.js       
    └── funcion_temporal_update.js      
```

## How It Works

The system follows a simple workflow:

1. User submits a form (create/update/close)
2. Apps Script trigger detects the new entry
3. Script processes the data and creates a calendar event
4. TaskID links all related events together
5. Data is stored in Sheets for persistence and reporting

## Color Coding

Calendar events use different colors to indicate their type:

- **Blue**: New tasks (CREATE)
- **Yellow**: Updates (UPDATE)
- **Green**: Task closures (CLOSE)

## Basic Usage

**Create a Task**
- Complete the "Create Task" form
- A calendar event is automatically created
- A unique TaskID is generated for tracking

**Update a Task**
- Use the "Update" form with the task's TaskID
- An update event is created and linked to the original task

**Close a Task**
- Use the "Close" form with the task's TaskID
- The task is marked as completed in the calendar

## Configuration

System parameters are managed in the "Config" sheet:

- Event duration settings
- Calendar ID
- Form URLs
- Event colors
- Notification preferences

## Troubleshooting

If events aren't being created automatically:
1. Check that Apps Script triggers are enabled
2. Verify calendar permissions
3. Review the troubleshooting section in the implementation guide

## Development

Developed for BIM coordination workflows, January 2026.

## License

Personal project for Google Workspace task management.

## Note

This is a Google Apps Script project. The JavaScript files need to be copied into the Google Apps Script editor - they cannot be executed locally.
