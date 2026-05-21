# Sprint 3 Plan — Guest Management & Guest Lists Foundation

## 1. Sprint goal

Sprint 3 builds the first real operational business module of the Diginoces platform: **Guest Management & Guest Lists**.

The goal is to replace the spreadsheet-based guest-list foundation with an in-app, permission-aware, project-level guest management system that supports:

- one master guest database per wedding project;
- separate bride-side and groom-side working lists;
- guest creation and editing while lists are unlocked;
- event assignment foundation;
- guest title/type foundation;
- guest tags/categories foundation;
- duplicate-detection foundation;
- validation rules for later invitation, RSVP, seating, and check-in workflows;
- audit logging for sensitive guest data changes.

Sprint 3 must build the **guest-management foundation only**. It must not build full CSV/Excel import, RSVP, invitation generation, WhatsApp sending, seating, check-in, contracts, pricing, payments, or guest public pages.

---

## 2. Source documents

Before coding, the agent must read and follow:

- `AGENTS.md`
- `docs/agent-system/00-ai-agent-build-system-governance.md`
- `docs/agent-system/agent-role-prompts.md`
- `docs/agent-system/agent-execution-workflow.md`
- `docs/planning/mvp-build-execution-plan.md`
- `docs/planning/sprint-2-plan.md`
- `docs/product/03-wedding-project-structure.md`
- `docs/product/04-guest-management-guest-lists.md`
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

Sprint 3 depends on Sprint 2 being merged into `main`.

Sprint 3 must assume these foundations already exist:

- authenticated app shell;
- RBAC foundation;
- audit-log foundation;
- project model;
- event model;
- project membership model;
- event membership model;
- project and event permission foundation;
- project and event audit logging.

If any Sprint 2 dependency is missing, the agent must stop, report the blocker, and avoid creating workaround business logic that breaks the planned architecture.

---

## 4. Backlog scope

Sprint 3 focuses on the **Guest Management** epic.

Primary epic:

- `EPIC-GM` — Guest Management & Guest Lists

Primary features:

- `FEAT-GM-001` — Master guest database
- `FEAT-GM-002` — Bride/groom guest lists
- `FEAT-GM-003` — Manual guest creation and editing
- `FEAT-GM-004` — Guest title/type foundation
- `FEAT-GM-005` — Guest tags/categories foundation
- `FEAT-GM-006` — Event assignment foundation
- `FEAT-GM-007` — Duplicate detection foundation
- `FEAT-GM-008` — Guest validation foundation

If the exact feature IDs differ in the CSV backlog, the agent must preserve the meaning and reference the actual matching backlog rows in the Sprint 3 completion report.

---

## 5. Requirement IDs covered

Sprint 3 should primarily cover or begin coverage for:

- `GM-001` — Master guest database per wedding project
- `GM-002` — Separate bride and groom working lists
- `GM-003` — Manual guest entry
- `GM-006` — Required field validation before key workflows
- `GM-007` — Guest title/type foundation with count safeguards
- `GM-008` — Duplicate detection foundation
- `GM-009` — Guest can belong to both sides while counted once
- `GM-011` — Guest tags/categories foundation
- `GM-013` — List locking foundation
- `GM-014` — Change request foundation placeholder only
- `GM-015` — Printed-only guest flag foundation only
- `PROJ-005` — Master guest database linked to project/event assignment model
- `ROLE-005` — Bride/groom own-side editing and partner-side view rules
- `ROLE-001` — Role-based permission model
- `REP-006` — Audit logs for sensitive actions
- `TECH-004` — Backend permission enforcement

Sprint 3 may reference future requirements, but it must not fully implement future modules unless explicitly in scope.

---

## 6. In scope

Sprint 3 may implement the following.

### 6.1 Database model

Add database support for:

- project-level guests;
- guest sides: bride, groom, both;
- guest title/type records;
- guest tags/categories;
- guest-to-tag relationship;
- guest event assignment foundation;
- guest status or active/inactive flag;
- printed-only flag;
- guest validation state or validation helper fields where appropriate;
- indexes and constraints needed for safe guest lookups.

The database model must maintain the rule:

```text
A guest exists once at project level and can be assigned to one or more events.
```

### 6.2 Guest identity fields

Guest records should support foundation fields such as:

- project ID;
- display name;
- title/type ID;
- side: bride, groom, or both;
- WhatsApp number, optional at this stage;
- preferred language, if useful now;
- printed-only flag;
- active/inactive status;
- notes or internal note reference if already supported;
- created by;
- updated by;
- timestamps.

Do not add sensitive personal data beyond what is required for Sprint 3.

### 6.3 Guest title/type foundation

Implement a foundation for guest title/types such as:

- Mr.;
- Mme.;
- Mlle.;
- Couple.

Each title/type should support a default guest count.

Count-changing or custom title/type rules may be left as guarded placeholders if full admin customization is not yet ready.

### 6.4 Bride/groom list separation

The app must support the working-list concept:

- bride-side list;
- groom-side list;
- both-sides guests;
- master/merged internal view.

Bride/groom permission behavior:

- bride may edit bride-side guests while the list is unlocked;
- groom may edit groom-side guests while the list is unlocked;
- each can view the partner side;
- neither can edit the partner side directly;
- Diginoces/admin can manage all sides.

If real bride/groom users are not fully implemented yet, the backend permission structure and tests must still prepare for these rules.

### 6.5 Manual guest creation and editing

Implement foundation endpoints/server actions/UI flows for:

- creating a guest inside a project;
- reading a project guest list;
- updating allowed guest fields;
- deactivating or soft-deleting a guest if needed;
- filtering by side;
- filtering by event assignment if event assignment is implemented.

### 6.6 Event assignment foundation

Guests should be assignable to one or more events inside the same wedding project.

Event assignment may include foundation fields such as:

- guest ID;
- event ID;
- invited flag;
- assignment status;
- created by;
- timestamps.

Do not implement RSVP, invitation status, table assignment, or check-in status in Sprint 3 except as documented future placeholders if absolutely needed.

### 6.7 Tags/categories foundation

Implement a simple tag/category foundation:

- tags belong to a project;
- tags can be attached to guests;
- internal-only tag support may be added if permission foundation is ready;
- default examples can include family, friends, colleagues, VIP, protocol, printed invitation, digital invitation, child, special attention, follow-up needed.

### 6.8 Duplicate detection foundation

Implement basic duplicate detection signals, such as:

- exact WhatsApp number match inside the same project;
- normalized display name match inside the same project;
- same title/type plus same normalized display name;
- potential bride/groom overlap.

Sprint 3 should not automatically merge duplicates.

It should provide either:

- a duplicate warning API/helper; or
- a duplicate review placeholder; or
- tests around duplicate candidate detection.

### 6.9 Guest validation foundation

Add foundation validation rules for later workflows.

Examples:

- display name required;
- side required;
- title/type required;
- event assignment may be required before invitation workflows;
- WhatsApp number required only for digital invitation later;
- printed-only guests can have missing WhatsApp number later with admin override.

Sprint 3 should not build invitation generation, but it should prepare validation helpers that later modules can reuse.

### 6.10 Audit logging

Guest-related sensitive actions must write audit logs or call the audit abstraction prepared in Sprint 1.

Audit actions should include:

- guest created;
- guest updated;
- guest deactivated/deleted;
- guest side changed;
- guest event assignment changed;
- tag assigned/removed;
- title/type changed;
- duplicate review action if implemented.

### 6.11 Basic UI

Add basic internal/couple-facing UI foundations where appropriate:

- project guest list page;
- bride-side filter/view;
- groom-side filter/view;
- master/merged view for authorized internal users;
- add guest form;
- edit guest form or detail view;
- basic validation messages.

Keep the UI simple. Sprint 3 is a business foundation sprint, not final UX polish.

---

## 7. Out of scope

Do not implement the following in Sprint 3:

- CSV/Excel import workflow;
- column mapping;
- import approval workflow;
- full duplicate merge workflow;
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
- post-event written-message workflow;
- advanced AI cleanup;
- full household/family management if it requires separate member invitation logic.

If a future dependency is discovered, document it as a follow-up. Do not build it silently.

---

## 8. Recommended database objects

The agent may choose the final names based on existing conventions, but the following objects are expected conceptually:

```text
guest_title_types
guests
guest_event_assignments
guest_tags
guest_tag_assignments
```

Optional, if useful and low-risk:

```text
guest_duplicate_candidates
guest_validation_results
```

Do not create RSVP, invitation, seating, check-in, contract, payment, or WhatsApp domain tables in Sprint 3.

---

## 9. Recommended backend/API foundations

The agent may implement API routes, server actions, or service modules according to the existing app architecture.

Expected service capabilities:

- create guest;
- update guest;
- list project guests;
- get guest detail;
- assign guest to event;
- list guests by side;
- list guests by event;
- validate guest record;
- detect duplicate candidates;
- assign/remove tags;
- enforce project membership/permissions;
- write audit log entries.

All backend operations must enforce permissions server-side.

---

## 10. Permission rules

Sprint 3 must prepare or enforce these permission rules:

### 10.1 Diginoces/admin

Can:

- view all project guests;
- create guests on any side;
- edit guests on any side;
- assign guests to events;
- manage tags/title types if implemented;
- view duplicate warnings;
- override validation warnings only if an explicit placeholder is designed.

