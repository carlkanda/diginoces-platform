# Sprint 4 Plan — Guest Import & Approval Workflow

## 1. Sprint goal

Sprint 4 builds the **Guest Import & Approval Workflow** for the Diginoces platform.

The goal is to allow bride, groom, Diginoces staff, and Diginoces/admin users to import guest lists from CSV or Excel-style files in a controlled, auditable, permission-aware way.

Sprint 4 extends the Sprint 3 guest-management foundation. It must support:

- uploading guest-list files;
- previewing import rows before saving;
- mapping source columns to Diginoces guest fields;
- validating imported rows;
- detecting duplicate candidates during import;
- staging imported rows before activation;
- requiring Diginoces/admin approval for bride/groom imports;
- partially approving or rejecting imported rows;
- creating approved guest records only after validation and approval;
- tracking import history and audit logs.

Sprint 4 must not build RSVP, public guest pages, invitations, PDF generation, QR generation, WhatsApp workflows, seating, check-in, contracts, pricing, payments, or partner project creation.

---

## 2. Source documents

Before coding, the agent must read and follow:

- `AGENTS.md`
- `docs/agent-system/00-ai-agent-build-system-governance.md`
- `docs/agent-system/agent-role-prompts.md`
- `docs/agent-system/agent-execution-workflow.md`
- `docs/planning/mvp-build-execution-plan.md`
- `docs/planning/sprint-3-plan.md`
- `docs/product/04-guest-management-guest-lists.md`
- `docs/product/03-wedding-project-structure.md`
- `docs/product/02-user-roles-permissions-access-control.md`
- `docs/technical-design/database-schema-core-entities.md`
- `docs/technical-design/api-backend-service-design.md`
- `docs/technical-design/security-permissions-access-control.md`
- `docs/backlog/master-requirements-register.csv`
- `docs/backlog/initial-product-backlog-epics.csv`
- `docs/backlog/initial-product-backlog-features.csv`
- `docs/backlog/initial-product-backlog-user-stories.csv`
- `docs/backlog/initial-product-backlog-tasks.csv`
- `docs/backlog/initial-product-backlog-test-cases.csv`

---

## 3. Sprint dependency

Sprint 4 depends on Sprint 3 being merged into `main`.

Sprint 4 must assume these foundations already exist:

- project model;
- event model;
- project membership model;
- event membership model;
- guest model;
- guest title/type foundation;
- guest tags/categories foundation;
- bride/groom/both guest-side model;
- guest event assignment foundation;
- guest validation helpers;
- duplicate detection foundation;
- guest permission checks;
- audit-log foundation.

If any Sprint 3 dependency is missing, the agent must stop, report the blocker, and avoid creating workaround models that conflict with the planned architecture.

---

## 4. Backlog scope

Sprint 4 focuses on guest import and approval.

Primary epic:

- `EPIC-GM` — Guest Management & Guest Lists

Primary features:

- `FEAT-GM-009` — CSV/Excel guest import foundation
- `FEAT-GM-010` — Import column mapping
- `FEAT-GM-011` — Import preview and validation
- `FEAT-GM-012` — Duplicate detection during import
- `FEAT-GM-013` — Import approval workflow
- `FEAT-GM-014` — Import history and audit trail

If the exact feature IDs differ in the CSV backlog, the agent must use the matching backlog rows and document the actual IDs in the Sprint 4 completion report.

---

## 5. Requirement IDs covered

Sprint 4 should primarily cover or begin coverage for:

- `GM-004` — CSV/Excel guest import with column mapping and preview
- `GM-005` — Bride/groom imports require Diginoces/admin review before guests become active
- `GM-006` — Required field validation before key workflows
- `GM-008` — Duplicate detection across bride/groom lists and imports
- `GM-013` — List locking stage awareness, where relevant
- `GM-014` — Structured change/request control after lock, placeholder only if needed
- `GM-015` — Printed-only guest support during import
- `ROLE-001` — Role-based permission model
- `ROLE-005` — Bride/groom own-side management and partner-side restrictions
- `REP-006` — Audit logs for sensitive actions
- `TECH-004` — Backend permission enforcement

Sprint 4 may reference future requirements, but it must not implement future modules unless explicitly in scope.

---

## 6. In scope

Sprint 4 may implement the following.

### 6.1 Import session model

Add database support for import sessions.

An import session should record:

- project ID;
- uploaded by user ID;
- import side: bride, groom, both, or admin-selected;
- source filename;
- source file type;
- import status;
- row count;
- valid row count;
- invalid row count;
- duplicate warning count;
- submitted for approval timestamp;
- approved/rejected by;
- approval timestamp;
- created guest count;
- audit references where appropriate;
- created_at and updated_at timestamps.

