# Sprint 14 Plan — Files, Storage, Retention & Archive

## 1. Sprint goal

Sprint 14 builds the **Files, Storage, Retention & Archive** hardening layer for the Diginoces platform.

The goal is to finalize and secure the way Diginoces stores, organizes, versions, serves, archives, and eventually purges project files generated or uploaded across the platform.

Sprint 14 must establish:

- project file library hardening;
- event-level file organization;
- guest-specific file access controls;
- secure download behavior;
- file category finalization;
- file versioning and active/latest rules;
- generated file lifecycle controls;
- export/file registry hardening;
- retention policy foundation;
- project archive lifecycle;
- retention notifications/placeholders;
- admin archive controls;
- secure deletion/archive workflow foundation;
- audit logging for sensitive file and archive actions.

Sprint 14 must not build AI assistance, advanced integrations, partner white-label SaaS scaling, or new product modules outside file/storage/archive hardening.

---

## 2. Source documents

Before coding, the agent must read and follow:

- `AGENTS.md`
- `docs/agent-system/00-ai-agent-build-system-governance.md`
- `docs/agent-system/agent-role-prompts.md`
- `docs/agent-system/agent-execution-workflow.md`
- `docs/planning/mvp-build-execution-plan.md`
- `docs/planning/sprint-13-plan.md`
- `docs/product/14-files-storage-retention-security.md`
- `docs/product/06-invitation-template-pdf-generation.md`
- `docs/product/09-tables-seating-print-materials.md`
- `docs/product/10-contracts-pricing-payment-controls.md`
- `docs/product/11-post-event-messages.md`
- `docs/product/13-dashboards-reports-audit-logs.md`
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

Sprint 14 depends on Sprint 13 being merged into `main`.

Sprint 14 must assume these foundations already exist:

- secure platform foundation;
- project and event models;
- guest, RSVP, invitation, communication, seating, check-in, contract/payment, dashboard, guest-book, feedback, and partner foundations;
- file registry/storage abstraction foundation;
- generated invitation file/version foundation;
- report/export file foundation;
- guest-book export/file foundation;
- RBAC and permission foundations;
- audit-log foundation.

If any Sprint 13 dependency is missing, the agent must stop, report the blocker, and avoid creating workaround models that conflict with the planned architecture.

---

## 4. Backlog scope

Sprint 14 focuses on the **Files, Storage, Retention & Security** epic.

Primary epic:

- `EPIC-FILE` — Files, Storage, Retention & Security

Primary features:

- `FEAT-FILE-001` — App-owned storage hardening
- `FEAT-FILE-002` — Project file library hardening
- `FEAT-FILE-003` — Event-level file organization
- `FEAT-FILE-004` — Guest-specific file access controls
- `FEAT-FILE-005` — File version history and active/latest marker
- `FEAT-FILE-006` — Secure guest-facing downloads
- `FEAT-FILE-007` — Upload validation and safety controls
- `FEAT-FILE-008` — Canva/export file metadata and versioning
- `FEAT-FILE-009` — Retention and archive workflow
- `FEAT-FILE-010` — Project archive lifecycle

If the exact feature IDs differ in the CSV backlog, the agent must use the matching backlog rows and document the actual IDs in the Sprint 14 completion report.

---

## 5. Requirement IDs covered

Sprint 14 should primarily cover or begin coverage for:

- `FILE-001` — App-owned storage as official storage system
- `FILE-002` — Project file library with categories
- `FILE-003` — Event-level files such as templates, reports, table CSVs, and check-in reports
- `FILE-004` — Guest-specific files linked to guest, event, invitation ID, version, and active status
- `FILE-005` — Key files support version history with active/latest marker
- `FILE-006` — Guest-facing downloads use secure, revocable links and expose only own files
- `FILE-007` — Project files retained for one year after wedding before deletion/archive action
- `FILE-008` — Canva CSV exports stored with metadata and versioning
- `FILE-009` — File uploads validate type, size, corruption, and dangerous formats
- `PV-006` — Future app uses app-owned file storage rather than Google Drive as operational storage
- `REP-005` — Report exports by permission and format
- `REP-006` — Audit logs for sensitive actions
- `ROLE-001` — Role-based permission model
- `ROLE-002` — Admin full platform control
- `ROLE-003` — Staff access based on assignment and permissions
- `ROLE-004` — Partner access restrictions
- `ROLE-009` — Guests access only their own public page/files
- `TECH-004` — Backend permission enforcement

Sprint 14 may reference future requirements, but it must not implement future modules unless explicitly in scope.

---

## 6. In scope

Sprint 14 may implement the following.

### 6.1 File category finalization

Finalize the file category model used across the platform.

Recommended categories include:

```text
contract
contract_addendum
payment_proof
invitation_template
generated_invitation
qr_asset
import_file
canva_csv_export
table_card_export
guest_book_export
report_export
check_in_export
partner_document
project_archive
other
```

The exact enum/table design may follow existing conventions, but categories must be consistent, documented, and testable.

### 6.2 Project file library hardening

The project file library should support:

- list files by project;
- filter by category;
- filter by event;
- filter by guest where allowed;
- filter by active/latest;
- show version history;
- show created_by and created_at;
- show file status;
- show retention/archive status.

The library must enforce role-based access server-side.

### 6.3 Event-level file organization

Event-level files should support event-specific operational assets such as:

- invitation templates;
- generated invitations;
- table-card CSVs;
- seating exports;
- check-in reports;
- event-specific reports.

An event-level file must belong to a project and event.

Users without access to the event should not access the file.

### 6.4 Guest-specific file access controls

Guest-specific files include:

- generated invitation PDFs;
- guest-specific QR assets if stored;
- guest-facing files available through public page.

Rules:

- guests can access only their own active guest-facing files;
- old versions remain internal;
- public links must be revocable or regeneratable;
- access should be logged where appropriate;
- internal users require permission to view/download guest-specific files.

### 6.5 Secure download behavior

Implement or harden secure file download behavior.

Rules:

- no raw storage paths should be exposed without authorization;
- signed URLs should be short-lived where supported;
- guest-facing downloads should validate guest token and file ownership;
- internal downloads should validate user permission and project/event access;
- revoked/inactive files should not be downloadable through guest-facing paths;
- sensitive downloads should be audited.

### 6.6 File versioning and active/latest rules

Key generated files must support versioning.

Files requiring versioning include:

- generated invitations;
- contracts;
- addendums;
- report exports;
- Canva CSV exports;
- guest-book exports;
- table-card exports.

Rules:

- new versions do not destroy old versions;
- exactly one active/latest version should exist per version group where applicable;
- old versions remain internal unless explicitly allowed;
- guest-facing access always uses latest active version;
- version changes are audited.

### 6.7 Upload validation and safety controls

File uploads must validate:

- allowed MIME type;
- extension;
- file size;
- empty/corrupt file behavior;
- dangerous extensions;
- category-specific rules;
- project/event/guest association.

Minimum allowed types should be explicit, for example:

```text
PDF
CSV
XLSX if needed
PNG/JPG/WebP for images where allowed
TXT/MD for safe internal notes if needed
```

Do not allow executable/script files as project uploads.

### 6.8 Generated file lifecycle controls

Generated files should have lifecycle states.

Recommended statuses:

```text
generated
active
superseded
archived
failed
deleted
pending_cleanup
```

The system should support safe cleanup planning without accidentally deleting active/latest files.

### 6.9 Canva/export file metadata

Canva-related exports should store metadata such as:

- export type;
- source module;
- project ID;
- event ID if applicable;
- generated_by;
- generated_at;
- row count;
- included item count;
- excluded item count;
- file version;
- active/latest marker.

This applies to:

- table-card CSV exports;
- guest-book CSV exports;
- report CSV exports;
- other Canva Bulk Create exports.

### 6.10 Retention policy foundation

Project files should be retained for one year after the wedding.

Retention workflow should support:

- project completion date;
- retention start date;
- retention end date;
- retention status;
- retention warning/notice status;
- admin decision: keep, archive, extend, delete;
- audit log entries.

Recommended retention statuses:

```text
active
completed
retention_active
retention_due
retention_extended
archived
pending_deletion
deleted
```

Sprint 14 may implement the retention engine foundation and admin controls without automatic deletion if automation is not ready.

### 6.11 Project archive lifecycle

Add or harden project archive lifecycle.

Project archive should support:

- marking project completed;
- moving project to archived status;
- locking most operational edits after archive;
- preserving files and reports for retention period;
- allowing admin-only access after archive;
- retaining audit logs.

Archiving must not delete files automatically.

### 6.12 Retention notices/placeholders

Sprint 14 may implement retention notice placeholders.

Examples:

- admin dashboard indicator for projects nearing retention end;
- retention_due status;
- retention report/export;
- manual admin review queue.

Do not implement automated destructive deletion unless explicitly safe and tested.

### 6.13 Secure deletion/archive workflow foundation

If deletion is implemented, it must be controlled.

Rules:

- only Diginoces/admin can approve deletion;
- active/latest files cannot be deleted accidentally;
- deletion is soft-delete or archived first where practical;
- deletion reason is required;
- deletion is audited;
- sensitive files may require additional confirmation.

Sprint 14 should prefer safe archive/soft-delete foundation over hard deletion.

### 6.14 Storage provider abstraction hardening

Harden existing storage provider abstraction.

The abstraction should support:

- upload;
- download/signed URL;
- delete/archive where supported;
- metadata registration;
- file versioning;
- error handling;
- fail-closed behavior;
- provider-specific configuration.

Do not hardcode storage provider logic throughout modules.

### 6.15 Basic UI

Add basic UI for:

- project file library;
- event file list;
- guest-specific file view for internal users;
- file details page;
- file version history;
- secure download action;
- file category filters;
- archive/retention status;
- retention review queue;
- project archive controls;
- export/file history.

Keep UI functional and permission-aware.

Sprint 14 is not final document management polish.

### 6.16 Audit logging

File/storage/archive actions that should be audited include:

- file uploaded;
- file registered;
- file downloaded if sensitive;
- guest-facing signed URL generated;
- file version created;
- active/latest file changed;
- file archived;
- file soft-deleted;
- file retention extended;
- project archived;
- retention status changed;
- file access denied if security-relevant;
- export file generated/registered.

Audit logs must not expose secrets or raw private storage credentials.

---

## 7. Out of scope

Do not implement the following in Sprint 14:

- AI assistance;
- advanced integrations;
- direct Canva API integration;
- partner white-label SaaS;
- partner commission management;
- online payment provider integration;
- external accounting storage sync;
- full data warehouse/archive integration;
- automated destructive file deletion without admin review;
- public marketing asset library;
- full digital asset management system beyond MVP needs.

If a future dependency is discovered, document it as a follow-up. Do not build it silently.

---

## 8. Recommended database objects

The agent may choose final names based on existing conventions, but the following objects are expected conceptually:

```text
file_categories
file_versions
file_access_events
file_retention_policies
project_archive_events
file_archive_events
file_download_tokens
```

Optional, if useful and low-risk:

```text
retention_review_items
file_cleanup_jobs
storage_provider_events
```

The implementation must integrate with existing project, event, guest, invitation, contract, payment, report, guest-book, partner, permission, and audit foundations.

Do not create AI, advanced integration, partner billing, or white-label SaaS tables in Sprint 14.

---

## 9. Recommended backend/API foundations

The agent may implement API routes, server actions, or service modules according to the existing app architecture.

Expected service capabilities:

- list project files;
- list event files;
- get file details;
- register file;
- upload file;
- validate file;
- create new file version;
- mark active/latest version;
- generate signed download URL;
- validate guest-facing download ownership;
- archive file;
- soft-delete file if supported;
- compute retention status;
- mark project completed;
- archive project;
- extend retention;
- list retention review items;
- generate file/export history;
- write audit logs.

All backend operations must enforce permissions server-side.

---

## 10. Permission rules

Sprint 14 must enforce or prepare these permission rules.

### 10.1 Diginoces/admin

Can:

- view all project files;
- upload/register files;
- manage file categories;
- view version history;
- archive/soft-delete files;
- extend retention;
- archive projects;
- access retention review queue;
- view sensitive file audit history if allowed.

### 10.2 Diginoces staff

Can act according to assigned permissions.

Possible staff permissions:

- upload files for assigned projects/events;
- view assigned project files;
- download operational files;
- generate/export files;
- view version history for assigned files;
- archive files if granted.

Staff should not automatically delete files or extend retention unless explicitly granted.

### 10.3 Bride/groom

Can:

- view/download files explicitly made available to them;
- access latest active guest-facing/couple-facing versions;
- view selected final reports or guest-book files if allowed.

Cannot:

- view internal files;
- view old internal versions unless allowed;
- view payment proofs unless intended;
- view audit logs;
- delete/archive files;
- access other projects' files.

### 10.4 Partner / external provider

Can:

- view files explicitly made available for assigned projects, if allowed;
- access only non-sensitive operational files.

Cannot:

- view revenue/payment files;
- view payment proofs;
- view internal notes;
- view audit logs;
- access files from other partners/projects;
- manage retention/deletion.

### 10.5 Guest

Can:

- access only their own active guest-facing files through secure public token;
- download latest active invitation file when guest page rules allow it.

Cannot:

- list project files;
- access other guests' files;
- access old versions;
- access internal files;
- access archive or audit data.

---

## 11. Testing expectations

Sprint 14 must add tests for files, storage, retention, and archive behavior.

At minimum, tests should cover:

- admin can register/upload file;
- unauthorized user cannot register/upload file;
- file category validation works;
- invalid/dangerous file types are rejected;
- file versioning preserves old versions;
- only one latest active file exists per version group where applicable;
- guest-facing download returns only the guest's own active file;
- guest cannot download another guest's file;
- inactive/revoked file cannot be downloaded through public route;
- staff can view only assigned project/event files;
- partner cannot view payment/internal files;
- couple cannot view internal files or audit logs;
- report/Canva export file metadata is stored correctly;
- retention date/status calculation works;
- project archive locks operational edits where intended;
- file archive/soft-delete requires admin permission;
- deletion/archive action requires reason if implemented;
- file/retention/archive actions produce audit entries or call audit abstraction;
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

