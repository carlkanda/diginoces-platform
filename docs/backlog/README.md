# Backlog and Requirements

This folder contains version-controlled backlog and requirements artifacts used by the AI-agent build system.

## Source of truth

The editable source is the Google Sheet:

- Master Requirements Register - Diginoces
- Initial Product Backlog - Diginoces

Google Sheets remain the working/editable source. GitHub should contain exported CSV snapshots used by developers and AI agents.

## Required exports

Recommended files for this folder:

```text
master-requirements-register.csv
initial-product-backlog.csv
product-backlog-structure.md
```

## Export rule

When exporting from Google Sheets to GitHub:

1. Export each sheet/tab as CSV.
2. Commit the CSV file to this folder.
3. Update this README with export date.
4. Do not include private wedding data or real client/guest data.

## Traceability rule

Every backlog item must reference a requirement ID from the Master Requirements Register.
