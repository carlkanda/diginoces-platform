# Sprint 6 Plan — Invitation Template & PDF Generation

## 1. Sprint goal

Sprint 6 builds the **Invitation Template & PDF Generation** foundation for the Diginoces platform.

The goal is to let Diginoces upload Canva-exported PDF invitation templates, configure dynamic fields, generate safe technical previews, create secure invitation records, prepare QR/link foundations, and generate personalized invitation PDFs in a controlled, auditable, background-job-ready workflow.

Sprint 6 must establish:

- Canva-exported PDF template upload foundation;
- event-level invitation template management;
- dynamic field configuration foundation;
- visual/template coordinate model foundation;
- preview/staging workflow;
- public guest page QR/link separation from future check-in QR/link;
- invitation record model;
- invitation file/version foundation;
- generation validation based on guest/event/template data;
- batch generation job foundation;
- basic PDF generation implementation or clearly isolated PDF worker abstraction;
- admin/staff preview approval before full generation;
- audit logging for template and invitation-generation actions.

Sprint 6 must not build WhatsApp sending, seating/table assignment, check-in, contracts, pricing, payments, or full public guest-page redesign.

---

## 2. Source documents

Before coding, the agent must read and follow:

- `AGENTS.md`
- `docs/agent-system/00-ai-agent-build-system-governance.md`
- `docs/agent-system/agent-role-prompts.md`
- `docs/agent-system/agent-execution-workflow.md`
- `docs/planning/mvp-build-execution-plan.md`
- `docs/planning/sprint-5-plan.md`
- `docs/product/06-invitation-template-pdf-generation.md`
- `docs/product/05-rsvp-public-guest-page.md`
- `docs/product/04-guest-management-guest-lists.md`
- `docs/product/03-wedding-project-structure.md`
- `docs/product/14-files-storage-retention-security.md`
- `docs/technical-design/database-schema-core-entities.md`
- `docs/technical-design/api-backend-service-design.md`
- `docs/technical-design/background-jobs-pdf-qr-whatsapp-offline-checkin.md`
- `docs/technical-design/security-permissions-access-control.md`
- `docs/backlog/master-requirements-register.csv`
- `docs/backlog/initial-product-backlog-epics.csv`
- `docs/backlog/initial-product-backlog-features.csv`
- `docs/backlog/initial-product-backlog-user-stories.csv`
- `docs/backlog/initial-product-backlog-tasks.csv`
- `docs/backlog/initial-product-backlog-test-cases.csv`

---

## 3. Sprint dependency

Sprint 6 depends on Sprint 5 being merged into `main`.

Sprint 6 must assume these foundations already exist:

- secure platform foundation;
- project and event models;
- guest model;
- guest event assignment model;
- guest validation foundation;
- public guest token foundation;
- RSVP/event invitation eligibility foundation;
- app-owned storage abstraction;
- audit-log foundation;
- RBAC and permission foundations.

If any Sprint 5 dependency is missing, the agent must stop, report the blocker, and avoid creating workaround models that conflict with the planned architecture.

---

## 4. Backlog scope

Sprint 6 focuses on the **Invitation Template & PDF Generation** epic.

Primary epic:

- `EPIC-INV` — Invitation Template & PDF Generation

Primary features:

- `FEAT-INV-001` — Canva PDF template upload
- `FEAT-INV-002` — Event-level invitation template management
- `FEAT-INV-003` — Dynamic field placement/configuration foundation
- `FEAT-INV-004` — Technical preview/staging workflow
- `FEAT-INV-005` — Guest invitation record model
- `FEAT-INV-006` — Invitation file/version foundation
- `FEAT-INV-007` — QR/link token separation foundation
- `FEAT-INV-008` — Generation validation workflow
- `FEAT-INV-009` — Batch generation job foundation
- `FEAT-INV-010` — Personalized PDF generation foundation

If the exact feature IDs differ in the CSV backlog, the agent must use the matching backlog rows and document the actual IDs in the Sprint 6 completion report.

---

## 5. Requirement IDs covered

Sprint 6 should primarily cover or begin coverage for:

- `INV-001` — Canva remains the design tool; app imports Canva-exported PDF templates
- `INV-002` — Invitation templates managed at event level
- `INV-003` — Diginoces/admin can upload Canva PDF templates and track template status
- `INV-004` — Visual drag-and-drop editor or field placement foundation
- `INV-005` — Dynamic guest/table/QR/event/couple/invitation fields
- `INV-006` — Smart text fitting for long names and titles
- `INV-007` — Public guest page QR and check-in QR remain separate
- `INV-008` — Secure QR/token foundation using short secure tokens
- `INV-009` — Full generation blocked until technical preview approval
- `INV-010` — Manual design approval record, if low-risk
- `INV-011` — Generation by event, selected guests, table/status/all foundation
- `INV-012` — Block generation for guests missing required/conditional data
- `INV-013` — Invitation statuses foundation
- `INV-014` — Relevant data changes mark invitations as needing regeneration foundation
- `INV-015` — Version history; guests see latest active version
- `TECH-006` — PDF generation should run in background worker or dedicated service
- `FILE-001` — App-owned storage
- `FILE-004` — Guest-specific files linked to guest/event/invitation/version/active status
- `FILE-005` — Version history with active/latest marker
- `FILE-006` — Secure guest-facing downloads
- `REP-006` — Audit logs for sensitive actions
- `TECH-010` — Public guest tokens and check-in tokens separate and revocable

Sprint 6 may reference future requirements, but it must not implement future modules unless explicitly in scope.

---

## 6. In scope

Sprint 6 may implement the following.

### 6.1 Invitation template model

Add database support for invitation templates.

An invitation template should record:

- project ID;
- event ID;
- template name;
- source file ID or storage reference;
- template status;
- uploaded by;
- uploaded_at timestamp;
- design approval status, if implemented;
- technical preview approval status;
- approved by;
- approved_at timestamp;
- active/inactive status;
- version number;
- metadata such as page count if available.

Recommended statuses:

```text
draft
uploaded
configured
preview_generated
technical_preview_approved
active
archived
failed
```

The exact enum names may follow existing conventions.

### 6.2 Template upload foundation

Diginoces/admin or authorized staff should be able to upload a Canva-exported PDF template.

Minimum rules:

- PDF only for Sprint 6;
- validate file type;
- validate file size according to a safe configured limit;
- store file using app-owned storage abstraction;
- register file metadata;
- associate template with one event;
- audit upload action.

The app must not depend on Canva API in Sprint 6.

### 6.3 Event-level template management

Invitation templates must be managed at event level.

Rules:

- one project can have multiple events;
- each event can have its own invitation template;
- each event may have one active template at a time;
- older templates should be archived or inactive;
- generation uses the active approved template for the selected event.

### 6.4 Dynamic field configuration foundation

Implement a data model for dynamic fields on a PDF template.

Dynamic field configuration should support:

- field key;
- field type: text, QR/image, date, table info, custom;
- PDF page number;
- x/y position;
- width and height;
- font settings for text fields;
- color;
- alignment;
- max font size/min font size;
- text fitting behavior;
- QR/image placement behavior;
- required/optional flag.

Dynamic field examples:

```text
guest.title
guest.display_name
guest.full_invitation_name
event.name
event.date
event.venue
couple.names
table.name
table.code
public_guest_page_qr
invitation.id
```

Sprint 6 may implement a simple coordinate-based editor before a full drag-and-drop visual editor, but the data model must support visual editing later.

### 6.5 Visual editor foundation

The complete drag-and-drop editor may be basic in Sprint 6.

Acceptable Sprint 6 foundation:

- show uploaded template preview if practical;
- allow adding/editing field configurations;
- allow page, x, y, width, height, font, size, and alignment fields;
- allow sample guest preview generation;
- persist the template field configuration.

If true drag-and-drop is too large, document it as a follow-up while preserving the coordinate model needed for it.

### 6.6 Technical preview workflow

Full invitation generation must be blocked until Diginoces/admin approves a technical preview.

Preview should support sample guests such as:

- short name;
- long name;
- Couple title/type;
- printed-only guest;
- guest with missing optional data;
- guest with public page QR/link.

Preview must check:

- text placement;
- field availability;
- QR placement;
- PDF output generation;
- file size reasonableness;
- no missing required data for sample generation.

Approval must record:

- approver;
- timestamp;
- template version;
- preview file/version;
- audit entry.

### 6.7 Invitation record model

Add invitation records linked to:

- project;
- event;
- guest;
- guest event assignment;
- template;
- invitation ID/code;
- status;
- latest active file ID;
- generation job ID, if implemented;
- version count;
- created_at/updated_at timestamps.

Recommended statuses:

```text
not_generated
preview_generated
generated
needs_regeneration
sent
resent
failed
cancelled
printed_only
```

Sprint 6 should not implement WhatsApp sending, but it can prepare statuses that later WhatsApp workflows use.

### 6.8 Secure QR/link foundation

Sprint 6 should prepare QR/link data for invitation content.

Rules:

- public guest page token/link from Sprint 5 may be embedded as a QR in invitation PDFs;
- check-in QR/token must remain separate and should not be implemented as the same token;
- if check-in token is introduced as a placeholder, it must be separate by type and not activate full check-in behavior;
- tokens must be short, secure, and revocable or regeneratable.

Do not implement check-in scan flow in Sprint 6.

### 6.9 Generation validation

Before generating invitations, validate:

- event has active approved template;
- template has required dynamic fields configured;
- guest is assigned/invited to event;
- guest has title/type;
- guest has display name;
- public guest token exists if public-page QR/link is required;
- printed-only guests are allowed without WhatsApp number;
- optional table fields are handled safely if tables are not yet implemented;
- required custom fields are present;
- payment gate/sending gate is not used to block generation unless documented; payment gate should mainly affect guest-page access and sending.

Rows/guests failing validation must be excluded from generation and reported.

### 6.10 PDF generation foundation

Sprint 6 should implement PDF generation or a clearly isolated PDF worker abstraction.

Minimum PDF generation behavior:

- use uploaded PDF template;
- place text fields according to configuration;
- place QR/image fields according to configuration;
- support basic font size control;
- support long-name fitting or controlled fallback;
- generate output PDF per guest;
- store output in app-owned storage;
- register file metadata;
- link generated file to invitation record.

If advanced PDF rendering is too large, the agent must still deliver a tested generation abstraction and clearly document the remaining implementation gap.

### 6.11 Text fitting foundation

Sprint 6 should support at least one safe text-fitting strategy:

- reduce font size down to a minimum;
- optionally split long names into two lines;
- avoid overflowing the configured field box where practical;
- log or mark failure when text cannot fit.

Do not silently create broken PDFs.

### 6.12 Batch generation job foundation

Batch generation should not block normal UI requests.

Sprint 6 should implement or prepare:

- generation job record;
- selected generation mode;
- selected guest IDs or event ID;
- queued/running/completed/failed status;
- total count;
- success count;
- failed count;
- validation error summary;
- retry-safe design;
- audit entries.

Generation modes should prepare for:

- preview generation;
- generate by event;
- generate selected guests;
- regenerate selected guests.

Generation by table/status/all may be placeholders until seating/status workflows exist.

### 6.13 Invitation file/version foundation

Generated invitation files must support versioning.

Rules:

- regenerated invitations create a new version;
- latest active file is marked;
- older versions remain internal;
- guest public page should later expose only latest active file;
- audit logs record generation and regeneration.

### 6.14 Regeneration foundation

Sprint 6 should prepare the regeneration logic.

A guest/invitation should be marked `needs_regeneration` when relevant data changes, such as:

- guest display name;
- guest title/type;
- event details used in template;
- public guest token regeneration;
- template change;
- field configuration change.

If automatic data-change detection is not fully implemented, document the gap and add a service/helper placeholder.

### 6.15 Basic UI

Add basic internal UI for:

- event invitation template list;
- template upload;
- template configuration;
- field configuration form;
- sample preview generation;
- technical preview approval;
- invitation generation validation results;
- generation job status;
- generated invitation list;
- download latest generated invitation file for authorized internal users.

Keep the UI functional and secure. Final design polish can come later.

---

## 7. Out of scope

Do not implement the following in Sprint 6:

- WhatsApp sending;
- invitation sending workflow;
- message templates;
- RSVP reminders;
- seating/table assignment workflow;
- check-in scan flow;
- check-in dashboard;
- contracts;
- pricing;
- payments;
- partner project creation;
- full Canva API integration;
- full visual drag-and-drop editor if coordinate editor is delivered;
- final guest-page redesign;
- guest self-service regeneration;
- bulk sending or communication workflows.

If a future dependency is discovered, document it as a follow-up. Do not build it silently.

