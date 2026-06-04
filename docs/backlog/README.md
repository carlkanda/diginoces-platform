# Backlog and Requirements

This folder contains version-controlled backlog and requirements artifacts used by the AI-agent build system.

## Source of truth

The editable source is the Google Sheet:

- Master Requirements Register - Diginoces
- Initial Product Backlog - Diginoces

Google Sheets remain the working/editable source. GitHub should contain exported CSV snapshots used by developers and AI agents.

## Required exports

Required CSV snapshots for this folder:

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

<!-- Sprint 15: GitHub issue #31; ROAD-001, TECH-010; EPIC-RELEASE, FEAT-REL-001; sprint plan docs/planning/sprint-15-plan.md; sync script npm run backlog:sync-aliases; guard apps/web/src/lib/platform/release-readiness.test.ts -->
Sprint 15 active-agent documents also reference hyphenated compatibility aliases:

```text
traceability-matrix.csv
module-coverage.csv
```

Keep those aliases content-compatible with the underscore-named exports.

Dual naming exists because historical backlog exports use underscore filenames while the active Sprint 15 agent instructions and some external review consumers reference hyphenated filenames. The underscore files remain canonical Google Sheet exports; the hyphenated files are compatibility aliases that must carry the same content.

Synchronization automation: after refreshing the canonical underscore exports, run `npm run backlog:sync-aliases` to copy `traceability_matrix.csv` to `traceability-matrix.csv` and `module_coverage.csv` to `module-coverage.csv`. Synchronization guard: `apps/web/src/lib/platform/release-readiness.test.ts` compares each alias pair and fails if the generated hyphenated files drift from the canonical exports.

## Export rule

When exporting from Google Sheets to GitHub:

1. Export each sheet/tab as CSV.
2. Commit the CSV file to this folder.
3. Update this README with export date.
4. Do not include private wedding data or real client/guest data.

## Traceability rule

Every backlog item must reference a requirement ID from the Master Requirements Register.