Recommended statuses:

```text
draft
previewed
validation_failed
ready_for_review
partially_approved
approved
rejected
applied
cancelled
failed
```

The agent may adjust exact enum names if consistent with existing conventions.

### 6.2 Import row staging model

Imported rows must be staged before becoming real guests.

Each staged row should record:

- import session ID;
- row number;
- raw row data;
- mapped field values;
- validation status;
- validation errors;
- duplicate warnings;
- approval status;
- linked guest ID after approval/application;
- created_at and updated_at timestamps.

Imported rows must not become active guest records until approved and applied.

### 6.3 File upload and parsing foundation

Sprint 4 should support CSV import directly.

Excel import may be supported if practical, but it can also be documented as a follow-up if it would add unnecessary complexity to this sprint.

Minimum supported format:

- UTF-8 CSV;
- header row required;
- comma-separated values;
- quoted fields supported;
- graceful handling of blank rows.

If Excel is implemented, it should support `.xlsx` only and avoid unsafe file processing.

### 6.4 Column mapping

The import workflow must allow the user to map uploaded columns to Diginoces fields.

Core target fields:

- display name;
- title/type;
- WhatsApp number;
- side;
- preferred language;
- printed-only flag;
- tags/categories;
- event assignments, if supported in file;
- notes, if allowed.

The system should try to suggest mappings from common column names but must allow review before import.

Examples of common source headers:

```text
Nom
Nom complet
Prénom & Nom
Titre
WhatsApp
Téléphone
Côté
Bride/Groom
Table
Langue
Invitation
Commentaires
```

Column mapping suggestions must not silently save data without preview.

### 6.5 Import preview

Before applying an import, the user should see a preview including:

- source row number;
- mapped guest display name;
- mapped title/type;
- mapped WhatsApp number;
- side;
- printed-only flag;
- event assignment preview;
- validation status;
- duplicate warnings;
- row action: create, skip, needs correction, duplicate review.

No guest record should be created during preview.

### 6.6 Validation during import

Import validation should reuse or extend the Sprint 3 guest validation foundation.

Validation should detect:

- missing display name;
- missing title/type;
- missing side;
- invalid side value;
- unknown title/type;
- invalid WhatsApp number format where applicable;
- missing WhatsApp number for digital guests if digital flag is present;
- printed-only guest without WhatsApp number allowed if import maps the printed-only flag correctly;
- event assignment to an event outside the project;
- duplicate candidate inside the same import session;
- duplicate candidate against existing project guests.

Validation must be row-level and session-level.

### 6.7 Duplicate detection during import

Sprint 4 should detect duplicate candidates using at least:

- same WhatsApp number;
- same normalized display name;
- same title/type plus normalized display name;
- duplicate between two rows in the same import file;
- duplicate against existing project guests.

The system must not auto-merge duplicates.

It may mark rows as:

```text
clear
warning
blocked
needs_review
```

Duplicate review may remain simple in Sprint 4, but duplicate information must be visible and auditable.

### 6.8 Bride/groom import approval

Bride and groom imports must not immediately create active guests.

Required workflow:

1. Bride/groom uploads guest file for own side.
2. System parses the file.
3. User maps columns.
4. System validates and previews rows.
5. User submits import for review.
6. Diginoces/admin or authorized staff reviews staged rows.
7. Reviewer approves, partially approves, rejects, or requests correction.
8. Approved rows become guest records.
9. Rejected rows remain in import history.
10. Audit logs record each important action.

Diginoces/admin imports may be allowed to apply directly after validation if the role has permission.

### 6.9 Partial approval

The reviewer should be able to approve only valid rows and reject or hold invalid/duplicate rows.

Examples:

- approve 48 rows;
- reject 2 rows with missing names;
- hold 3 rows for duplicate review;
- approve printed-only rows without WhatsApp if valid.

The system must preserve row-level status.

### 6.10 Import history

The project should keep import history.

Users with permission should see:

- import session date;
- uploaded by;
- file name;
- side;
- total rows;
- valid rows;
- invalid rows;
- duplicate warnings;
- approval status;
- created guest count;
- reviewer;
- notes.

Import history should support accountability and troubleshooting.

### 6.11 Audit logging

Import-related sensitive actions must write audit logs or call the audit abstraction.

Audit actions should include:

- import session created;
- import file parsed;
- column mapping saved;
- import validation completed;
- import submitted for review;
- import approved;
- import partially approved;
- import rejected;
- staged row approved/rejected;
- guest created from import;
- duplicate warning reviewed, if implemented.