---

## 8. Recommended database objects

The agent may choose final names based on existing conventions, but the following objects are expected conceptually:

```text
invitation_templates
invitation_template_fields
invitations
invitation_files
invitation_generation_jobs
invitation_generation_job_items
```

Optional, if useful and low-risk:

```text
invitation_preview_samples
invitation_validation_results
invitation_regeneration_events
```

The implementation must integrate with existing project, event, guest, guest event assignment, public token, file, storage, permission, and audit foundations.

Do not create WhatsApp, seating, check-in, contract, pricing, or payment domain tables in Sprint 6.

---

## 9. Recommended backend/API foundations

The agent may implement API routes, server actions, or service modules according to the existing app architecture.

Expected service capabilities:

- upload invitation template;
- list templates for event;
- activate/archive template;
- save template field configuration;
- validate template configuration;
- generate technical preview;
- approve technical preview;
- create invitation records for event guests;
- validate guests for invitation generation;
- create generation job;
- process generation job or prepare worker abstraction;
- generate PDF for one guest;
- generate PDF for selected guests;
- store generated files;
- version invitation files;
- mark invitation as generated/failed/needs_regeneration;
- write audit logs.

All backend operations must enforce permissions server-side.

---

## 10. Permission rules

Sprint 6 must enforce or prepare these permission rules.

### 10.1 Diginoces/admin

Can:

- upload invitation templates;
- configure dynamic fields;
- generate previews;
- approve technical preview;
- generate/regenerate invitations;
- view generated invitation files;
- archive templates;
- view generation logs.

### 10.2 Diginoces staff

Can act according to assigned permissions.

Possible staff permissions:

- upload templates;
- configure fields;
- generate previews;
- generate invitations;
- view generation results.

Staff should not automatically approve technical previews unless the RBAC foundation grants that permission.

### 10.3 Bride/groom

Can:

- view design approval status if implemented;
- possibly view selected preview if explicitly allowed by Diginoces/admin.

Cannot:

- upload operational templates;
- approve technical preview;
- mass-generate invitations;
- access other guests' generated files;
- access internal generation logs;
- bypass validation rules.

### 10.4 Guest

Can later access only their latest active invitation file through the public guest page.

Sprint 6 may prepare this linkage, but guest download behavior should remain consistent with Sprint 5 access rules.

---

## 11. Testing expectations

Sprint 6 must add tests for invitation template and PDF generation foundations.

At minimum, tests should cover:

- template can be uploaded/registered for an event;
- only authorized users can upload/configure templates;
- template belongs to an event inside a project;
- field configuration can be saved and validated;
- generation is blocked without technical preview approval;
- technical preview approval records approver and timestamp;
- public guest token/link field is separate from future check-in token type;
- generation validation catches missing guest title/type;
- generation validation catches missing guest display name;
- generation validation catches missing public guest token when required;
- printed-only guest can be handled without WhatsApp number;
- invitation record can be created for event guest assignment;
- generated file is versioned and linked to invitation;
- regeneration creates a new version or marks needs_regeneration;
- PDF/text fitting helper handles long name case or reports failure safely;
- audit entries are written or audit abstraction is called;
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

Sprint 6 is complete only when:

- event-level invitation template model exists;
- template upload/registration foundation exists;
- template field configuration foundation exists;
- technical preview workflow exists;
- full generation is blocked until technical preview approval;
- invitation record model exists;
- invitation file/version foundation exists;
- secure public guest page QR/link can be used as a dynamic field;
- check-in token/QR remains separate and is not conflated with public guest token;
- generation validation exists;
- batch generation job foundation exists;
- PDF generation or a tested PDF worker abstraction exists;
- long-name/text-fitting foundation exists or reports failure safely;
- generated files are stored/registered securely;
- permission checks prevent unauthorized template/generation actions;
- audit logging exists for template/generation actions;
- tests are added and pass;
- CI passes;
- documentation is updated;
- Sprint 6 completion report is created.

---

## 13. Required deliverables

The Sprint 6 PR must include:

- database migration(s) for invitation templates, fields, invitation records, generation jobs, and file versions;
- TypeScript types updated/generated as needed;
- template upload/registration logic;
- dynamic field configuration logic;
- technical preview logic;
- preview approval logic;
- invitation generation validation logic;
- PDF generation or PDF worker abstraction;
- generation job foundation;
- invitation file/version foundation;
- permission checks for invitation operations;
- audit integration for template and generation actions;
- minimal UI for template upload/configuration/preview/generation;
- tests for invitation generation foundation;
- documentation updates;
- `docs/planning/sprint-6-completion-report.md`.

---

## 14. Sprint 6 completion report template

The agent must create:

```text
docs/planning/sprint-6-completion-report.md
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
- template upload behavior implemented;
- field configuration behavior implemented;
- preview/approval behavior implemented;
- PDF/generation behavior implemented;
- token/QR separation behavior implemented;
- audit-log behavior implemented;
- assumptions made;
- open issues or blockers;
- out-of-scope items intentionally deferred;
- recommended Sprint 7 scope.

---

## 15. Recommended Sprint 7 scope

Sprint 7 should handle:

- WhatsApp-first communication workflow foundation;
- message templates;
- guided manual sending;
- invitation sending readiness;
- message status tracking;
- invitation resend foundation;
- modification message foundation;
- Maybe reminder scheduling foundation, if ready.

Sprint 7 should not build seating, check-in, contracts, or payments unless the approved roadmap changes.

---

## 16. Codex prompt for Sprint 6

Use this prompt when assigning Codex to Sprint 6:

```text
You are the Orchestrator Agent for the Diginoces platform.

Repository: carlkanda/diginoces-platform

Work only on Sprint 6: Invitation Template & PDF Generation.

Before coding, read AGENTS.md and the relevant documents:
- docs/planning/sprint-6-plan.md
- docs/planning/sprint-5-plan.md
- docs/planning/mvp-build-execution-plan.md
- docs/product/06-invitation-template-pdf-generation.md
- docs/product/05-rsvp-public-guest-page.md
- docs/product/04-guest-management-guest-lists.md
- docs/product/03-wedding-project-structure.md
- docs/product/14-files-storage-retention-security.md
- docs/technical-design/database-schema-core-entities.md
- docs/technical-design/api-backend-service-design.md
- docs/technical-design/background-jobs-pdf-qr-whatsapp-offline-checkin.md
- docs/technical-design/security-permissions-access-control.md
- docs/backlog/master-requirements-register.csv
- docs/backlog/initial-product-backlog-epics.csv
- docs/backlog/initial-product-backlog-features.csv
- docs/backlog/initial-product-backlog-user-stories.csv
- docs/backlog/initial-product-backlog-tasks.csv
- docs/backlog/initial-product-backlog-test-cases.csv

Create a new branch:

codex/sprint-6-invitation-template-pdf-generation

Implement Sprint 6 only.

Required scope:
1. Add event-level invitation template model.
2. Add Canva-exported PDF template upload/registration foundation.
3. Add dynamic field configuration foundation.
4. Add visual/coordinate editor foundation.
5. Add technical preview generation workflow.
6. Add technical preview approval workflow.
7. Add invitation record model.
8. Add invitation file/version foundation.
9. Add secure public guest page QR/link dynamic field foundation.
10. Keep public guest page token and future check-in token separate.
11. Add generation validation workflow.
12. Add batch generation job foundation.
13. Add PDF generation or tested PDF worker abstraction.
14. Add long-name/text-fitting foundation.
15. Add permission checks for template/generation operations.
16. Add audit logging for template/generation actions.
17. Add basic UI for template upload, field configuration, preview, approval, and generation results.
18. Add tests.
19. Update documentation.
20. Create docs/planning/sprint-6-completion-report.md.
21. Open a draft PR titled: Sprint 6 — Invitation Template & PDF Generation.

Out of scope:
- WhatsApp sending;
- invitation sending workflow;
- seating;
- check-in;
- contracts;
- pricing;
- payments;
- partner project creation;
- full Canva API integration.

The PR must reference the Sprint 6 issue.

Do not mark Sprint 6 complete unless tests/checks are documented.
```

---

## 17. Summary

Sprint 6 turns the guest and RSVP foundation into actual personalized invitation output capability.

It should keep Canva as the design tool while making Diginoces responsible for template configuration, validation, previews, secure links/QRs, PDF generation, file versioning, and auditability.

The expected result is a controlled invitation-generation foundation that prepares the platform for WhatsApp-first sending workflows in Sprint 7.
