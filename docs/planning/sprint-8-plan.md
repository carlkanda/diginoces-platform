# Sprint 8 Plan — Tables, Seating & Print Materials

## 1. Sprint goal

Sprint 8 builds the **Tables, Seating & Print Materials** foundation for the Diginoces platform.

The goal is to let Diginoces, authorized staff, and the couple organize event-specific tables, assign guests to tables or seats, monitor capacity, and prepare print/export data for Canva workflows.

Sprint 8 must establish:

- event-specific table model;
- table capacity rules;
- table-level guest assignment;
- optional seat-level assignment foundation;
- mixed assignment-mode foundation;
- unassigned guest tracking;
- occupancy and over-capacity warnings;
- RSVP-aware seating behavior;
- VIP/protocol seating notes and highlights foundation;
- list/table seating UI foundation;
- visual seating-map placeholder or foundation;
- Canva CSV export foundation for table cards;
- printed invitation tracking foundation if not already covered;
- audit logging for table and seating changes.

Sprint 8 must not build check-in, QR scanning, WhatsApp sending, contracts, pricing, payments, or full reports/dashboard modules.

---

## 2. Source documents

Before coding, the agent must read and follow:

- `AGENTS.md`
- `docs/agent-system/00-ai-agent-build-system-governance.md`
- `docs/agent-system/agent-role-prompts.md`
- `docs/agent-system/agent-execution-workflow.md`
- `docs/planning/mvp-build-execution-plan.md`
- `docs/planning/sprint-7-plan.md`
- `docs/product/09-tables-seating-print-materials.md`
- `docs/product/04-guest-management-guest-lists.md`
- `docs/product/05-rsvp-public-guest-page.md`
- `docs/product/06-invitation-template-pdf-generation.md`
- `docs/product/08-check-in-wedding-day-operations.md`
- `docs/product/14-files-storage-retention-security.md`
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

Sprint 8 depends on Sprint 7 being merged into `main`.

Sprint 8 must assume these foundations already exist:

- secure platform foundation;
- project and event models;
- guest model;
- guest event assignment model;
- guest side model;
- RSVP foundation;
- invitation record/file foundation;
- communication/message foundation;
- app-owned storage abstraction;
- audit-log foundation;
- RBAC and permission foundations.

If any Sprint 7 dependency is missing, the agent must stop, report the blocker, and avoid creating workaround models that conflict with the planned architecture.

---

## 4. Backlog scope

Sprint 8 focuses on the **Tables, Seating & Print Materials** epic.

Primary epic:

- `EPIC-SEAT` — Tables, Seating & Print Materials

Primary features:

- `FEAT-SEAT-001` — Event-specific tables
- `FEAT-SEAT-002` — Table capacity model
- `FEAT-SEAT-003` — Guest-to-table assignment
- `FEAT-SEAT-004` — Seat-level assignment foundation
- `FEAT-SEAT-005` — Capacity and occupancy warnings
- `FEAT-SEAT-006` — RSVP-aware seating behavior
- `FEAT-SEAT-007` — VIP/protocol seating notes
- `FEAT-SEAT-008` — List/table seating UI foundation
- `FEAT-SEAT-009` — Visual seating-map foundation or placeholder
- `FEAT-SEAT-010` — Canva CSV export for table cards
- `FEAT-SEAT-011` — Printed invitation tracking foundation

If the exact feature IDs differ in the CSV backlog, the agent must use the matching backlog rows and document the actual IDs in the Sprint 8 completion report.

---

## 5. Requirement IDs covered

Sprint 8 should primarily cover or begin coverage for:

- `SEAT-001` — Tables and seating managed separately per event
- `SEAT-002` — Table-level, seat-level, and mixed assignment modes per event
- `SEAT-003` — Structured table records with ID, name, description, capacity, event, status, display order
- `SEAT-004` — Individual and bulk table creation
- `SEAT-005` — Occupancy calculation and full/over-capacity warnings
- `SEAT-006` — List/table view and visual drag-and-drop seating map foundation
- `SEAT-007` — Clearly show invited guests not assigned to a table
- `SEAT-008` — After invitations are sent, couple table changes become change requests
- `SEAT-009` — RSVP No excluded from active seating; Maybe remains included
- `SEAT-010` — VIP/protocol tags and special seating notes
- `SEAT-011` — Canva Bulk Create CSV for table cards
- `SEAT-012` — Printed invitation workflow statuses foundation
- `RSVP-010` — RSVP operational effect for seating
- `GM-010` — Household/family grouping awareness, if already implemented
- `GM-011` — Guest tags/categories
- `INV-014` — Data changes may mark invitations as needing regeneration
- `FILE-008` — Store Canva CSV exports with metadata/versioning
- `REP-006` — Audit logs for sensitive actions
- `TECH-004` — Backend permission enforcement

Sprint 8 may reference future requirements, but it must not implement future modules unless explicitly in scope.

---

## 6. In scope

Sprint 8 may implement the following.

### 6.1 Event-specific table model

Add database support for event-specific tables.

A table should record:

- project ID;
- event ID;
- table code or number;
- table name;
- description;
- capacity;
- display order;
- table status;
- assignment mode;
- notes;
- created_by;
- created_at and updated_at timestamps.

Tables must belong to one event.

A table created for one event must not be used for another event unless explicitly copied through a future workflow.

### 6.2 Table assignment modes

Sprint 8 should support or prepare these modes:

```text
table_level
seat_level
mixed
```

Minimum acceptable Sprint 8 implementation:

- table-level assignment fully functional;
- seat-level assignment structurally prepared;
- mixed mode structurally prepared or documented as follow-up.

### 6.3 Seat model foundation

If seat-level assignment is included, a seat should record:

- table ID;
- seat number or label;
- status;
- optional coordinates for future visual map;
- assigned guest ID, if used directly;
- created_at and updated_at timestamps.

If seat-level assignment is not fully implemented, the schema should not block future addition.

### 6.4 Guest-to-table assignment

Guests invited to an event should be assignable to a table for that event.

Assignment rules:

- guest must belong to the same project;
- guest must be assigned/invited to the event;
- table must belong to the same event;
- RSVP No guests should not count toward active occupancy;
- RSVP Maybe guests should remain included;
- printed-only guests can be assigned like any other guest;
- Couple title/type or guest count should be included in occupancy calculation.

### 6.5 Occupancy and capacity rules

The system should calculate:

- table capacity;
- assigned guest units;
- active occupancy;
- remaining seats/places;
- over-capacity count;
- unassigned guest count.

Guest count should use title/type count where available.

Examples:

- Mr. = 1
- Mme. = 1
- Mlle. = 1
- Couple = 2
- custom title/type = configured default count if available

If a guest count cannot be resolved, the system should fail safely and report a warning rather than silently ignoring the guest.

### 6.6 RSVP-aware seating

Sprint 8 should integrate RSVP operational effects.

Rules:

- RSVP Yes = included in active seating count;
- RSVP Maybe = included in active seating count;
- RSVP Pending = included or reviewable depending on deadline state;
- RSVP No = excluded from active seating count but not necessarily deleted from assignment history.

The implementation should not delete assignments automatically unless explicitly designed and audited.

### 6.7 Unassigned guest tracking

The app should clearly show guests invited to an event who are not assigned to a table.

Unassigned guest filters should support:

- all unassigned guests;
- bride-side unassigned;
- groom-side unassigned;
- VIP/protocol unassigned;
- RSVP status filters;
- printed-only/digital filter if already available.

### 6.8 Table creation and bulk table creation

Sprint 8 should support:

- creating a single table;
- editing a table;
- deleting/archiving a table if no unsafe assignments exist;
- optionally bulk-create tables from a count and capacity pattern.

Bulk creation example:

```text
Create tables 1 to 30, capacity 10 each.
```

Bulk creation must be auditable.

### 6.9 VIP/protocol seating foundation

VIP/protocol guests should support:

- VIP/protocol tag awareness;
- special table/seat note;
- visual highlight in seating views;
- later check-in highlight compatibility.

Sprint 8 should prepare the data and UI foundation. The actual check-in screen highlight belongs to Sprint 9.

### 6.10 Table locking and change request foundation

After invitations are sent, couple table changes should not directly change assignments.

Sprint 8 should prepare or enforce:

- unlocked seating stage: allowed users can edit assignments;
- post-invitation stage: couple changes become requests or controlled staff actions;
- staff/admin can still update assignments with audit logging.

If full change request workflow is not ready, document the placeholder clearly.

### 6.11 Invitation regeneration awareness

Changing table assignments may affect invitations if table data appears on the invitation template.

Sprint 8 should prepare logic to:

- detect when a table assignment change affects an already generated invitation;
- mark the invitation as `needs_regeneration` if appropriate;
- record audit context.

Do not regenerate PDFs automatically in Sprint 8 unless the existing Sprint 6 regeneration service is safe and documented.

### 6.12 Print materials and Canva CSV export

Sprint 8 should support generating CSV exports for Canva Bulk Create table-card workflows.

Table-card CSV fields may include:

- project code;
- event name;
- event date;
- couple names;
- table code;
- table name;
- table description;
- capacity;
- assigned guest count;
- guest display names if needed;
- VIP/protocol marker if needed.

The export should be stored or registered in the app-owned file/storage foundation if available.

### 6.13 Printed invitation tracking foundation

If not already covered, Sprint 8 may prepare basic printed invitation workflow statuses.

Possible statuses:

```text
not_required
pending_print
ready_for_print
printed
delivered
cancelled
```

This should remain a foundation only. Do not build full print partner workflow in Sprint 8.

### 6.14 Basic UI

Add basic UI for:

- event table list;
- create/edit table;
- table occupancy display;
- unassigned guest list;
- assign guest to table;
- remove guest from table;
- filter by side/RSVP/tag;
- VIP/protocol highlight;
- export table-card CSV;
- seating change warnings.

Keep UI simple and operational.

Sprint 8 is not the final visual seating-map polish sprint.

### 6.15 Visual seating-map foundation

A visual seating-map foundation may be included if low-risk.

Minimum acceptable foundation:

- placeholder route/page;
- data model prepared for table position/ordering;
- simple drag/reorder only if safe;
- clear follow-up note for advanced map behavior.

Do not let visual map work delay the core list/table seating foundation.

### 6.16 Audit logging

Table/seating actions that should be audited include:

- table created;
- table updated;
- table archived/deleted;
- bulk tables created;
- guest assigned to table;
- guest removed from table;
- guest moved from one table to another;
- table capacity changed;
- table export generated;
- invitation marked needs regeneration due to seating change;
- seating locked/unlocked, if implemented.

Audit logs must not be exposed to guests.

---

## 7. Out of scope

Do not implement the following in Sprint 8:

- check-in scan flow;
- check-in dashboard;
- check-in QR processing;
- WhatsApp sending;
- welcome/table message final workflow;
- contracts;
- pricing;
- payments;
- partner project creation;
- full print partner access model;
- full guest-book workflow;
- full reports/dashboard module;
- advanced drag-and-drop seating map if it delays core functionality;
- automatic PDF regeneration unless already safe and explicitly limited;
- table-card PDF design generation inside the app;
- direct Canva API integration.

If a future dependency is discovered, document it as a follow-up. Do not build it silently.

---

## 8. Recommended database objects

The agent may choose final names based on existing conventions, but the following objects are expected conceptually:

```text
event_tables
event_table_seats
guest_table_assignments
seating_export_jobs
seating_export_files
```

Optional, if useful and low-risk:

```text
seating_change_requests
seating_status_events
table_card_export_rows
```

The implementation must integrate with existing project, event, guest, guest event assignment, RSVP, invitation, file, permission, and audit foundations.

Do not create check-in, contract, pricing, payment, or partner domain tables in Sprint 8.

---

## 9. Recommended backend/API foundations