### 6.12 Basic UI

Add basic UI for:

- import start/upload page;
- column mapping screen;
- import preview screen;
- validation/duplicate warning display;
- submit for review action;
- admin/staff review screen;
- import history list/detail.

Keep UI simple and functional.

Sprint 4 is an operational workflow sprint, not final UX polish.

---

## 7. Out of scope

Do not implement the following in Sprint 4:

- RSVP;
- public guest page;
- invitation template upload;
- PDF generation;
- QR generation;
- WhatsApp sending;
- seating/table assignment;
- check-in;
- contracts;
- pricing;
- payments;
- partner-created project workflow;
- advanced AI cleanup;
- automatic duplicate merging;
- full household/family workflow;
- final invitation-readiness workflow;
- Canva CSV generation.

If a future dependency is discovered, document it as a follow-up. Do not build it silently.

---

## 8. Recommended database objects

The agent may choose the final names based on existing conventions, but the following objects are expected conceptually:

```text
guest_import_sessions
guest_import_rows
guest_import_mappings
```

Optional, if useful and low-risk:

```text
guest_import_row_warnings
guest_import_row_errors
guest_import_approval_events
```

The implementation must integrate with existing Sprint 3 guest tables and must not duplicate the guest identity model.

---

## 9. Recommended backend/API foundations

The agent may implement API routes, server actions, or service modules according to the existing app architecture.

Expected service capabilities:

- start import session;
- upload/receive CSV content;
- parse CSV rows;
- suggest column mappings;
- save column mappings;
- preview mapped rows;
- validate import rows;
- detect duplicates;
- submit import for review;
- list import sessions for a project;
- review import session;
- approve selected rows;
- reject selected rows;
- apply approved rows into guest records;
- write audit logs.

All backend operations must enforce permissions server-side.

---

## 10. Permission rules

Sprint 4 must enforce or prepare these permission rules.

### 10.1 Diginoces/admin

Can:

- import guests for any side;
- review bride/groom imports;
- approve imports;
- partially approve imports;
- reject imports;
- apply approved rows;
- view all import history;
- override missing WhatsApp for printed-only guests if valid.

### 10.2 Diginoces staff

Can act according to assigned project/event permissions.

Possible staff permissions:

- upload/import guest files;
- preview imports;
- review imports;
- approve/reject imports;
- view import history.

Staff should not automatically gain admin behavior unless the RBAC foundation grants it.

### 10.3 Bride

Can:

- upload/import bride-side guest file while list is unlocked;
- map columns;
- preview rows;
- submit bride-side import for review;
- view import status for own submitted imports.

Cannot:

- directly apply import rows into active guests if review is required;
- import groom-side guests;
- approve imports;
- override validation controls beyond allowed fields;
- access internal audit logs.

### 10.4 Groom

Can:

- upload/import groom-side guest file while list is unlocked;
- map columns;
- preview rows;
- submit groom-side import for review;
- view import status for own submitted imports.

Cannot:

- directly apply import rows into active guests if review is required;
- import bride-side guests;
- approve imports;
- override validation controls beyond allowed fields;
- access internal audit logs.

---

## 11. Testing expectations

Sprint 4 must add tests for the guest-import workflow.

At minimum, tests should cover:

- CSV rows are parsed correctly;
- blank rows are ignored or reported safely;
- column mapping maps source columns to target guest fields;
- validation catches missing display name;
- validation catches missing title/type;
- validation catches invalid side;
- printed-only row can pass without WhatsApp number;
- digital guest row without WhatsApp is warned or blocked according to validation design;
- duplicate detection catches same WhatsApp number inside imported rows;
- duplicate detection catches same normalized display name inside imported rows;
- duplicate detection checks existing project guests;
- bride/groom import stays staged and does not create active guests before approval;
- admin-approved rows create guest records;
- rejected rows do not create guest records;
- partial approval creates only approved guests;
- import actions produce audit entries or call the audit abstraction;
- unauthorized users cannot approve imports;
- out-of-scope modules are not introduced.

CI must continue to pass:

```text
npm ci
npm run format:check
npm run lint
npm run typecheck
npm run test
npm run build
```

If database linting requires Supabase authentication, keep it documented as a local/manual check unless CI secrets are explicitly configured.

---

## 12. Acceptance criteria

Sprint 4 is complete only when:

- CSV import foundation exists;
- import session staging exists;
- import row staging exists;
- column mapping exists;
- import preview exists;
- import validation exists;
- duplicate warning foundation exists;
- bride/groom imports require Diginoces/admin review;
- admin/staff review workflow exists;
- partial approval or row-level approval is supported;
- approved rows can create guest records;
- rejected rows do not create guest records;
- import history exists;
- permission checks prevent unauthorized import approval;
- audit logging exists for import actions;
- tests are added and pass;
- CI passes;
- documentation is updated;
- Sprint 4 completion report is created.

---

## 13. Required deliverables

The Sprint 4 PR must include:

- database migration(s) for guest import sessions/rows/mappings;
- TypeScript types updated/generated as needed;
- CSV parsing and mapping logic;
- import validation logic;
- duplicate detection integration;
- backend services, API routes, or server actions for import workflow;
- permission checks for import operations;
- audit integration for import actions;
- minimal UI for upload, mapping, preview, review, and history;
- tests for import workflow;
- documentation updates;
- `docs/planning/sprint-4-completion-report.md`.

---

## 14. Sprint 4 completion report template

The agent must create:

```text
docs/planning/sprint-4-completion-report.md
```

The report must include:

- sprint status;
- requirement IDs covered;
- backlog items covered;
- files created or changed;
- database migrations added;
- tests added;
- commands run;
- checks passed or failed;
- security checks performed;
- import validation behavior implemented;
- duplicate detection behavior implemented;
- audit-log behavior implemented;
- assumptions made;
- open issues or blockers;
- out-of-scope items intentionally deferred;
- recommended Sprint 5 scope.

---

## 15. Recommended Sprint 5 scope

Sprint 5 should handle:

- public guest page foundation;
- secure guest token foundation;
- RSVP Yes/No/Maybe;
- event-specific RSVP;
- RSVP deadlines;
- payment lock behavior for guest page access;
- admin preview of guest public pages;
- invitation download placeholder only;
- guest preferred language.

Sprint 5 should still not build invitation PDF generation, WhatsApp sending, seating, or check-in unless the approved roadmap changes.

---

## 16. Codex prompt for Sprint 4

Use this prompt when assigning Codex to Sprint 4:

```text
You are the Orchestrator Agent for the Diginoces platform.

Repository: carlkanda/diginoces-platform

Work only on Sprint 4: Guest Import & Approval Workflow.

Before coding, read AGENTS.md and the relevant documents:
- docs/planning/sprint-4-plan.md
- docs/planning/sprint-3-plan.md
- docs/planning/mvp-build-execution-plan.md
- docs/product/04-guest-management-guest-lists.md
- docs/product/03-wedding-project-structure.md
- docs/product/02-user-roles-permissions-access-control.md
- docs/technical-design/database-schema-core-entities.md
- docs/technical-design/api-backend-service-design.md
- docs/technical-design/security-permissions-access-control.md
- docs/backlog/master-requirements-register.csv
- docs/backlog/initial-product-backlog-epics.csv
- docs/backlog/initial-product-backlog-features.csv
- docs/backlog/initial-product-backlog-user-stories.csv
- docs/backlog/initial-product-backlog-tasks.csv
- docs/backlog/initial-product-backlog-test-cases.csv

Create a new branch:

codex/sprint-4-guest-import-approval

Implement Sprint 4 only.

Required scope:
1. Add guest import session foundation.
2. Add guest import row staging foundation.
3. Add import column mapping foundation.
4. Add CSV parsing support.
5. Add import preview workflow.
6. Add import validation workflow.
7. Add duplicate detection during import.
8. Add bride/groom submit-for-review workflow.
9. Add Diginoces/admin review workflow.
10. Add row-level approval/rejection or partial approval foundation.
11. Add apply-approved-rows workflow to create guest records.
12. Add import history.
13. Add backend permission checks for import operations.
14. Add audit logging for import actions.
15. Add basic UI routes/pages for upload, mapping, preview, review, and import history.
16. Add tests.
17. Update documentation.
18. Create docs/planning/sprint-4-completion-report.md.
19. Open a draft PR titled: Sprint 4 — Guest Import & Approval Workflow.

Out of scope:
- RSVP;
- public guest page;
- invitation generation;
- PDF generation;
- QR generation;
- WhatsApp;
- seating;
- check-in;
- contracts;
- pricing;
- payments;
- partner project creation;
- automatic duplicate merging.

The PR must reference the Sprint 4 issue.

Do not mark Sprint 4 complete unless tests/checks are documented.
```

---

## 17. Summary

Sprint 4 turns guest creation into a scalable import workflow.

It should let the couple or staff import lists safely without directly polluting the active guest database, while giving Diginoces/admin full control over review, approval, duplicates, validation, and auditability.

The expected result is a controlled import pipeline that prepares the project for RSVP and guest-facing workflows in Sprint 5.