### 10.2 Diginoces staff

Can act according to assigned project/event permissions.

At minimum, staff should not automatically gain full admin behavior unless the RBAC foundation grants it.

### 10.3 Bride

Can:

- view bride-side guests;
- create/edit bride-side guests while unlocked;
- view groom-side guests;
- submit change-request placeholder after lock if implemented.

Cannot:

- directly edit groom-side guests;
- change pricing/payment/contract data;
- access internal audit logs.

### 10.4 Groom

Can:

- view groom-side guests;
- create/edit groom-side guests while unlocked;
- view bride-side guests;
- submit change-request placeholder after lock if implemented.

Cannot:

- directly edit bride-side guests;
- change pricing/payment/contract data;
- access internal audit logs.

---

## 11. Testing expectations

Sprint 3 must add tests for the guest-management foundation.

At minimum, tests should cover:

- guest can be created for a project;
- guest belongs to exactly one project;
- guest side can be bride, groom, or both;
- bride/groom side edit restrictions are enforced or represented in permission tests;
- event assignment belongs to the same project as the guest;
- duplicate detection catches same WhatsApp or normalized display name;
- validation catches missing required fields;
- printed-only guest can exist without WhatsApp number at foundation level;
- guest changes produce audit entries or call the audit abstraction;
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

Sprint 3 is complete only when:

- project-level guest database foundation exists;
- guests are linked to wedding projects;
- guest side separation is implemented or structurally prepared;
- manual guest creation foundation exists;
- manual guest update foundation exists;
- title/type foundation exists;
- tag/category foundation exists;
- event assignment foundation exists;
- duplicate detection foundation exists;
- guest validation foundation exists;
- permission checks prevent unauthorized guest changes;
- audit logging exists for guest changes;
- tests are added and pass;
- CI passes;
- documentation is updated;
- Sprint 3 completion report is created.

---

## 13. Required deliverables

The Sprint 3 PR must include:

- database migration(s) for guest-management foundation;
- TypeScript types updated/generated as needed;
- backend services, API routes, or server actions for guest foundation;
- permission checks for guest operations;
- audit integration for guest operations;
- minimal UI for guest list and guest creation/editing foundation;
- tests for guest foundation;
- documentation updates;
- `docs/planning/sprint-3-completion-report.md`.

---

## 14. Sprint 3 completion report template

The agent must create:

```text
docs/planning/sprint-3-completion-report.md
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
- audit-log behavior implemented;
- assumptions made;
- open issues or blockers;
- out-of-scope items intentionally deferred;
- recommended Sprint 4 scope.

---

## 15. Recommended Sprint 4 scope

Sprint 4 should handle:

- CSV/Excel guest import;
- import preview;
- column mapping;
- import validation;
- duplicate warnings during import;
- Diginoces/admin import approval;
- import history and audit logs.

Sprint 4 should still not build RSVP, invitations, WhatsApp, seating, or check-in unless the approved roadmap changes.

---

## 16. Codex prompt for Sprint 3

Use this prompt when assigning Codex to Sprint 3:

```text
You are the Orchestrator Agent for the Diginoces platform.

Repository: carlkanda/diginoces-platform

Work only on Sprint 3: Guest Management & Guest Lists Foundation.

Before coding, read AGENTS.md and the relevant documents:
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

codex/sprint-3-guest-management-foundation

Implement Sprint 3 only.

Required scope:
1. Add project-level guest database foundation.
2. Add guest title/type foundation.
3. Add guest tag/category foundation.
4. Add bride/groom/both guest side foundation.
5. Add guest event assignment foundation.
6. Add manual guest creation foundation.
7. Add manual guest update foundation.
8. Add guest list filtering by side and event.
9. Add duplicate detection foundation.
10. Add guest validation foundation.
11. Add backend permission checks for guest operations.
12. Add audit logging for guest changes.
13. Add basic UI routes/pages for guest list and guest create/edit foundation.
14. Add tests.
15. Update documentation.
16. Create docs/planning/sprint-3-completion-report.md.
17. Open a draft PR titled: Sprint 3 — Guest Management & Guest Lists Foundation.

Out of scope:
- CSV/Excel import;
- full duplicate merge workflow;
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
- partner project creation.

The PR must reference the Sprint 3 issue.

Do not mark Sprint 3 complete unless tests/checks are documented.
```

---

## 17. Summary

Sprint 3 creates the guest-management foundation that future workflows depend on.

It should deliver the first usable guest-list module while staying disciplined: no imports yet, no RSVP yet, no invitations yet, no seating yet, and no check-in yet.

The expected result is a secure, auditable, project-linked guest-management base that can support import workflows in Sprint 4 and guest-facing workflows in later sprints.