The agent may implement API routes, server actions, or service modules according to the existing app architecture.

Expected service capabilities:

- create table;
- update table;
- archive/delete table safely;
- bulk create tables;
- list tables for event;
- calculate table occupancy;
- list unassigned guests for event;
- assign guest to table;
- remove guest from table;
- move guest between tables;
- validate assignment compatibility;
- detect over-capacity;
- filter seating by side/RSVP/tag;
- generate table-card CSV export;
- register export file;
- mark invitations as needing regeneration when seating data affects generated invitations;
- write audit logs.

All backend operations must enforce permissions server-side.

---

## 10. Permission rules

Sprint 8 must enforce or prepare these permission rules.

### 10.1 Diginoces/admin

Can:

- create/edit/archive tables;
- bulk create tables;
- assign any guest to any table in the project event;
- override capacity warnings with reason if implemented;
- generate table-card CSV exports;
- view seating audit history if allowed;
- lock/unlock seating if implemented.

### 10.2 Diginoces staff

Can act according to assigned project/event permissions.

Possible staff permissions:

- view event seating;
- create/edit tables;
- assign guests to tables;
- export table-card CSV;
- view unassigned guests;
- manage VIP/protocol seating notes.

Staff should not automatically override locked seating or capacity warnings unless the RBAC foundation grants it.

### 10.3 Bride

Can:

- view event seating for the project, if allowed;
- assign bride-side guests while seating/list is unlocked;
- view groom-side seating if allowed by project rules;
- submit seating change request after lock if implemented.

Cannot:

- directly edit groom-side guest assignments;
- override locked seating;
- export internal-only files unless allowed;
- access internal audit logs.

### 10.4 Groom

Can:

- view event seating for the project, if allowed;
- assign groom-side guests while seating/list is unlocked;
- view bride-side seating if allowed by project rules;
- submit seating change request after lock if implemented.

Cannot:

- directly edit bride-side guest assignments;
- override locked seating;
- export internal-only files unless allowed;
- access internal audit logs.

### 10.5 Guest

Guests do not access seating management in Sprint 8.

Guest-facing table display belongs to the public guest page/invitation/check-in flows and must remain controlled by release settings.

---

## 11. Testing expectations

Sprint 8 must add tests for tables, seating, and print export foundations.

At minimum, tests should cover:

- table can be created for an event;
- table cannot belong to a different project/event than its guests;
- table capacity must be positive;
- guest invited to event can be assigned to a table for that event;
- guest not invited to event cannot be assigned to that event table;
- RSVP No guest is excluded from active occupancy;
- RSVP Maybe guest remains included in active occupancy;
- Couple/default count contributes correctly to occupancy;
- over-capacity warning is produced;
- unassigned guest list is accurate;
- bride/groom side assignment restrictions are enforced or represented in permission tests;
- VIP/protocol guest marker is preserved in seating view/export;
- table-card CSV export includes expected columns;
- seating change can mark invitation as needs_regeneration when required;
- seating actions produce audit entries or call audit abstraction;
- unauthorized users cannot assign guests to tables;
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

Sprint 8 is complete only when:

- event-specific table model exists;
- table creation and editing foundation exists;
- bulk table creation foundation exists or documented placeholder exists;
- guest-to-table assignment foundation exists;
- table occupancy calculation exists;
- capacity warnings exist;
- RSVP-aware seating behavior exists;
- unassigned guest tracking exists;
- VIP/protocol seating foundation exists;
- list/table seating UI foundation exists;
- visual seating-map foundation or documented placeholder exists;
- table-card Canva CSV export foundation exists;
- export files are registered/stored if storage foundation supports it;
- invitation regeneration awareness exists for table data changes;
- permission checks prevent unauthorized seating changes;
- audit logging exists for table/seating/export actions;
- tests are added and pass;
- CI passes;
- documentation is updated;
- Sprint 8 completion report is created.

---

## 13. Required deliverables

The Sprint 8 PR must include:

- database migration(s) for event tables, optional seats, assignments, and export records;
- TypeScript types updated/generated as needed;
- table creation/edit/list logic;
- guest-to-table assignment logic;
- occupancy/capacity calculation logic;
- RSVP-aware seating logic;
- unassigned guest query/helper;
- VIP/protocol seating foundation;
- table-card CSV export logic;
- invitation regeneration awareness logic;
- permission checks for seating operations;
- audit integration for table/seating/export actions;
- minimal UI for table list, seating assignment, unassigned guests, and export;
- tests for seating foundation;
- documentation updates;
- `docs/planning/sprint-8-completion-report.md`.

---

## 14. Sprint 8 completion report template

The agent must create:

```text
docs/planning/sprint-8-completion-report.md
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
- table/seating behavior implemented;
- occupancy/capacity behavior implemented;
- RSVP-aware seating behavior implemented;
- export behavior implemented;
- audit-log behavior implemented;
- assumptions made;
- open issues or blockers;
- out-of-scope items intentionally deferred;
- recommended Sprint 9 scope.

---

## 15. Recommended Sprint 9 scope

Sprint 9 should handle:

- staff-only check-in;
- QR scan flow;
- manual search check-in;
- Couple partial arrivals;
- printed-only manual check-in;
- unexpected guest request workflow;
- offline preload/sync foundation;
- check-in dashboard;
- VIP/protocol highlight at check-in;
- welcome/table message integration placeholder.

Sprint 9 should not build contracts, pricing, payments, or partner project creation unless the approved roadmap changes.

---

## 16. Codex prompt for Sprint 8

Use this prompt when assigning Codex to Sprint 8:

```text
You are the Orchestrator Agent for the Diginoces platform.

Repository: carlkanda/diginoces-platform

Work only on Sprint 8: Tables, Seating & Print Materials.

Before coding, read AGENTS.md and the relevant documents:
- docs/planning/sprint-8-plan.md
- docs/planning/sprint-7-plan.md
- docs/planning/mvp-build-execution-plan.md
- docs/product/09-tables-seating-print-materials.md
- docs/product/04-guest-management-guest-lists.md
- docs/product/05-rsvp-public-guest-page.md
- docs/product/06-invitation-template-pdf-generation.md
- docs/product/08-check-in-wedding-day-operations.md
- docs/product/14-files-storage-retention-security.md
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

codex/sprint-8-tables-seating-print-materials

Implement Sprint 8 only.

Required scope:
1. Add event-specific table model.
2. Add table capacity and occupancy foundation.
3. Add table-level guest assignment foundation.
4. Add seat-level/mixed mode structural foundation if safe.
5. Add unassigned guest tracking.
6. Add RSVP-aware seating behavior.
7. Add VIP/protocol seating foundation.
8. Add list/table seating UI foundation.
9. Add visual seating-map placeholder or foundation.
10. Add table-card Canva CSV export foundation.
11. Add printed invitation tracking foundation if not already covered.
12. Add invitation regeneration awareness for table data changes.
13. Add permission checks for table/seating operations.
14. Add audit logging for table/seating/export actions.
15. Add tests.
16. Update documentation.
17. Create docs/planning/sprint-8-completion-report.md.
18. Open a draft PR titled: Sprint 8 — Tables, Seating & Print Materials.

Out of scope:
- check-in;
- WhatsApp sending;
- contracts;
- pricing;
- payments;
- partner project creation;
- full print partner workflow;
- direct Canva API integration;
- automatic PDF regeneration unless already safe and explicitly limited.

The PR must reference the Sprint 8 issue.

Do not mark Sprint 8 complete unless tests/checks are documented.
```

---

## 17. Summary

Sprint 8 turns the guest, RSVP, invitation, and communication foundations into a structured seating and print-preparation workflow.

It should let Diginoces organize tables per event, assign guests safely, track capacity, prepare table-card CSV exports for Canva, and maintain traceability through permissions and audit logs.

The expected result is a reliable seating foundation that prepares the platform for check-in and wedding-day operations in Sprint 9.