Sprint 14 is complete only when:

- project file library is hardened;
- event-level file organization exists;
- guest-specific file access controls exist;
- secure download behavior exists;
- file categories are finalized or strongly defined;
- upload validation exists;
- file version history exists;
- active/latest version behavior exists;
- Canva/report/export file metadata is handled;
- retention policy foundation exists;
- project archive lifecycle exists;
- archive/soft-delete foundation exists;
- role-based file visibility is enforced server-side;
- guest-facing download ownership is enforced;
- audit logging exists for file/storage/archive actions;
- tests are added and pass;
- CI passes;
- documentation is updated;
- Sprint 14 completion report is created.

---

## 13. Required deliverables

The Sprint 14 PR must include:

- database migration(s) for file categories, versions, access events, retention policies, archive events, and download tokens if needed;
- TypeScript types updated/generated as needed;
- storage provider abstraction hardening;
- file validation logic;
- secure download logic;
- file versioning logic;
- project/event/guest file listing logic;
- file archive/soft-delete foundation;
- retention calculation logic;
- project archive lifecycle logic;
- permission checks for file/storage/archive operations;
- audit integration for file/storage/archive actions;
- minimal UI for project file library, file details, version history, retention review, and archive controls;
- tests for file/storage/retention foundations;
- documentation updates;
- `docs/planning/sprint-14-completion-report.md`.

---

## 14. Sprint 14 completion report template

The agent must create:

```text
docs/planning/sprint-14-completion-report.md
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
- file library behavior implemented;
- secure download behavior implemented;
- file versioning behavior implemented;
- retention/archive behavior implemented;
- permission behavior implemented;
- audit-log behavior implemented;
- assumptions made;
- open issues or blockers;
- out-of-scope items intentionally deferred;
- recommended Sprint 15 scope.

---

## 15. Recommended Sprint 15 scope

Sprint 15 should handle:

- release hardening;
- MVP QA pass;
- end-to-end workflow testing;
- role/permission security review;
- RLS/security advisor review;
- seed/demo data cleanup;
- deployment readiness;
- environment/secrets review;
- documentation polish;
- MVP launch checklist;
- production-readiness gap list.

Sprint 15 should not build new major features unless needed to unblock MVP launch.

---

## 16. Codex prompt for Sprint 14

Use this prompt when assigning Codex to Sprint 14:

```text
You are the Orchestrator Agent for the Diginoces platform.

Repository: carlkanda/diginoces-platform

Work only on Sprint 14: Files, Storage, Retention & Archive.

Before coding, read AGENTS.md and the relevant documents:
- docs/planning/sprint-14-plan.md
- docs/planning/sprint-13-plan.md
- docs/planning/mvp-build-execution-plan.md
- docs/product/14-files-storage-retention-security.md
- docs/product/06-invitation-template-pdf-generation.md
- docs/product/09-tables-seating-print-materials.md
- docs/product/10-contracts-pricing-payment-controls.md
- docs/product/11-post-event-messages.md
- docs/product/13-dashboards-reports-audit-logs.md
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

codex/sprint-14-files-storage-retention-archive

Implement Sprint 14 only.

Required scope:
1. Harden project file library.
2. Add event-level file organization.
3. Add guest-specific file access controls.
4. Add secure download behavior.
5. Finalize or strongly define file categories.
6. Add upload validation and safety controls.
7. Add file version history and active/latest behavior.
8. Add Canva/report/export file metadata handling.
9. Add retention policy foundation.
10. Add project archive lifecycle.
11. Add archive/soft-delete foundation.
12. Harden storage provider abstraction.
13. Add permission checks for file/storage/archive operations.
14. Add audit logging for file/storage/archive actions.
15. Add basic UI for file library, file details, version history, retention review, and archive controls.
16. Add tests.
17. Update documentation.
18. Create docs/planning/sprint-14-completion-report.md.
19. Open a draft PR titled: Sprint 14 — Files, Storage, Retention & Archive.

Out of scope:
- AI assistance;
- advanced integrations;
- direct Canva API integration;
- partner white-label SaaS;
- partner commission management;
- online payment provider integration;
- external accounting storage sync;
- automated destructive deletion without admin review.

The PR must reference the Sprint 14 issue.

Do not mark Sprint 14 complete unless tests/checks are documented.
```

---

## 17. Summary

Sprint 14 hardens the file and storage foundation used by every operational module in Diginoces.

It should make project files secure, organized, versioned, auditable, and governed by retention/archive rules.

The expected result is a safer, MVP-ready document and generated-file layer that prepares the platform for release hardening and MVP launch in Sprint 15.
