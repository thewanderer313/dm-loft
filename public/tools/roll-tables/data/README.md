# Data Folder

This folder is for storing exported campaign data that you want to sync between computers.

## Recommended Files

- `roll-tables.json` - Exported roll table data
- `combat-tracker.json` - Exported combat/encounter data
- `*.json` - Any other exported data

## Workflow

### Exporting (on your home computer)
1. Open the app
2. Go to Roll Tables or Combat Tracker
3. Use Export to save your data here

### Importing (on your laptop)
1. Pull latest from git
2. Open the app
3. Use Import to load your data

## Note

This folder is tracked by git, so your data will sync when you push/pull.
If you prefer to keep data separate from code, add `data/*.json` to `.gitignore`.
