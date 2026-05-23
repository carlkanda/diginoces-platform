# Master Requirements Register Source

The editable Master Requirements Register is maintained in Google Sheets.

Source file:

https://docs.google.com/spreadsheets/d/1Bs59s5x-ItaiuuLj8tnCHT8zAiTmRx8HZ35CzQ5w6nM/edit

## Export status

The register currently contains the structured requirement inventory used by the AI-agent build system.

The GitHub connector can read the sheet, but direct full-sheet CSV export can exceed connector display limits. To avoid committing incomplete data, the CSV snapshot should be exported tab by tab or generated from the sheet values in a controlled process.

## Required CSV snapshots

The following snapshots should be placed in this folder:

```text
master-requirements-register.csv
traceability_matrix.csv
module_coverage.csv
requirements-lists.csv
initial-product-backlog-epics.csv
initial-product-backlog-features.csv
initial-product-backlog-user-stories.csv
initial-product-backlog-tasks.csv
initial-product-backlog-test-cases.csv
initial-product-backlog-lists.csv
```

## Rule

Never commit a partial/truncated requirements CSV. The requirement register controls feature completeness, so an incomplete export can cause agents to miss requirements.
